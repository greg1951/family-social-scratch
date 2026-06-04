import { S3Client } from "@aws-sdk/client-s3";
import { getActiveVideoS3Credential } from "@/lib/video-s3-credentials";

type VideoS3ClientContext = {
  client: S3Client;
  bucketName: string;
  region: string;
  credentialId: number;
};

type CachedVideoS3ClientContext = VideoS3ClientContext & {
  expiresAt: number;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
let videoS3ClientCache: CachedVideoS3ClientContext | null = null;

export async function getVideoS3ClientContext(): Promise<VideoS3ClientContext> {
  const now = Date.now();

  if (videoS3ClientCache && videoS3ClientCache.expiresAt > now) {
    return {
      client: videoS3ClientCache.client,
      bucketName: videoS3ClientCache.bucketName,
      region: videoS3ClientCache.region,
      credentialId: videoS3ClientCache.credentialId,
    };
  }

  const creds = await getActiveVideoS3Credential();

  const context: CachedVideoS3ClientContext = {
    client: new S3Client({
      region: creds.region,
      credentials: {
        accessKeyId: creds.accessKeyId,
        secretAccessKey: creds.secretAccessKey,
      },
    }),
    bucketName: creds.bucketName,
    region: creds.region,
    credentialId: creds.id,
    expiresAt: now + CACHE_TTL_MS,
  };

  videoS3ClientCache = context;

  return {
    client: context.client,
    bucketName: context.bucketName,
    region: context.region,
    credentialId: context.credentialId,
  };
}

export function clearVideoS3ClientCache() {
  videoS3ClientCache = null;
}