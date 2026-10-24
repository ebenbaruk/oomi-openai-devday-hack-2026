import { NextResponse } from "next/server";
import { z } from "zod";
import { handle, parseJson } from "@/server/http";
import { synthesize } from "@/server/speech";

export const maxDuration = 120;

const SpeechRequest = z.object({ text: z.string().min(1).max(4000), style: z.enum(["playful", "bedtime"]) });

/** Streams expressive TTS audio: used for bedtime stories and the turn-by-turn fallback. */
export function POST(request: Request) {
  return handle("speech", async () => {
    const body = await parseJson(request, SpeechRequest);
    if (body instanceof NextResponse) return body;
    const audio = await synthesize(body.text, body.style);
    return new Response(audio.body, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
  });
}
