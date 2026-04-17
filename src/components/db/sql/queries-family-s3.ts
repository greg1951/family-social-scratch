"use server";

import db from "@/components/db/drizzle";
import { and, desc, eq } from "drizzle-orm";
import { familyS3Credentials } from "../schema/family-social-schema-tables";
import { encryptS3Value } from "@/lib/s3-encryption";

type ActiveFamilyS3CredentialsResult =
  | {
      success: true;
      credentialId: number;
      familyId: number;
      encryptedAccessKey: string;
      encryptedSecretKey: string;
      bucketName: string;
      region: string;
      isActive: boolean;
      createdAt: Date | null;
      updatedAt: Date | null;
    }
  | {
      success: false;
      message: string;
    };

type CreateFamilyS3CredentialsInput = {
  familyId: number;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  region: string;
};

type CreateFamilyS3CredentialsResult =
  | {
      success: true;
      credentialId: number;
    }
  | {
      success: false;
      message: string;
    };

type RotateFamilyS3CredentialsInput = {
  familyId: number;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  region: string;
};

type RotateFamilyS3CredentialsResult =
  | {
      success: true;
      credentialId: number;
    }
  | {
      success: false;
      message: string;
    };

export async function getActiveS3CredentialsByFamilyId(
  familyId: number
): Promise<ActiveFamilyS3CredentialsResult> {
  const [record] = await db
    .select({
      credentialId: familyS3Credentials.id,
      familyId: familyS3Credentials.familyId,
      encryptedAccessKey: familyS3Credentials.encryptedAccessKey,
      encryptedSecretKey: familyS3Credentials.encryptedSecretKey,
      bucketName: familyS3Credentials.bucketName,
      region: familyS3Credentials.region,
      isActive: familyS3Credentials.isActive,
      createdAt: familyS3Credentials.createdAt,
      updatedAt: familyS3Credentials.updatedAt,
    })
    .from(familyS3Credentials)
    .where(and(eq(familyS3Credentials.familyId, familyId), eq(familyS3Credentials.isActive, true)))
    .orderBy(desc(familyS3Credentials.createdAt));

  if (!record) {
    return {
      success: false,
      message: `No active S3 credentials found for familyId ${familyId}`,
    };
  }

  return {
    success: true,
    credentialId: record.credentialId,
    familyId: record.familyId,
    encryptedAccessKey: record.encryptedAccessKey,
    encryptedSecretKey: record.encryptedSecretKey,
    bucketName: record.bucketName,
    region: record.region,
    isActive: record.isActive,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function createFamilyS3Credentials(
  input: CreateFamilyS3CredentialsInput
): Promise<CreateFamilyS3CredentialsResult> {
  const encryptedAccessKey = encryptS3Value(input.accessKeyId);
  const encryptedSecretKey = encryptS3Value(input.secretAccessKey);

  const [record] = await db
    .insert(familyS3Credentials)
    .values({
      familyId: input.familyId,
      encryptedAccessKey,
      encryptedSecretKey,
      bucketName: input.bucketName,
      region: input.region,
      isActive: true,
      updatedAt: new Date(),
    })
    .returning({
      credentialId: familyS3Credentials.id,
    });

  if (!record) {
    return {
      success: false,
      message: "Failed to create family S3 credentials",
    };
  }

  return {
    success: true,
    credentialId: record.credentialId,
  };
}

export async function rotateFamilyS3Credentials(
  input: RotateFamilyS3CredentialsInput
): Promise<RotateFamilyS3CredentialsResult> {
  await db
    .update(familyS3Credentials)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(and(eq(familyS3Credentials.familyId, input.familyId), eq(familyS3Credentials.isActive, true)));

  return createFamilyS3Credentials({
    familyId: input.familyId,
    accessKeyId: input.accessKeyId,
    secretAccessKey: input.secretAccessKey,
    bucketName: input.bucketName,
    region: input.region,
  });
}
