import { NextResponse } from "next/server";
import { handle } from "@/server/http";
import { eraseEverything } from "@/server/journal";

export function POST() {
  return handle("erase", async () => {
    await eraseEverything();
    return NextResponse.json({ ok: true });
  });
}
