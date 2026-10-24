import { z } from "zod";
import { canMutateParent } from "../../../../../server/parent-auth";
import { deleteMemory } from "../../../../../server/parent";
export const runtime = "nodejs";
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!canMutateParent(request)) return Response.json({ error: "Accès adulte requis." }, { status: 401 });
    const id = z.string().uuid().safeParse((await params).id);
    if (!id.success) return Response.json({ error: "Identifiant invalide." }, { status: 400 });
    return deleteMemory(id.data) ? Response.json({ ok: true }) : Response.json({ error: "Souvenir introuvable." }, { status: 404 });
  } catch { return Response.json({ error: "Impossible de supprimer ce souvenir." }, { status: 503 }); }
}
