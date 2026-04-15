import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const DEFAULT_FAMILY_SOCIAL_DATABASE_URL = "postgresql://neondb_owner:npg_WPqkC3FVwH6X@ep-holy-violet-adh5ugnk-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require";

function normalizeDatabaseUrl(connectionString: string): string {
	const normalizedUrl = new URL(connectionString);
	const sslMode = normalizedUrl.searchParams.get("sslmode");

	if (!sslMode || ["require", "prefer", "verify-ca"].includes(sslMode)) {
		normalizedUrl.searchParams.set("sslmode", "verify-full");
	}

	return normalizedUrl.toString();
}

const familySocialDatabaseUrl = normalizeDatabaseUrl(
	process.env.FAMILY_SOCIAL_DATABASE_URL ?? DEFAULT_FAMILY_SOCIAL_DATABASE_URL
);
const sql = neon(familySocialDatabaseUrl);
const db = drizzle(sql);

export default db; 