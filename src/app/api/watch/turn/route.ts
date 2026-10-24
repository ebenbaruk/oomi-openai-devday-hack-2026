import { NextResponse } from "next/server";
import { handle } from "@/server/http";
import { handleWatchTurn, WatchError } from "@/server/watch";

export const maxDuration = 60;

export function POST(request: Request) {
  return handle("watch-turn", async () => {
    try {
      return NextResponse.json(await handleWatchTurn(request), { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      if (error instanceof WatchError) return NextResponse.json({ error: error.message }, { status: error.status });
      throw error;
    }
  });
}
