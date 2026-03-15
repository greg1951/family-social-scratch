import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const FAMILY_SOCIAL_DATABASE_URL="postgresql://neondb_owner:npg_WPqkC3FVwH6X@ep-holy-violet-adh5ugnk-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
const sql = neon(FAMILY_SOCIAL_DATABASE_URL);
const db = drizzle(sql);

export default db; 