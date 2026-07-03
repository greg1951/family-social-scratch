import { S3Client } from "@aws-sdk/client-s3";
import { getActiveS3CredentialForFamily } from "@/lib/s3Credentials";

type FamilyS3ClientContext = {
  client: S3Client;
  bucketName: string;
  region: string;
};

type CachedS3ClientContext = FamilyS3ClientContext & {
  expiresAt: number;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const familyS3ClientCache = new Map<number, CachedS3ClientContext>();

function getEnvFallbackContext(): FamilyS3ClientContext | null {
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

export async function getS3ClientForFamily(familyId: number): Promise<FamilyS3ClientContext> {
  const now = Date.now();
  const cached = familyS3ClientCache.get(familyId);

  if (cached && cached.expiresAt > now) {
    return {
      client: cached.client,
      bucketName: cached.bucketName,
      region: cached.region,
    };
  }

  let s3Creds;
  try {
    s3Creds = await getActiveS3CredentialForFamily(familyId);
  } catch (error) {
    const fallback = getEnvFallbackContext();
    if (fallback) {
      console.warn("[s3-client-factory] using env fallback credentials", {
        familyId,
        nodeEnv: process.env.NODE_ENV,
        region: fallback.region,
        bucketName: fallback.bucketName,
      });

      const fallbackContext: CachedS3ClientContext = {
        ...fallback,
        expiresAt: now + CACHE_TTL_MS,
      };
      familyS3ClientCache.set(familyId, fallbackContext);

      return {
        client: fallbackContext.client,
        bucketName: fallbackContext.bucketName,
        region: fallbackContext.region,
      };
    }

    console.error("[s3-client-factory] failed to resolve family S3 credentials", {
      familyId,
      hasMasterKey: Boolean(process.env.S3_CREDENTIALS_MASTER_KEY),
      hasEnvFallback: Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET_NAME),
      usedEnvFallback: false,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }

  const context: CachedS3ClientContext = {
    client: new S3Client({
      region: s3Creds.region,
      credentials: {
        accessKeyId: s3Creds.accessKeyId,
        secretAccessKey: s3Creds.secretAccessKey,
      },
    }),
    bucketName: s3Creds.bucketName,
    region: s3Creds.region,
    expiresAt: now + CACHE_TTL_MS,
  };

  familyS3ClientCache.set(familyId, context);

  return {
    client: context.client,
    bucketName: context.bucketName,
    region: context.region,
  };
}

export function clearFamilyS3ClientCache(familyId?: number) {
  if (typeof familyId === "number") {
    // console.info("[s3-client-factory] clearing S3 client cache for family", { familyId });
    familyS3ClientCache.delete(familyId);
    return;
  }

  // console.info("[s3-client-factory] clearing S3 client cache for all families");
  familyS3ClientCache.clear();
}
