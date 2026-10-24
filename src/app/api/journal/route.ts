import { NextResponse } from "next/server";
import { handle } from "@/server/http";
import { buildJournal } from "@/server/journal";

export function GET() {
  return handle("journal", async () => NextResponse.json(await buildJournal()));
}
