import "dotenv/config";
import * as dotenv from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from 'drizzle-kit';

const envCandidates = [
  ".env.google-local",
  ".env.local",
  ".env.development.local",
  ".env.development",
  ".env",
];

const envPath = envCandidates
  .map((fileName) => resolve(process.cwd(), fileName))
  .find((candidatePath) => existsSync(candidatePath));

if (envPath) {
  dotenv.config({ path: envPath });
}

function normalizeDatabaseUrl(connectionString: string): string {
  const normalizedUrl = new URL(connectionString);
  const sslMode = normalizedUrl.searchParams.get("sslmode");

  if (!sslMode || ["require", "prefer", "verify-ca"].includes(sslMode)) {
    normalizedUrl.searchParams.set("sslmode", "verify-full");
  }

  return normalizedUrl.toString();
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/components/db/schema/family-social-schema.ts",
  out: "./drizzle/family",
  dbCredentials: {
    url: normalizeDatabaseUrl(process.env.FAMILY_SOCIAL_DATABASE_URL!)
  }
});