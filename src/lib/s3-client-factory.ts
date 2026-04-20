import { S3Client } from "@aws-sdk/client-s3";
import { getActiveS3CredentialsByFamilyId } from "@/components/db/sql/queries-family-s3";
import { decryptS3Value } from "@/lib/s3-encryption";

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

export async function getS3ClientForFamily(familyId: number): Promise<FamilyS3ClientContext> {
  const now = Date.now();
  const cached = familyS3ClientCache.get(familyId);

  if (cached && cached.expiresAt > now) {
    // console.info("[s3-client-factory] using cached S3 client", {
    //   familyId,
    //   bucketName: cached.bucketName,
    //   region: cached.region,
    // });
    return {
      client: cached.client,
      bucketName: cached.bucketName,
      region: cached.region,
    };
  }

  const credentialsResult = await getActiveS3CredentialsByFamilyId(familyId);

  if (!credentialsResult.success) {
    console.error("[s3-client-factory] no active credentials", {
      familyId,
      message: credentialsResult.message,
    });
    throw new Error(credentialsResult.message);
  }

  let accessKeyId: string;
  let secretAccessKey: string;

  try {
    accessKeyId = decryptS3Value(credentialsResult.encryptedAccessKey);
    secretAccessKey = decryptS3Value(credentialsResult.encryptedSecretKey);
  } catch (error) {
    console.error("[s3-client-factory] failed to decrypt family S3 credentials", {
      familyId,
      credentialId: credentialsResult.credentialId,
      bucketName: credentialsResult.bucketName,
      region: credentialsResult.region,
      hasMasterKey: Boolean(process.env.S3_CREDENTIALS_MASTER_KEY),
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }

  // console.info("[s3-client-factory] resolved active credentials", {
  //   familyId,
  //   credentialId: credentialsResult.credentialId,
  //   bucketName: credentialsResult.bucketName,
  //   region: credentialsResult.region,
  // });

  const context: CachedS3ClientContext = {
    client: new S3Client({
      region: credentialsResult.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    }),
    bucketName: credentialsResult.bucketName,
    region: credentialsResult.region,
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
