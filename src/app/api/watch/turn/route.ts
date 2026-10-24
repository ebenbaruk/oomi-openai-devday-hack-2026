import { getConfig } from "../../../../server/config";
import { handleWatchTurn, WatchTurnError } from "../../../../server/transports/watch";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const result = await handleWatchTurn(request, getConfig());
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof WatchTurnError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: "Oomi is unavailable right now." }, { status: 503 });
  }
}
