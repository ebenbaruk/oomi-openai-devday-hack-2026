import { parentSettingsSchema } from "../../../../lib/contracts";
import { canMutateParent } from "../../../../server/parent-auth";
import { saveSettings } from "../../../../server/parent";
export const runtime = "nodejs";
export async function PUT(request: Request) {
  try {
    if (!canMutateParent(request)) return Response.json({ error: "Accès adulte requis." }, { status: 401 });
    const body = parentSettingsSchema.safeParse(await request.json());
    if (!body.success) return Response.json({ error: "Réglages invalides." }, { status: 400 });
    await saveSettings(body.data); return Response.json({ ok: true });
  } catch { return Response.json({ error: "Impossible d’enregistrer les réglages." }, { status: 503 }); }
}
