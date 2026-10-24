import { memoryInputSchema } from "../../../../lib/contracts";
import { canMutateParent } from "../../../../server/parent-auth";
import { addMemory } from "../../../../server/parent";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    if (!canMutateParent(request)) return Response.json({ error: "Accès adulte requis." }, { status: 401 });
    const body = memoryInputSchema.safeParse(await request.json());
    if (!body.success) return Response.json({ error: "Souvenir invalide." }, { status: 400 });
    return Response.json({ id: await addMemory(body.data) }, { status: 201 });
  } catch { return Response.json({ error: "Impossible d’enregistrer ce souvenir." }, { status: 503 }); }
}
