import { storyInputSchema } from "../../../../lib/contracts";
import { canMutateParent } from "../../../../server/parent-auth";
import { addStory } from "../../../../server/parent";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    if (!canMutateParent(request)) return Response.json({ error: "Accès adulte requis." }, { status: 401 });
    const body = storyInputSchema.safeParse(await request.json());
    if (!body.success) return Response.json({ error: "Histoire invalide." }, { status: 400 });
    return Response.json({ id: await addStory(body.data) }, { status: 201 });
  } catch { return Response.json({ error: "Impossible d’enregistrer cette histoire." }, { status: 503 }); }
}
