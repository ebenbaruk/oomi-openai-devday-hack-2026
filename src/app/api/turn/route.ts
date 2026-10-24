import { getConfig } from "../../../server/config";
import { accessCodeMatches } from "../../../server/auth";
import { createTurnDeps } from "../../../server/adapters/openai-turn";
import { runTurn } from "../../../server/core/turn";
import { TURN_ACCESS_HEADER, turnRequestSchema } from "../../../lib/turn";

// Turn-by-turn endpoint for devices without WebRTC (Apple Watch, later ESP32).
// One request = one question. Audio in, approved audio out. Nothing is stored.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  let config;
  try { config = getConfig(); } catch { return Response.json({ error: "Server not configured" }, { status: 503 }); }

  const code = request.headers.get(TURN_ACCESS_HEADER) ?? "";
  if (!code || !accessCodeMatches(code, config)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (Number(request.headers.get("content-length") ?? 0) > 6_000_000) return new Response(null, { status: 413 });

  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = turnRequestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid request", issues: parsed.error.issues.map(i => i.message) }, { status: 400 });

  const result = await runTurn(parsed.data, createTurnDeps(config));
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
