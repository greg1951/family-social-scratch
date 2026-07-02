import db from "@/components/db/drizzle";
import { videoS3Credentials } from "@/components/db/schema/global-schema-tables";
import { decryptS3Value } from "@/lib/s3-encryption";
import { desc, eq } from "drizzle-orm";

export type VideoS3Credential = {
  id: number;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  region: string;
};

type CachedCredential = {
  value: VideoS3Credential;
  expiresAt: number;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
let credentialCache: CachedCredential | null = null;

export function clearVideoS3CredentialCache() {
  credentialCache = null;
}

export async function getActiveVideoS3Credential(): Promise<VideoS3Credential> {
  const now = Date.now();
  if (credentialCache && credentialCache.expiresAt > now) {
    return credentialCache.value;
  }

  const [row] = await db
    .select({
      id: videoS3Credentials.id,
      encryptedAccessKey: videoS3Credentials.encryptedAccessKey,
      encryptedSecretKey: videoS3Credentials.encryptedSecretKey,
      bucketName: videoS3Credentials.bucketName,
      region: videoS3Credentials.region,
    })
    .from(videoS3Credentials)
    .where(eq(videoS3Credentials.isActive, true))
    .orderBy(desc(videoS3Credentials.updatedAt))
    .limit(1);

  if (!row) {
    throw new Error("No active video S3 credential found.");
  }

  let accessKeyId: string;
  let secretAccessKey: string;

  try {
    accessKeyId = decryptS3Value(row.encryptedAccessKey);
    secretAccessKey = decryptS3Value(row.encryptedSecretKey);
  } catch (error) {
    console.error("[video-s3-credentials] failed to decrypt video credentials", {
      credentialId: row.id,
      bucketName: row.bucketName,
      region: row.region,
      hasMasterKey: Boolean(process.env.S3_CREDENTIALS_MASTER_KEY),
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    throw new Error("Failed to decrypt active video S3 credential.");
  }

  const value: VideoS3Credential = {
    id: row.id,
    accessKeyId,
    secretAccessKey,
    bucketName: row.bucketName,
    region: row.region,
  };

  credentialCache = {
    value,
    expiresAt: now + CACHE_TTL_MS,
  };

  return value;
}