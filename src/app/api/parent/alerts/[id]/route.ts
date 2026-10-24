import { z } from "zod";
import { alertStatusInputSchema } from "../../../../../lib/contracts";
import { canMutateParent } from "../../../../../server/parent-auth";
import { setAlertStatus } from "../../../../../server/parent";
export const runtime = "nodejs";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!canMutateParent(request)) return Response.json({ error: "Accès adulte requis." }, { status: 401 });
    const id = z.string().uuid().safeParse((await params).id); const body = alertStatusInputSchema.safeParse(await request.json());
    if (!id.success || !body.success) return Response.json({ error: "Alerte invalide." }, { status: 400 });
    return await setAlertStatus(id.data, body.data.status) ? Response.json({ ok: true }) : Response.json({ error: "Alerte introuvable." }, { status: 404 });
  } catch { return Response.json({ error: "Impossible de modifier cette alerte." }, { status: 503 }); }
}
