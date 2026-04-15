import "dotenv/config";
import * as dotenv from "dotenv";
import { defineConfig } from 'drizzle-kit';

dotenv.config({
  path: ".env.local",
});

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
  dbCredentials: {
    url: normalizeDatabaseUrl(process.env.FAMILY_SOCIAL_DATABASE_URL!)
  }
});