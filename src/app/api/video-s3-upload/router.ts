import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { logApiRouteError } from "@/components/api/api-error-logger";
import { getMemberPageDetails } from "@/features/family/services/family-services";
import { getVideoS3ClientContext } from "@/lib/video-s3-client-factory";
import { extractS3KeyFromValue } from "@/lib/s3-object-key";

const SAFE_FILE_NAME_REGEX = /^[A-Za-z0-9._-]+$/;
const VIDEO_PREFIX = "videos";

function isSafeFileName(fileName: string) {
  return SAFE_FILE_NAME_REGEX.test(fileName) && !fileName.includes("..") && !fileName.includes("/") && !fileName.includes("\\");
}

function isSafeObjectKey(key: string) {
  const segments = key.split("/").filter(Boolean);

  if (segments.length !== 2) {
    return false;
  }

  const [folder, fileName] = segments;
  if (folder !== VIDEO_PREFIX) {
    return false;
  }

  return isSafeFileName(fileName);
}

function buildPublicObjectUrl(key: string, bucket: string, region: string) {
  if (region === "us-east-1") {
    return `https://${bucket}.s3.amazonaws.com/${key}`;
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

function buildS3Uri(key: string, bucket: string) {
  return `s3://${bucket}/${key}`;
}

export async function GET(request: Request) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn || !memberDetails.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const keyParam = searchParams.get("key");
  const normalizedObjectKey = extractS3KeyFromValue(keyParam);

  if (!normalizedObjectKey || !isSafeObjectKey(normalizedObjectKey)) {
    return NextResponse.json({ error: "Invalid object key" }, { status: 400 });
  }

  try {
    const s3Context = await getVideoS3ClientContext();
    const response = await s3Context.client.send(
      new GetObjectCommand({
        Bucket: s3Context.bucketName,
        Key: normalizedObjectKey,
      })
    );

    const bodyBytes = await response.Body?.transformToByteArray();

    if (!bodyBytes) {
      return NextResponse.json({ error: "Object not found" }, { status: 404 });
    }

    return new NextResponse(Uint8Array.from(bodyBytes), {
      status: 200,
      headers: {
        "Content-Type": response.ContentType ?? "video/mp4",
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    logApiRouteError("api.video-s3-upload.GET.streamObject", error, {
      key: normalizedObjectKey,
      route: "video-s3-upload",
    });
    return NextResponse.json({ error: "Failed to load video" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn || !memberDetails.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fileName, contentType, action } = await request.json();

  if (!["upload", "download"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  if (action === "upload") {
    if (!fileName || !isSafeFileName(fileName)) {
      return NextResponse.json({ error: "Invalid upload file name" }, { status: 400 });
    }

    if (contentType !== "video/mp4") {
      return NextResponse.json({ error: "Only MP4 uploads are supported" }, { status: 400 });
    }
  }

  const normalizedDownloadKey = action === "download" ? extractS3KeyFromValue(fileName) : null;
  if (action === "download") {
    if (!normalizedDownloadKey || !isSafeObjectKey(normalizedDownloadKey)) {
      return NextResponse.json({ error: "Invalid object key for download" }, { status: 400 });
    }
  }

  const objectKey = action === "upload" ? `${VIDEO_PREFIX}/${fileName}` : normalizedDownloadKey!;

  try {
    const s3Context = await getVideoS3ClientContext();

    if (action === "upload") {
      const command = new PutObjectCommand({
        Bucket: s3Context.bucketName,
        Key: objectKey,
        ContentType: contentType,
      });

      const url = await getSignedUrl(s3Context.client, command, { expiresIn: 120 });

      return NextResponse.json({
        url,
        s3Key: objectKey,
        s3Uri: buildS3Uri(objectKey, s3Context.bucketName),
        fileUrl: buildPublicObjectUrl(objectKey, s3Context.bucketName, s3Context.region),
        signedContentType: contentType,
        videoS3CredentialId: s3Context.credentialId,
      });
    }

    return NextResponse.json({
      url: `/api/video-s3-upload?key=${encodeURIComponent(objectKey)}`,
      s3Key: objectKey,
    });
  } catch (error) {
    logApiRouteError("api.video-s3-upload.POST.generateUrl", error, {
      action,
      fileName,
      route: "video-s3-upload",
    });
    return NextResponse.json({ error: "Failed to generate URL" }, { status: 500 });
  }
}