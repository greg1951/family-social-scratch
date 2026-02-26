import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon(process.env.FAMILY_SOCIAL_DATABASE_URL!);
const db = drizzle(sql);

export default db; 