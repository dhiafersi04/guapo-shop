import { Pool } from 'pg';

// Supabase Connection (PostgreSQL)
// This will use the DATABASE_URL environment variable when hosted on Vercel
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';

export const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Helper to easily execute queries.
 * This version supports MySQL-style '?' placeholders by converting them to 
 * PostgreSQL-style '$1, $2, ...' placeholders automatically.
 */
export async function query<T>(sql: string, params: any[] = []): Promise<T> {
    let pgSql = sql;
    let index = 1;

    // Replace MySQL '?' with Postgres '$1', '$2', etc.
    pgSql = pgSql.replace(/\?/g, () => `$${index++}`);

    try {
        const { rows } = await pool.query(pgSql, params);
        return rows as T;
    } catch (error) {
        console.error('Database Query Error:', error);
        throw error;
    }
}
