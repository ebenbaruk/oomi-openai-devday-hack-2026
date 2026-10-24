import "server-only";
import type { Language } from "@/lib/contracts";
import { env } from "./env";
import { storeMedia } from "./media";
import { openai } from "./openai";

const VOICE_STYLE = {
  playful: "Warm, bright and playful, like a curious little explorer talking to a 7-year-old. Smile while speaking. Relaxed pace.",
  bedtime: "Soft, slow and soothing bedtime-story voice. Gentle pauses between sentences, getting calmer and sleepier towards the end.",
  explainer: "Enthusiastic, warm kids' TV presenter full of wonder, clear and lively, short pauses, like explaining a cool secret.",
};
export type VoiceStyle = keyof typeof VOICE_STYLE;

function voiceInstructions(style: VoiceStyle, language: Language): string {
  return language === "fr" ? `${VOICE_STYLE[style]} Speak natural French with a native French accent.` : VOICE_STYLE[style];
}

export async function synthesize(text: string, style: VoiceStyle, language: Language = "en", voice = "coral"): Promise<Response> {
  return openai((client) =>
    client.audio.speech.create({
      model: env().OOMI_MODEL_TTS,
      voice,
      input: text,
      instructions: voiceInstructions(style, language),
      response_format: "mp3",
    }),
  );
}

/** Synthesizes once and keeps the mp3, for narration that is replayed (Oomi TV, stories). */
export async function synthesizeToMedia(text: string, style: VoiceStyle, language: Language, voice?: string): Promise<string> {
  const audio = await synthesize(text, style, language, voice);
  return storeMedia("audio/mpeg", Buffer.from(await audio.arrayBuffer()));
}

/** No language hint: the child may speak English or French. */
export async function transcribe(audio: File): Promise<string> {
  const result = await openai((client) =>
    client.audio.transcriptions.create({ model: env().OOMI_MODEL_TRANSCRIBE_FILE, file: audio }),
  );
  return result.text;
}

/** Turn-by-turn fallback (SPEC §7.1): the Brain writes the reply that the live model would have spoken. */
export async function writeReply(question: string, instructions: string): Promise<string> {
  const response = await openai((client) =>
    client.responses.create({
      model: env().OOMI_MODEL_BRAIN,
      reasoning: { effort: "none" },
      instructions,
      input: question,
      max_output_tokens: 300,
    }),
  );
  return response.output_text.trim();
}
