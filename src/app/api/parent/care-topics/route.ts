import { careTopicInputSchema } from "../../../../lib/contracts";
import { canMutateParent } from "../../../../server/parent-auth";
import { saveCareTopic } from "../../../../server/parent";
export const runtime = "nodejs";
export async function PUT(request: Request) {
  try {
    if (!canMutateParent(request)) return Response.json({ error: "Accès adulte requis." }, { status: 401 });
    const body = careTopicInputSchema.safeParse(await request.json());
    if (!body.success) return Response.json({ error: "Sujet de vigilance invalide." }, { status: 400 });
    await saveCareTopic(body.data); return Response.json({ ok: true });
  } catch { return Response.json({ error: "Impossible d’enregistrer ce sujet." }, { status: 503 }); }
}
