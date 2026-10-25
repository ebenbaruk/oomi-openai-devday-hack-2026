import { NextResponse } from "next/server";
import { z } from "zod";
import { handle, parseJson } from "@/server/http";
import { WatchError, loadWatchProfile } from "@/server/watch";

/** Refreshes the family-made mascot on a paired Watch without recording any audio. */
export function POST(request: Request) {
  return handle("watch-profile", async () => {
    const body = await parseJson(request, z.object({ pairingCode: z.string().regex(/^\d{6}$/) }));
    if (body instanceof NextResponse) return body;
    try {
      return NextResponse.json(await loadWatchProfile(body.pairingCode), { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      if (error instanceof WatchError) return NextResponse.json({ error: error.message }, { status: error.status });
      throw error;
    }
  });
}
