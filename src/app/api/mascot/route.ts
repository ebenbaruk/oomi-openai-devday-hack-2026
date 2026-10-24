import { NextResponse } from "next/server";
import { MascotConfig } from "@/lib/contracts";
import { handle, parseJson } from "@/server/http";
import { loadMascot, saveMascot } from "@/server/mascot";

export function GET() {
  return handle("mascot", async () => NextResponse.json(await loadMascot()));
}

/** Saves the family's mascot: look, name, voice and personality (used from the next session on). */
export function PUT(request: Request) {
  return handle("mascot", async () => {
    const body = await parseJson(request, MascotConfig);
    if (body instanceof NextResponse) return body;
    return NextResponse.json(await saveMascot(body));
  });
}
