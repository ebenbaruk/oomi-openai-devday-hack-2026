import { NextResponse } from "next/server";
import { PortraitRequest } from "@/lib/contracts";
import { handle, parseJson } from "@/server/http";
import { createPortrait } from "@/server/mascot";

export const maxDuration = 120;

/** Paints one portrait of the mascot with GPT Image, following the ip-as-logo method (~20 s). */
export function POST(request: Request) {
  return handle("mascot-portrait", async () => {
    const body = await parseJson(request, PortraitRequest);
    if (body instanceof NextResponse) return body;
    return NextResponse.json(await createPortrait(body.config));
  });
}
