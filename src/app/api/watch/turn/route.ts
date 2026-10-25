import { after, NextResponse } from "next/server";
import { consolidateTurn } from "@/server/brain";
import { handle } from "@/server/http";
import { findTrackedTurn } from "@/server/turn";
import { handleWatchTurn, WatchError } from "@/server/watch";

export const maxDuration = 60;

export function POST(request: Request) {
  return handle("watch-turn", async () => {
    try {
      const turn = await handleWatchTurn(request);
      // The Watch receives its answer first.  In parallel, turn a tracked question into
      // the short parent journal card, just like the necklace simulator does.
      // We deliberately retain the question and parent-friendly discovery, never audio
      // or a verbatim conversation transcript.
      const tracked = await findTrackedTurn(turn.turnId);
      if (tracked) {
        after(() =>
          consolidateTurn({
            discoveryId: tracked.id,
            question: tracked.question,
            answer: turn.text,
            intent: tracked.intent,
            verdict: tracked.verdict,
          }).catch((error: unknown) => console.error("[watch-journal] consolidation failed:", error)),
        );
      }
      return NextResponse.json(turn, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      if (error instanceof WatchError) return NextResponse.json({ error: error.message }, { status: error.status });
      throw error;
    }
  });
}
