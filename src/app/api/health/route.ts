import { configurationStatus } from "../../../server/config";
export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json({ status: "ok", liveConfigured: configurationStatus().ready }, { headers: { "Cache-Control": "no-store" } });
}
