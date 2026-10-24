import { z } from "zod";

const schema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  DATABASE_URL: z.string().url(),
  OOMI_ACCESS_CODE: z.string().min(16),
  OOMI_SESSION_SECRET: z.string().min(32),
  APP_ORIGIN: z.string().url().default("http://localhost:3000"),
  OPENAI_REALTIME_MODEL: z.string().default("gpt-realtime-2.1-mini"),
  OPENAI_TRANSCRIBE_MODEL: z.string().default("gpt-live-transcribe"),
  OPENAI_FILE_TRANSCRIBE_MODEL: z.string().default("gpt-transcribe"),
  OPENAI_TTS_MODEL: z.string().default("gpt-4o-mini-tts"),
  OPENAI_TTS_VOICE: z.string().default("coral"),
  OPENAI_DECISION_MODEL: z.string().default("gpt-6-luna"),
  OPENAI_BRAIN_MODEL: z.string().default("gpt-6.1-sol"),
  OPENAI_IMAGE_MODEL: z.string().default("gpt-image-2.5-flare"),
  OOMI_LANGUAGE: z.enum(["fr", "en"]).default("en"),
  OOMI_CHILD_AGE: z.coerce.number().int().min(6).max(10).default(7),
  OOMI_SESSION_SECONDS: z.coerce.number().int().min(30).max(240).default(240),
  OOMI_SAFETY_TIMEOUT_MS: z.coerce.number().int().min(500).max(10_000).default(4000),
});
export type Config = z.infer<typeof schema>;
export function getConfig(): Config { return schema.parse(process.env); }
export function configurationStatus() {
  const parsed = schema.safeParse(process.env);
  return { ready: parsed.success, missing: parsed.success ? [] : [...new Set(parsed.error.issues.map(i => i.path[0]).filter(Boolean))] };
}
