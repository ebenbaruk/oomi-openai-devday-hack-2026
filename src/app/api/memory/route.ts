import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { handle } from "@/server/http";
import { deleteMemory } from "@/server/journal";

/** Deletes one memory item (?id=) or everything Oomi knows about the child. */
export function DELETE(request: NextRequest) {
  return handle("memory", async () => {
    const id = request.nextUrl.searchParams.get("id");
    if (id !== null && !z.uuid().safeParse(id).success) return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    await deleteMemory(id ?? undefined);
    return NextResponse.json({ ok: true });
  });
}
