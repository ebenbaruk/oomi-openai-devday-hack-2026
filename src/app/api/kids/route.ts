import { NextResponse } from "next/server";
import { handle } from "@/server/http";
import { buildKidLibrary } from "@/server/journal";

export function GET() {
  return handle("kids", async () => NextResponse.json(await buildKidLibrary()));
}
