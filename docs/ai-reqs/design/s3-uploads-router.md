
# S3 Upload/Download Route Explanation

Source: router.ts

## What this route does

This route handles image uploads and downloads for authenticated family members by:

- Validating the caller is logged in and has a familyId (137, 142, 240, 250)
- Validating allowed actions and safe S3 key formats (8, 10, 20, 24)
- Generating signed upload URLs for direct browser-to-S3 uploads (314, 320)
- Serving downloads through a protected proxy endpoint (137, 340)

---

## Key guardrails

- Allowed folders: members, movies, tv, music, foodies, threads (8)
- Allowed actions: upload, download (9)
- File names must match a strict safe pattern (10, 20)
- Object keys must be either:
  - folder/fileName (11, 24)
  - family-<id>/folder/fileName
- Upload keys are family-scoped using family-<familyId>/... (61, 306)

These checks reduce path traversal risk and keep tenant data isolated.

---

## Upload flow

1. Client sends POST with action = upload and: (253)
   - fileName
   - contentType
   - folder
   
2. Route validates: (266, 271, 276, 281, 286)
   - User auth/family
   - folder is allowed
   - fileName is safe
   - contentType is one of image/png, image/jpeg, image/jpg

3. Route creates S3 object key: (306, 61)
   - family-<familyId>/<folder>/<fileName>

4. Route creates a PutObject command and signs it (60-second expiry).

5. Route returns JSON:
   - url: signed PUT URL
   - s3Key: stored object key
   - fileUrl: computed public-style S3 URL
   - signedContentType

Result: browser uploads directly to S3 using the signed URL.

---

## Download flow (two-step)

### Step 1: Request a download URL

1. Client sends POST with action = download and fileName/key input. (253, 292)
2. Route normalizes key with extractS3KeyFromValue. (292, 301, 24)
3. Route validates key safety. 
4. Route returns: (340, 351)
   - url = /api/s3-upload?key=<encoded-key>
   - s3Key

This returns a local proxy URL, not the image bytes. (340, 351)

### Step 2: Fetch image bytes from GET endpoint

1. Client requests GET /api/s3-upload?key=... (137, 147, 150)
2. Route validates auth and key safety. (156, 93, 112, 70)
3. Route resolves family S3 client context. 
4. Route tries GetObject. (162)
5. If key not found, it retries with family-scoped key.
6. In development, it may retry with env fallback AWS credentials/context. (169, 177, 185, 203)
7. On success, route streams bytes back with:
   - Content-Type from S3 (or application/octet-stream fallback)
   - Cache-Control: private, max-age=60

Errors: (142, 150, 214, 236, 362)
- 401 for unauthorized
- 400 for invalid input
- 404 when object body missing
- 500 for other failures

---

## Why downloads are proxied through this API

- Enforces app-level authorization before returning image bytes (141)
- Avoids exposing bucket internals and supports safer access control (170, 93)
- Supports migration/fallback behavior (scoped key retry and dev credential fallback)

# Source Code

```tsx
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { getMemberPageDetails } from "@/features/family/services/family-services";
import { getS3ClientForFamily } from "@/lib/s3-client-factory";
import { extractS3KeyFromValue } from "@/lib/s3-object-key";

const ALLOWED_FOLDERS = new Set(["members", "movies", "tv", "music", "foodies", "threads"]);
const ALLOWED_ACTIONS = new Set(["upload", "download"]);
const SAFE_FILE_NAME_REGEX = /^[A-Za-z0-9._-]+$/;
const FAMILY_PREFIX_REGEX = /^family-\d+$/i;
const IS_DEV = process.env.NODE_ENV !== "production";

type ResolvedS3Context = {
  client: S3Client;
  bucketName: string;
  region: string;
};

function isSafeFileName(fileName: string) {
  return SAFE_FILE_NAME_REGEX.test(fileName) && !fileName.includes("..") && !fileName.includes("/") && !fileName.includes("\\");
}

function isSafeObjectKey(key: string) {
  const segments = key.split("/").filter(Boolean);

  let folder: string | undefined;
  let fileName: string | undefined;

  if (segments.length === 2) {
    [folder, fileName] = segments;
  } else if (segments.length === 3 && FAMILY_PREFIX_REGEX.test(segments[0] ?? "")) {
    [, folder, fileName] = segments;
  } else {
    return false;
  }

  if (!ALLOWED_FOLDERS.has(folder)) {
    return false;
  }

  return isSafeFileName(fileName);
}

function buildPublicObjectUrl(key: string, bucket: string, region: string) {
  if (!bucket || !region) {
    return null;
  }

  if (region === "us-east-1") {
    return `https://${bucket}.s3.amazonaws.com/${key}`;
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

function getFamilyScopedPrefix(familyId: number) {
  return `family-${familyId}`;
}

function toFamilyScopedKey(objectKey: string, familyId: number) {
  const prefix = getFamilyScopedPrefix(familyId);
  if (objectKey.toLowerCase().startsWith(`${prefix.toLowerCase()}/`)) {
    return objectKey;
  }

  return `${prefix}/${objectKey}`;
}

function getEnvFallbackS3Context(): ResolvedS3Context | null {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  const region = process.env.AWS_REGION ?? "us-east-2";

  if (!accessKeyId || !secretAccessKey || !bucketName) {
    return null;
  }

  return {
    client: new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    }),
    bucketName,
    region,
  };
}

async function resolveDownloadContext(
  requestId: string,
  baseContext: ResolvedS3Context,
  objectKey: string
): Promise<ResolvedS3Context> {
  if (!IS_DEV) {
    return baseContext;
  }

  const envFallbackContext = getEnvFallbackS3Context();
  const contexts: ResolvedS3Context[] = [baseContext];

  if (envFallbackContext) {
    contexts.push(envFallbackContext);
  }

  let resolved = baseContext;

  for (const candidate of contexts) {
    try {
      await candidate.client.send(
        new HeadObjectCommand({
          Bucket: candidate.bucketName,
          Key: objectKey,
        })
      );

      resolved = candidate;
      break;
    } catch {
      // Continue trying alternate context in development rollout.
    }
  }

  // console.info("[api/s3-upload] download context selected", {
  //   requestId,
  //   objectKey,
  //   bucketName: resolved.bucketName,
  //   region: resolved.region,
  // });

  return resolved;
}

export async function GET(request: Request) {
  const memberDetails = await getMemberPageDetails();
  const requestId = crypto.randomUUID();

  if (!memberDetails.isLoggedIn || !memberDetails.familyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const keyParam = searchParams.get("key");
  const normalizedObjectKey = extractS3KeyFromValue(keyParam);

  if (!normalizedObjectKey || !isSafeObjectKey(normalizedObjectKey)) {
    return NextResponse.json({ error: "Invalid object key" }, { status: 400 });
  }

  let objectKey = normalizedObjectKey;

  try {
    const s3Context = await getS3ClientForFamily(memberDetails.familyId);
    let downloadContext = await resolveDownloadContext(requestId, s3Context, objectKey);

    let response;
    try {
      response = await downloadContext.client.send(
        new GetObjectCommand({
          Bucket: downloadContext.bucketName,
          Key: objectKey,
        })
      );
    } catch (primaryError) {
      const primaryMessage = primaryError instanceof Error ? primaryError.message : "";
      const isKeyNotFound = primaryMessage.toLowerCase().includes("specified key does not exist");
      const familyScopedObjectKey = toFamilyScopedKey(objectKey, memberDetails.familyId);
      const shouldRetryFamilyScoped = isKeyNotFound && familyScopedObjectKey !== objectKey;

      if (shouldRetryFamilyScoped) {
        objectKey = familyScopedObjectKey;
        downloadContext = await resolveDownloadContext(requestId, s3Context, objectKey);
        response = await downloadContext.client.send(
          new GetObjectCommand({
            Bucket: downloadContext.bucketName,
            Key: objectKey,
          })
        );
      } else {
      const envFallbackContext = IS_DEV ? getEnvFallbackS3Context() : null;
      const canRetryWithEnv =
        Boolean(envFallbackContext) &&
        primaryMessage.toLowerCase().includes("access key id you provided does not exist");

      if (!canRetryWithEnv || !envFallbackContext) {
        throw primaryError;
      }

      if (IS_DEV) {
        console.warn("[api/s3-upload] retrying download with env fallback credentials", {
          requestId,
          objectKey,
          primaryErrorMessage: primaryMessage,
          fallbackBucketName: envFallbackContext.bucketName,
          fallbackRegion: envFallbackContext.region,
        });
      }

      response = await envFallbackContext.client.send(
        new GetObjectCommand({
          Bucket: envFallbackContext.bucketName,
          Key: objectKey,
        })
      );
      }
    }

    const bodyBytes = await response.Body?.transformToByteArray();

    if (!bodyBytes) {
      return NextResponse.json({ error: "Object not found" }, { status: 404 });
    }

    const safeBytes = Uint8Array.from(bodyBytes);
    const blob = new Blob([safeBytes], {
      type: response.ContentType ?? "application/octet-stream",
    });

    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": response.ContentType ?? "application/octet-stream",
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    console.error("[api/s3-upload] failed to stream object", {
      requestId,
      familyId: memberDetails.familyId,
      objectKey,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: "Failed to load image" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const memberDetails = await getMemberPageDetails();
  const requestId = crypto.randomUUID();

  if (!memberDetails.isLoggedIn || !memberDetails.familyId) {
    console.warn("[api/s3-upload] unauthorized request", {
      requestId,
      isLoggedIn: memberDetails.isLoggedIn,
      familyId: memberDetails.familyId,
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fileName, contentType, action, folder } = await request.json();

  // if (IS_DEV) {
  //   console.info("[api/s3-upload] request", {
  //     requestId,
  //     action,
  //     fileName,
  //     folder,
  //     familyId: memberDetails.familyId,
  //   });
  // }

  if (!ALLOWED_ACTIONS.has(action)) {
    console.warn("[api/s3-upload] invalid action", { requestId, action });
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  if (action === "upload") {
    if (!folder || !ALLOWED_FOLDERS.has(folder)) {
      console.warn("[api/s3-upload] invalid upload folder", { requestId, folder });
      return NextResponse.json({ error: "Invalid upload folder" }, { status: 400 });
    }

    if (!fileName || !isSafeFileName(fileName)) {
      console.warn("[api/s3-upload] invalid upload file name", { requestId, fileName });
      return NextResponse.json({ error: "Invalid upload file name" }, { status: 400 });
    }

    if (!contentType || typeof contentType !== "string") {
      console.warn("[api/s3-upload] missing content type", { requestId, contentType });
      return NextResponse.json({ error: "Missing content type" }, { status: 400 });
    }

    if (!["image/png", "image/jpeg", "image/jpg"].includes(contentType)) {
      console.warn("[api/s3-upload] invalid content type", { requestId, contentType });
      return NextResponse.json({ error: "Invalid content type for upload" }, { status: 400 });
    }
  }

  const normalizedDownloadKey = action === "download" ? extractS3KeyFromValue(fileName) : null;

  if (action === "download") {
    if (!normalizedDownloadKey || !isSafeObjectKey(normalizedDownloadKey)) {
      console.warn("[api/s3-upload] invalid download object key", {
        requestId,
        fileName,
        normalizedDownloadKey,
      });
      return NextResponse.json({ error: "Invalid object key for download" }, { status: 400 });
    }
  }

  const objectKey =
    action === "upload"
      ? toFamilyScopedKey(`${folder}/${fileName}`, memberDetails.familyId)
      : normalizedDownloadKey!;

  try {
    const s3Context = await getS3ClientForFamily(memberDetails.familyId);

    if (action === "upload") {
      const command = new PutObjectCommand({
        Bucket: s3Context.bucketName,
        Key: objectKey,
        ContentType: contentType,
      });

      const url = await getSignedUrl(s3Context.client, command, { expiresIn: 60 });

      // if (IS_DEV) {
      //   console.info("[api/s3-upload] signed upload URL created", {
      //     requestId,
      //     objectKey,
      //     bucketName: s3Context.bucketName,
      //     region: s3Context.region,
      //   });
      // }

      return NextResponse.json({
        url,
        s3Key: objectKey,
        fileUrl: buildPublicObjectUrl(objectKey, s3Context.bucketName, s3Context.region),
        signedContentType: contentType,
      });
    }

    const downloadContext = await resolveDownloadContext(requestId, s3Context, objectKey);
    const url = `/api/s3-upload?key=${encodeURIComponent(objectKey)}`;

    // if (IS_DEV) {
    //   console.info("[api/s3-upload] proxied download URL created", {
    //     requestId,
    //     objectKey,
    //     bucketName: downloadContext.bucketName,
    //     region: downloadContext.region,
    //     proxyUrl: url,
    //   });
    // }

    return NextResponse.json({ url, s3Key: objectKey });
  } catch (error) {
    console.error("[api/s3-upload] failed to generate signed URL", {
      requestId,
      action,
      familyId: memberDetails.familyId,
      fileName,
      folder,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: "Failed to generate URL" }, { status: 500 });
  }
}
```