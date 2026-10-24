import { after, NextResponse } from "next/server";
import { CompleteTurnRequest } from "@/lib/contracts";
import { consolidateTurn } from "@/server/brain";
import { handle, parseJson } from "@/server/http";
import { checkAnswer, findTrackedTurn } from "@/server/turn";

export const maxDuration = 120;

/** Called when Oomi finished speaking: checks the output, then builds the journal card in the background. */
export function POST(request: Request) {
  return handle("turn/complete", async () => {
    const body = await parseJson(request, CompleteTurnRequest);
    if (body instanceof NextResponse) return body;
    const [verdict, turn] = await Promise.all([checkAnswer(body.answer, body.language), findTrackedTurn(body.turnId)]);
    if (turn) {
      after(() =>
        consolidateTurn({ discoveryId: turn.id, question: turn.question, answer: body.answer, intent: turn.intent, verdict: turn.verdict })
          .catch((error: unknown) => console.error("[brain] consolidation failed:", error)),
      );
    }
    return NextResponse.json(verdict);
  });
}
