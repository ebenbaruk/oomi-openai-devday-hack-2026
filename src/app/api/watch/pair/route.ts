import { NextResponse } from "next/server";
import { handle } from "@/server/http";
import { createWatchPairing, getWatchPairingStatus } from "@/server/watch";

export function GET() {
  return handle("watch-pair-status", async () => NextResponse.json(await getWatchPairingStatus(), { headers: { "Cache-Control": "no-store" } }));
}

export function POST() {
  return handle("watch-pair", async () => NextResponse.json(await createWatchPairing(), { headers: { "Cache-Control": "no-store" } }));
}
