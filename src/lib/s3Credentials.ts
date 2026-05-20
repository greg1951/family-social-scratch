import db from "@/components/db/drizzle";
import { familyS3Credentials } from "@/components/db/schema/family-social-schema-tables";
import { decryptS3Value } from "@/lib/s3-encryption";
import { and, desc, eq } from "drizzle-orm";

export interface S3Credential {
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  region: string;
}

// In-memory TTL cache for credentials
type CachedCredential = {
  value: S3Credential;
  expiresAt: number;
};
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const credentialCache = new Map<number, CachedCredential>();

/**
 * Clear the credential cache for a specific family or all families.
 * @param familyId Optional family id to clear. If omitted, clears all.
 */
export function clearS3CredentialCache(familyId?: number) {
  if (typeof familyId === "number") {
    credentialCache.delete(familyId);
  } else {
    credentialCache.clear();
  }
}

export async function getActiveS3CredentialForFamily(familyId: number): Promise<S3Credential> {
  const now = Date.now();
  const cached = credentialCache.get(familyId);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const [row] = await db
    .select()
    .from(familyS3Credentials)
    .where(and(eq(familyS3Credentials.familyId, familyId), eq(familyS3Credentials.isActive, true)))
    .orderBy(desc(familyS3Credentials.updatedAt))
    .limit(1)
    ;

  if (!row) {
    throw new Error(`No active S3 credential found for family ${familyId}`);
  }

  let accessKeyId: string;
  let secretAccessKey: string;

  try {
    accessKeyId = decryptS3Value(row.encryptedAccessKey);
    secretAccessKey = decryptS3Value(row.encryptedSecretKey);
  } catch (error) {
    console.error("[s3Credentials] failed to decrypt family credentials", {
      familyId,
      credentialId: row.id,
      bucketName: row.bucketName,
      region: row.region,
      hasMasterKey: Boolean(process.env.S3_CREDENTIALS_MASTER_KEY),
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    throw new Error(`Failed to decrypt S3 credentials for family ${familyId}`);
  }

  const value: S3Credential = {
    accessKeyId,
    secretAccessKey,
    bucketName: row.bucketName,
    region: row.region,
  };

  credentialCache.set(familyId, { value, expiresAt: now + CACHE_TTL_MS });
  return value;
}
