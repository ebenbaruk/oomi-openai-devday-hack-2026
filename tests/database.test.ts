import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { expect, it } from "vitest";
it("applies the SQL and enforces session ownership, one live session and audit constraints", async () => {
  const db = new PGlite();
  try {
    const sql = await readFile("db/migrations/001_foundation.sql", "utf8"); await db.exec(sql); await db.exec(sql);
    const owner = "00000000-0000-4000-8000-000000000001"; const session = "00000000-0000-4000-8000-000000000002";
    await db.query("INSERT INTO demo_profiles(id,age,language) VALUES($1,7,'en')", [owner]);
    await db.query("INSERT INTO voice_sessions(id,owner_id,expires_at) VALUES($1,$2,now()+interval '4 minutes')", [session, owner]);
    await expect(db.query("INSERT INTO voice_sessions(id,owner_id,expires_at) VALUES('00000000-0000-4000-8000-000000000003',$1,now())", [owner])).rejects.toThrow();
    await expect(db.query("INSERT INTO turn_audits(id,session_id,verdict,status,elapsed_ms) VALUES('00000000-0000-4000-8000-000000000004',$1,'invalid','approved',0)", [session])).rejects.toThrow();
    await db.query("INSERT INTO turn_audits(id,session_id,verdict,status,elapsed_ms) VALUES('00000000-0000-4000-8000-000000000004',$1,'answer','approved',100)", [session]);
    await db.query("DELETE FROM voice_sessions WHERE id=$1", [session]);
    expect((await db.query("SELECT * FROM turn_audits")).rows).toHaveLength(0);
    const columns = await db.query<{ column_name: string }>("SELECT column_name FROM information_schema.columns WHERE table_name='turn_audits'");
    expect(columns.rows.map(c => c.column_name)).not.toContain("transcript");
  } finally { await db.close(); }
}, 20_000);
