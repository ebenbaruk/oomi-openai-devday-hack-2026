import { readFile } from "node:fs/promises";
import { join } from "node:path";
import pg from "pg";

const url = process.env.DATABASE_URL_MIGRATE ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL_MIGRATE or DATABASE_URL is required");

const sql = await readFile(join(import.meta.dirname, "..", "db", "schema.sql"), "utf8");
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query(sql);
  console.log("Schema oomi_app is up to date.");
} finally {
  await client.end();
}
