import { canAccessParent } from "../../../../server/parent-auth";
import { parentDashboard } from "../../../../server/parent";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    if (!canAccessParent(request)) return Response.json({ error: "Accès adulte requis." }, { status: 401 });
    const dashboard = await parentDashboard();
    if (!dashboard) return Response.json({ error: "Aucun profil enfant n’est encore associé à cette démo." }, { status: 404 });
    return Response.json(dashboard, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Le dashboard n’est pas encore configuré." }, { status: 503 }); }
}
