import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { getMemberPageDetails } from "@/features/family/services/family-services";
import { getS3ClientForFamily } from "@/lib/s3-client-factory";
import { extractS3KeyFromValue } from "@/lib/s3-object-key";

const ALLOWED_FOLDERS = new Set(["members", "movies", "tv", "music", "foodies", "threads"]);
const ALLOWED_ACTIONS = new Set(["upload", "download"]);
const SAFE_FILE_NAME_REGEX = /^[A-Za-z0-9._-]+$/;

function isSafeFileName(fileName: string) {
  return SAFE_FILE_NAME_REGEX.test(fileName) && !fileName.includes("..") && !fileName.includes("/") && !fileName.includes("\\");
}

function isSafeObjectKey(key: string) {
  const [folder, fileName, ...rest] = key.split("/");
  if (!folder || !fileName || rest.length > 0) {
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

  // console.info("[api/s3-upload] incoming request", {
  //   requestId,
  //   action,
  //   folder,
  //   fileName,
  //   contentType,
  //   memberId: memberDetails.memberId,
  //   familyId: memberDetails.familyId,
  // });

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

  const objectKey = action === "upload" ? `${folder}/${fileName}` : normalizedDownloadKey!;

  try {
    const s3Context = await getS3ClientForFamily(memberDetails.familyId);
    // console.info("[api/s3-upload] resolved S3 context", {
    //   requestId,
    //   familyId: memberDetails.familyId,
    //   bucketName: s3Context.bucketName,
    //   region: s3Context.region,
    //   action,
    //   objectKey,
    // });

    let command;
    if (action === "upload") {
      command = new PutObjectCommand({
        Bucket: s3Context.bucketName,
        Key: objectKey,
        ContentType: contentType,
      });
    } else {
      command = new GetObjectCommand({
        Bucket: s3Context.bucketName,
        Key: objectKey,
      });
    }

    // URL expires in 60 seconds
    const url = await getSignedUrl(s3Context.client, command, { expiresIn: 60 });
    // console.info("[api/s3-upload] generated signed URL", {
    //   requestId,
    //   action,
    //   expiresInSeconds: 60,
    //   objectKey,
    //   bucketName: s3Context.bucketName,
    //   region: s3Context.region,
    // });
    if (action === "upload") {
      return NextResponse.json({
        url,
        s3Key: objectKey,
        fileUrl: buildPublicObjectUrl(objectKey, s3Context.bucketName, s3Context.region),
        signedContentType: contentType,
      });
    }

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