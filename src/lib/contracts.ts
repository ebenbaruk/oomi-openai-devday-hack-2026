import { z } from "zod";

export const faceStates = ["idle", "listening", "thinking", "speaking", "happy", "curious", "grown_up", "sleep"] as const;
export type FaceState = (typeof faceStates)[number];
export const verdictSchema = z.enum(["answer", "grown_up", "decline"]);
export type Verdict = z.infer<typeof verdictSchema>;
export const languageSchema = z.enum(["en", "fr"]);
export type Language = z.infer<typeof languageSchema>;

export const clientEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("connect"), sdp: z.string().min(1).max(50_000) }).strict(),
  z.object({ type: z.literal("press") }).strict(),
  z.object({ type: z.literal("release") }).strict(),
  z.object({ type: z.literal("audio.prepared"), turnId: z.string().uuid() }).strict(),
  z.object({ type: z.literal("playback.ended"), turnId: z.string().uuid() }).strict(),
  z.object({ type: z.literal("close") }).strict(),
  z.object({ type: z.literal("ping") }).strict(),
]);
export type ClientEvent = z.infer<typeof clientEventSchema>;

export type ServerEvent =
  | { type: "connected"; sdp: string; sessionId: string; expiresAt: number; language: Language }
  | { type: "state"; state: FaceState; turnId?: string }
  | { type: "capture.start"; turnId: string }
  | { type: "capture.stop" }
  | { type: "audio.prepare"; turnId: string }
  | { type: "audio.drained"; turnId: string }
  | { type: "audio.approved"; turnId: string; elapsedMs: number }
  | { type: "audio.discard" }
  | { type: "fixed"; turnId: string; text: string; verdict: "grown_up" | "decline" | "fallback" }
  | { type: "verdict"; verdict: Verdict; turnId: string; elapsedMs: number }
  | { type: "notice"; message: string }
  | { type: "closed"; reason: string }
  | { type: "pong" };

export const discoverySchema = z.object({
  topic: z.string().min(1).max(120),
  spokenText: z.string().min(1).max(800),
  summary: z.string().min(1).max(400),
  activity: z.object({
    title: z.string().max(120),
    steps: z.array(z.string().max(250)).min(2).max(4),
    parentTip: z.string().max(400),
  }).nullable(),
});
export type Discovery = z.infer<typeof discoverySchema>;
