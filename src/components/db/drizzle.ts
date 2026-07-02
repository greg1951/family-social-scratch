import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

function normalizeDatabaseUrl(connectionString: string): string {
	const normalizedUrl = new URL(connectionString);
	const sslMode = normalizedUrl.searchParams.get("sslmode");

	if (!sslMode || ["require", "prefer", "verify-ca"].includes(sslMode)) {
		normalizedUrl.searchParams.set("sslmode", "verify-full");
	}

	return normalizedUrl.toString();
}

const familySocialDatabaseUrl = process.env.FAMILY_SOCIAL_DATABASE_URL;

if (!familySocialDatabaseUrl) {
	throw new Error("FAMILY_SOCIAL_DATABASE_URL is required.");
}

const sql = neon(normalizeDatabaseUrl(familySocialDatabaseUrl));
export const db = drizzle(sql);

export default db;