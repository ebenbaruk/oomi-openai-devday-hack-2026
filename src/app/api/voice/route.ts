import { upgradeWebSocket } from "@vercel/functions";
import { getConfig } from "../../../server/config";
import { authenticated, trustedOrigin } from "../../../server/auth";
import { attachDevice } from "../../../server/voice/connection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
export async function GET(request: Request) {
  try {
    const config = getConfig();
    if (!trustedOrigin(request.headers.get("origin"), config) || !authenticated(request.headers.get("cookie"), config)) return new Response("Unauthorized", { status: 401 });
    if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") return new Response("WebSocket required", { status: 426 });
    return upgradeWebSocket(ws => attachDevice(ws, config), { maxPayload: 60_000 });
  } catch { return new Response("Live session unavailable", { status: 503 }); }
}
