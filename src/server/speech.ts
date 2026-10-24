import "server-only";
import { loadChild } from "./child";
import { env } from "./env";
import { openai } from "./openai";

const VOICE_STYLE = {
  playful: "Warm, bright and playful, like a curious little explorer talking to a 7-year-old. Smile while speaking. Relaxed pace.",
  bedtime: "Soft, slow and soothing bedtime-story voice. Gentle pauses between sentences, getting calmer and sleepier towards the end.",
};

export async function synthesize(text: string, style: keyof typeof VOICE_STYLE): Promise<Response> {
  return openai().audio.speech.create({
    model: env().OOMI_MODEL_TTS,
    voice: "coral",
    input: text,
    instructions: VOICE_STYLE[style],
    response_format: "mp3",
  });
}

export async function transcribe(audio: File): Promise<string> {
  const child = await loadChild();
  const result = await openai().audio.transcriptions.create({
    model: env().OOMI_MODEL_TRANSCRIBE_FILE,
    file: audio,
    language: child.language,
  });
  return result.text;
}

/** Turn-by-turn fallback (SPEC §7.1): the Brain writes the reply that the live model would have spoken. */
export async function writeReply(question: string, instructions: string): Promise<string> {
  const response = await openai().responses.create({
    model: env().OOMI_MODEL_BRAIN,
    reasoning: { effort: "none" },
    instructions,
    input: question,
    max_output_tokens: 300,
  });
  return response.output_text.trim();
}
