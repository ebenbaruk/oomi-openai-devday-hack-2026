import { loadEnvConfig } from "@next/env";
import { readdir, readFile } from "node:fs/promises";
import { Pool } from "pg";

loadEnvConfig(process.cwd());
async function migrate() {
  if (!process.env.DATABASE_URL) throw new Error("Configure DATABASE_URL in .env.local first.");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(1866670)");
    await client.query("CREATE TABLE IF NOT EXISTS schema_migrations(name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())");
    const files = (await readdir("db/migrations")).filter(f => f.endsWith(".sql")).sort();
    for (const name of files) {
      if ((await client.query("SELECT name FROM schema_migrations WHERE name=$1", [name])).rowCount) continue;
      await client.query(await readFile(`db/migrations/${name}`, "utf8"));
      await client.query("INSERT INTO schema_migrations(name) VALUES($1)", [name]);
      console.log(`Applied ${name}`);
    }
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); await pool.end(); }
}
migrate().catch(() => { console.error("Migration failed. Check DATABASE_URL, connectivity and database privileges. No connection string was logged."); process.exitCode = 1; });
