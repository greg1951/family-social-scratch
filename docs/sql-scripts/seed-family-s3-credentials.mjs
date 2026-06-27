import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createCipheriv, randomBytes } from "node:crypto";
import pg from "pg";

const { Client } = pg;
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function parseDotEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  const content = readFileSync(filePath, "utf8");
  const entries = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    entries[key] = value;
  }

  return entries;
}

function getMasterKey() {
  const rawKey = process.env.S3_CREDENTIALS_MASTER_KEY;

  if (!rawKey) {
    throw new Error("S3_CREDENTIALS_MASTER_KEY is required in the process environment.");
  }

  if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
    return Buffer.from(rawKey, "hex");
  }

  if (/^[A-Za-z0-9+/=]+$/.test(rawKey)) {
    const decoded = Buffer.from(rawKey, "base64");
    if (decoded.length === 32) {
      return decoded;
    }
  }

  throw new Error("S3_CREDENTIALS_MASTER_KEY must be 64-char hex or 32-byte base64.");
}

function encryptValue(plainText) {
  const key = getMasterKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

function getArgValue(flagName) {
  const flagIndex = process.argv.indexOf(flagName);
  if (flagIndex === -1) {
    return undefined;
  }

  return process.argv[flagIndex + 1];
}

async function main() {
  const envFilePath = resolve(process.cwd(), ".env.local");
  const fileEnv = parseDotEnvFile(envFilePath);
  const familyIdArg = getArgValue("--family-id");
  const familyNameArg = getArgValue("--family-name");
  const rotate = process.argv.includes("--rotate");

  const connectionString = process.env.FAMILY_SOCIAL_DATABASE_URL ?? fileEnv.FAMILY_SOCIAL_DATABASE_URL;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID ?? fileEnv.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY ?? fileEnv.AWS_SECRET_ACCESS_KEY;
  const bucketName = process.env.AWS_S3_BUCKET_NAME ?? fileEnv.AWS_S3_BUCKET_NAME;
  const region = process.env.AWS_REGION ?? fileEnv.AWS_REGION ?? "us-east-2";

  if (!connectionString) {
    throw new Error("FAMILY_SOCIAL_DATABASE_URL is required.");
  }

  if (!accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error("AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET_NAME are required.");
  }

  if (!familyIdArg && !familyNameArg) {
    throw new Error("Provide --family-id or --family-name.");
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    let familyId = familyIdArg ? Number(familyIdArg) : undefined;

    if (!familyId && familyNameArg) {
      const familyLookup = await client.query(
        "select id from family where family_name = $1 limit 1",
        [familyNameArg]
      );

      if (familyLookup.rowCount === 0) {
        throw new Error(`Family not found for name: ${familyNameArg}`);
      }

      familyId = familyLookup.rows[0].id;
    }

    if (!familyId || Number.isNaN(familyId)) {
      throw new Error("Resolved familyId is invalid.");
    }

    const existingActive = await client.query(
      "select id from family_s3_credentials where fk_family_id = $1 and is_active = true limit 1",
      [familyId]
    );

    if (existingActive.rowCount > 0 && !rotate) {
      throw new Error("Active family_s3_credentials row already exists. Re-run with --rotate to replace it.");
    }

    await client.query("begin");

    if (rotate) {
      await client.query(
        "update family_s3_credentials set is_active = false, updated_at = now() where fk_family_id = $1 and is_active = true",
        [familyId]
      );
    }

    const insertResult = await client.query(
      `insert into family_s3_credentials (
        encrypted_access_key,
        encrypted_secret_key,
        bucket_name,
        region,
        is_active,
        updated_at,
        fk_family_id
      ) values ($1, $2, $3, $4, true, now(), $5)
      returning id`,
      [
        encryptValue(accessKeyId),
        encryptValue(secretAccessKey),
        bucketName,
        region,
        familyId,
      ]
    );

    await client.query("commit");

    console.log(JSON.stringify({
      success: true,
      familyId,
      bucketName,
      region,
      credentialId: insertResult.rows[0].id,
      rotated: rotate,
    }, null, 2));
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});