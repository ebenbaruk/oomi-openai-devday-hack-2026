import { z } from "zod";
import { faceStates, languageSchema, verdictSchema } from "./contracts";

// Turn-by-turn contract (spec §7.1 "mode de secours"), used by devices that cannot do WebRTC:
// the Apple Watch today, the ESP32 tomorrow. Same safety pipeline as the live path, over plain HTTP.

export const turnAudioSchema = z.object({
  base64: z.string().min(1).max(4_000_000),
  mimeType: z.enum(["audio/mp4", "audio/m4a", "audio/wav", "audio/mpeg", "audio/webm"]),
});

export const turnRequestSchema = z.object({
  audio: turnAudioSchema.optional(),
  transcript: z.string().min(1).max(500).optional(),
  language: languageSchema.optional(),
  deviceId: z.string().min(1).max(64).optional(),
}).refine(v => v.audio || v.transcript, { message: "audio or transcript is required" });
export type TurnRequest = z.infer<typeof turnRequestSchema>;

// Per-stage durations, for the latency work. Absent stages were skipped.
export const turnTimingsSchema = z.object({
  transcribeMs: z.number().int().min(0).optional(),
  screenMs: z.number().int().min(0).optional(),
  generateMs: z.number().int().min(0).optional(),
  checkMs: z.number().int().min(0).optional(),
  synthesizeMs: z.number().int().min(0).optional(),
});
export type TurnTimings = z.infer<typeof turnTimingsSchema>;

export const turnResponseSchema = z.object({
  turnId: z.string().uuid(),
  kind: z.enum(["answer", "fixed", "ignored"]),
  verdict: verdictSchema.nullable(),
  transcript: z.string(),
  text: z.string(),
  audio: z.object({ base64: z.string(), mimeType: z.literal("audio/wav") }).nullable(),
  face: z.enum(faceStates),
  elapsedMs: z.number().int().min(0),
  timings: turnTimingsSchema.optional(),
});
export type TurnResponse = z.infer<typeof turnResponseSchema>;

// Header carrying the demo access code for devices without cookies.
export const TURN_ACCESS_HEADER = "x-oomi-access-code";
