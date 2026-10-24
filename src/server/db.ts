import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";
import type { Config } from "./config";
import type { Verdict } from "../lib/contracts";

let pool: Pool | undefined;
export const DEMO_OWNER = "00000000-0000-4000-8000-000000000001";
export function getPool() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 5000 });
    if (process.env.VERCEL) attachDatabasePool(pool);
  }
  return pool;
}

export async function allowAttempt(bucket: string, max = 5, seconds = 900) {
  const result = await getPool().query<{ attempts: number }>(`
    INSERT INTO rate_limits(bucket, attempts, expires_at) VALUES ($1, 1, now() + $2 * interval '1 second')
    ON CONFLICT (bucket) DO UPDATE SET
      attempts = CASE WHEN rate_limits.expires_at <= now() THEN 1 ELSE rate_limits.attempts + 1 END,
      expires_at = CASE WHEN rate_limits.expires_at <= now() THEN now() + $2 * interval '1 second' ELSE rate_limits.expires_at END
    RETURNING attempts`, [bucket, seconds]);
  return result.rows[0]!.attempts <= max;
}

export async function reserveSession(id: string, config: Config) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(1866671)");
    await client.query("INSERT INTO demo_profiles(id, age, language) VALUES($1,$2,$3) ON CONFLICT(id) DO UPDATE SET age=$2, language=$3", [DEMO_OWNER, config.OOMI_CHILD_AGE, config.OOMI_LANGUAGE]);
    await client.query("UPDATE voice_sessions SET closed_at=now() WHERE closed_at IS NULL AND expires_at <= now()");
    await client.query("INSERT INTO voice_sessions(id, owner_id, expires_at) VALUES($1,$2,now() + $3 * interval '1 second')", [id, DEMO_OWNER, config.OOMI_SESSION_SECONDS]);
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}
export async function closeSession(id: string) {
  await getPool().query("UPDATE voice_sessions SET closed_at=now() WHERE id=$1", [id]);
}
export async function recordAudit(sessionId: string, turnId: string, verdict: Verdict | null, status: "approved" | "blocked" | "fallback" | "ignored" | "cancelled", elapsed: number) {
  await getPool().query(`INSERT INTO turn_audits(id,session_id,verdict,status,elapsed_ms) VALUES($1,$2,$3,$4,$5)
    ON CONFLICT(id) DO UPDATE SET verdict=$3,status=$4,elapsed_ms=$5`, [turnId, sessionId, verdict, status, Math.max(0, Math.round(elapsed))]);
}
