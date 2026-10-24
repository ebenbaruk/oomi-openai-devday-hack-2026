import { childProfileInputSchema } from "../../../../lib/contracts";
import { canAccessParent, canMutateParent } from "../../../../server/parent-auth";
import { createChildProfile } from "../../../../server/parent";
import { getPool } from "../../../../server/db";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try { if (!canAccessParent(request)) return Response.json({ error: "Accès adulte requis." }, { status: 401 });
    const rows = await getPool().query("SELECT c.id,c.first_name,c.age,c.language,d.id device_id,d.name device_name,d.status device_status FROM child c LEFT JOIN watch_devices d ON d.child_id=c.id ORDER BY c.created_at");
    return Response.json(rows.rows, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Impossible de lire les profils." }, { status: 503 }); }
}
export async function POST(request: Request) {
  try { if (!canMutateParent(request)) return Response.json({ error: "Accès adulte requis." }, { status: 401 });
    const input = childProfileInputSchema.safeParse(await request.json()); if (!input.success) return Response.json({ error: "Informations enfant ou appareil invalides." }, { status: 400 });
    return Response.json(await createChildProfile(input.data), { status: 201 });
  } catch { return Response.json({ error: "Impossible de créer le profil." }, { status: 503 }); }
}
