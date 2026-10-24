import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/server/http";
import { transcribe, writeReply } from "@/server/speech";
import { decideTurn } from "@/server/turn";

export const maxDuration = 60;

const TextTurn = z.object({ sessionId: z.uuid(), text: z.string().max(2000) });

/**
 * Turn-by-turn fallback (SPEC §7.1): same gate as the live mode, but the reply is written by the Brain
 * and voiced with TTS by the client. Accepts recorded audio (multipart) or text.
 */
export function POST(request: Request) {
  return handle("turn", async () => {
    let sessionId: string;
    let transcript: string;
    let audioSeconds: number | undefined;

    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await request.formData();
      const audio = form.get("audio");
      const id = z.uuid().safeParse(form.get("sessionId"));
      if (!(audio instanceof File) || !id.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
      sessionId = id.data;
      audioSeconds = Number(form.get("audioSeconds")) || undefined;
      transcript = await transcribe(audio);
    } else {
      const body = TextTurn.safeParse(await request.json().catch(() => null));
      if (!body.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
      sessionId = body.data.sessionId;
      transcript = body.data.text;
    }

    const gate = await decideTurn(sessionId, transcript, audioSeconds);
    const reply = gate.action === "speak" ? (gate.exactText ?? (await writeReply(transcript, gate.instructions))) : undefined;
    return NextResponse.json({ transcript, gate, reply });
  });
}
