import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/server/http";
import { deletePortrait } from "@/server/mascot";

export function DELETE(_request: Request, { params }: RouteContext<"/api/mascot/portraits/[id]">) {
  return handle("mascot-portrait", async () => {
    const { id } = await params;
    if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    await deletePortrait(id);
    return NextResponse.json({ ok: true });
  });
}
