import { NextResponse } from "next/server";
import { handle } from "@/server/http";
import { createWatchPairing } from "@/server/watch";

export function POST() {
  return handle("watch-pair", async () => NextResponse.json(await createWatchPairing(), { headers: { "Cache-Control": "no-store" } }));
}
