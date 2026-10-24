import { NextResponse } from "next/server";
import { GateRequest } from "@/lib/contracts";
import { handle, parseJson } from "@/server/http";
import { decideTurn } from "@/server/turn";

/** Called once per push-to-talk turn, with the transcript, before Oomi is allowed to speak. */
export function POST(request: Request) {
  return handle("gate", async () => {
    const body = await parseJson(request, GateRequest);
    if (body instanceof NextResponse) return body;
    return NextResponse.json(await decideTurn(body.sessionId, body.transcript, body.audioSeconds));
  });
}
