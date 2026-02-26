import "dotenv/config";
import * as dotenv from "dotenv";
import { defineConfig } from 'drizzle-kit';

dotenv.config({
  path: ".env.local",
});

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/components/db/schema/family-social-schema.ts",
  dbCredentials: {
    url: process.env.FAMILY_SOCIAL_DATABASE_URL!
  }
});