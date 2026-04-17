import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

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

function buildPublicObjectUrl(key: string) {
  const bucket = process.env.AWS_S3_BUCKET_NAME;
  const region = process.env.AWS_REGION;

  if (!bucket || !region) {
    return null;
  }

  if (region === "us-east-1") {
    return `https://${bucket}.s3.amazonaws.com/${key}`;
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  const { fileName, contentType, action, folder } = await request.json();

  if (!ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  if (action === "upload") {
    if (!folder || !ALLOWED_FOLDERS.has(folder)) {
      return NextResponse.json({ error: "Invalid upload folder" }, { status: 400 });
    }

    if (!fileName || !isSafeFileName(fileName)) {
      return NextResponse.json({ error: "Invalid upload file name" }, { status: 400 });
    }

    if (!contentType || typeof contentType !== "string") {
      return NextResponse.json({ error: "Missing content type" }, { status: 400 });
    }

    if (!["image/png", "image/jpeg", "image/jpg"].includes(contentType)) {
      return NextResponse.json({ error: "Invalid content type for upload" }, { status: 400 });
    }
  }

  if (action === "download") {
    if (!fileName || !isSafeObjectKey(fileName)) {
      return NextResponse.json({ error: "Invalid object key for download" }, { status: 400 });
    }
  }

  // Define your folder path here
  const uploadFolder = folder || "members";
  const s3Key = `${uploadFolder}/${fileName}`;

  try {
    let command;
    if (action === "upload") {
      command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: s3Key,
        ContentType: contentType,
      });
    } else {
      command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: fileName,
      });
    }

    // URL expires in 60 seconds
    const url = await getSignedUrl(s3Client, command, { expiresIn: 60 });
    if (action === "upload") {
      return NextResponse.json({
        url,
        s3Key,
        fileUrl: buildPublicObjectUrl(s3Key),
        signedContentType: contentType,
      });
    }

    return NextResponse.json({ url, s3Key });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate URL" }, { status: 500 });
  }
}