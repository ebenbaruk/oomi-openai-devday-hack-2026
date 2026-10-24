import { NextResponse } from "next/server";
import { handle } from "@/server/http";
import { startSession } from "@/server/turn";

/** Opens a live voice session: returns a short-lived client secret, never the API key. */
export function POST() {
  return handle("session", async () => NextResponse.json(await startSession()));
}
