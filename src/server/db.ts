import "server-only";
import pg from "pg";
import { env } from "./env";

const globalForPool = globalThis as unknown as { oomiPool?: pg.Pool };

function pool(): pg.Pool {
  globalForPool.oomiPool ??= new pg.Pool({
    connectionString: env().DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 20_000,
  });
  return globalForPool.oomiPool;
}

export async function query<T extends pg.QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> {
  const result = await pool().query<T>(text, params);
  return result.rows;
}

export async function queryOne<T extends pg.QueryResultRow>(text: string, params: unknown[] = []): Promise<T | undefined> {
  const rows = await query<T>(text, params);
  return rows[0];
}

/** Single demo child. Multi-child support is out of hackathon scope (SPEC §4). */
export const CHILD_ID = "00000000-0000-4000-8000-000000000001";
