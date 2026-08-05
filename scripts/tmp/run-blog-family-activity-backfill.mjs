import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import pg from "pg";

const sqlPath = resolve(process.cwd(), "docs/sql-scripts/backfill-blog-family-activity.sql");
const connectionString = process.env.FAMILY_SOCIAL_DATABASE_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Missing FAMILY_SOCIAL_DATABASE_URL or DATABASE_URL environment variable.");
  process.exit(1);
}

const sqlText = await readFile(sqlPath, "utf8");
const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sqlText);
  console.log("Backfill completed successfully: backfill-blog-family-activity.sql");
} catch (error) {
  console.error("Backfill failed:", error?.message ?? error);
  process.exitCode = 1;
} finally {
  await client.end();
}
