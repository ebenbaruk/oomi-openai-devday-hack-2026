import { createHash, randomInt, randomUUID } from "node:crypto";
import { z } from "zod";
import { canMutateParent } from "../../../../server/parent-auth";
import { getPool } from "../../../../server/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!canMutateParent(request)) return Response.json({ error: "Accès adulte requis." }, { status: 401 });
    const input = z.object({ childId: z.string().uuid(), deviceName: z.string().trim().min(1).max(80).default("Apple Watch") }).strict().safeParse(await request.json());
    if (!input.success) return Response.json({ error: "Appareil invalide." }, { status: 400 });
    const child = await getPool().query("SELECT id FROM child WHERE id=$1", [input.data.childId]);
    if (!child.rowCount) return Response.json({ error: "Profil enfant introuvable." }, { status: 404 });
    const pairingCode = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const hash = createHash("sha256").update(pairingCode).digest("hex");
    const device = await getPool().query<{ id: string }>(`INSERT INTO watch_devices(id,child_id,name,pairing_code_hash,status,last_seen_at)
      VALUES($1,$2,$3,$4,'pending',NULL)
      ON CONFLICT(child_id,name) DO UPDATE SET pairing_code_hash=$4,status='pending',last_seen_at=NULL
      RETURNING id`, [randomUUID(), input.data.childId, input.data.deviceName, hash]);
    return Response.json({ deviceId: device.rows[0]!.id, pairingCode }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Impossible de préparer la Watch." }, { status: 503 }); }
}
