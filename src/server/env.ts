import "server-only";
import { z } from "zod";

const Env = z.object({
  OPENAI_API_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  OOMI_ACCESS_CODE: z.string().min(8),
  OOMI_SESSION_SECRET: z.string().min(16),
  OOMI_MODEL_REALTIME: z.string().default("gpt-realtime-2.1"),
  OOMI_MODEL_TRANSCRIBE: z.string().default("gpt-live-transcribe"),
  // gpt-live-transcribe only runs inside live sessions; recorded files use the batch model.
  OOMI_MODEL_TRANSCRIBE_FILE: z.string().default("gpt-transcribe"),
  OOMI_MODEL_BRAIN: z.string().default("gpt-6-luna"),
  OOMI_MODEL_FAST: z.string().default("gpt-5.4-nano"),
  OOMI_MODEL_IMAGE: z.string().default("gpt-image-2"),
  OOMI_MODEL_TTS: z.string().default("gpt-4o-mini-tts"),
  OOMI_MODEL_MODERATION: z.string().default("omni-moderation-latest"),
  OOMI_VOICE: z.string().default("marin"),
});

let cached: z.infer<typeof Env> | undefined;

export function env() {
  cached ??= Env.parse(process.env);
  return cached;
}
