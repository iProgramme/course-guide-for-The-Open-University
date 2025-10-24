import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { apiKeys } from '@/drizzle/schema';

const connectionString = process.env.NEXT_PUBLIC_NEON_DATABASE_URL!;

if (!connectionString) {
  throw new Error('NEXT_PUBLIC_NEON_DATABASE_URL is not defined');
}

const sql = neon(connectionString);
export const db = drizzle(sql, { schema: { apiKeys } });