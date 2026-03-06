import { Pool } from 'pg';

// Prioritize Supabase/PostgreSQL connection strings
let rawConnectionString =
    process.env.DATABASE_URL ||
    process.env.DATABASE_POSTGRES_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_POSTGRES_PRISMA_URL ||
    'postgresql://postgres:postgres@localhost:5432/postgres';

// Aggressive MySQL prevention: if the connection string starts with mysql, force it to postgres format
// or fallback to localhost postgres if it looks like a local MySQL leftover.
if (rawConnectionString.startsWith('mysql:')) {
    console.warn('⚠️ WARNING: MySQL connection string detected. Overriding to PostgreSQL default.');
    rawConnectionString = 'postgresql://postgres:postgres@localhost:5432/postgres';
}

// Log connection params during build/init to debug Vercel logs
const dbUrl = new URL(rawConnectionString);
console.log(`🔌 DB Init: Targeting ${dbUrl.hostname}:${dbUrl.port || '5432'}`);

if (dbUrl.port === '3306' || rawConnectionString.includes(':3306')) {
    throw new Error("⛔ CRITICAL_ERROR: MySQL port 3306 detected in PostgreSQL driver. Registry integrity failure. System must use Supabase Port 6543/5432.");
}

export const pool = new Pool({
    connectionString: rawConnectionString,
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
