import "dotenv/config";
import * as dotenv from "dotenv";
import { defineConfig } from 'drizzle-kit';

dotenv.config({
  path: ".env.local",
});

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/features/auth/components/db/new-schema.ts",
  dbCredentials: {
    url: process.env.FAMILY_SOCIAL_DATABASE_URL!
  }
});