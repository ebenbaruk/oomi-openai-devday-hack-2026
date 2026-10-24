import { discoveryInputSchema } from "../../../../lib/contracts";
import { canMutateParent } from "../../../../server/parent-auth";
import { addDiscovery } from "../../../../server/parent";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    if (!canMutateParent(request)) return Response.json({ error: "Accès adulte requis." }, { status: 401 });
    const body = discoveryInputSchema.safeParse(await request.json());
    if (!body.success) return Response.json({ error: "Découverte invalide." }, { status: 400 });
    return Response.json({ id: await addDiscovery(body.data) }, { status: 201 });
  } catch { return Response.json({ error: "Impossible d’enregistrer la découverte." }, { status: 503 }); }
}
