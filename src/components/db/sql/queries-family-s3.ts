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

// getActiveS3CredentialsByFamilyId is now deprecated and replaced by getActiveS3CredentialForFamily in s3Credentials.ts

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
