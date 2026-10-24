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

export const careTopicSchema = z.enum(["family_change", "adoption", "grief", "other"]);
export const memoryKindSchema = z.enum(["interest", "challenge", "fact", "preference"]);
export const discoveryStatusSchema = z.enum(["suggested", "completed", "saved"]);
export const alertStatusSchema = z.enum(["new", "read", "dismissed"]);

export const parentSettingsSchema = z.object({
  dailyMinutes: z.number().int().min(1).max(60),
  quietStart: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  quietEnd: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  bedtimeStoryEnabled: z.boolean(),
  parentNotificationsEnabled: z.boolean(),
}).strict();

export const careTopicInputSchema = z.object({
  kind: careTopicSchema,
  active: z.boolean(),
  privateNote: z.string().trim().max(1000).nullable(),
}).strict();

export const discoveryInputSchema = z.object({
  topic: z.string().trim().min(1).max(120),
  summary: z.string().trim().min(1).max(400),
  activityTitle: z.string().trim().min(1).max(120).nullable(),
  activitySteps: z.array(z.string().trim().min(1).max(250)).max(4),
  parentTip: z.string().trim().min(1).max(400).nullable(),
  status: discoveryStatusSchema.default("suggested"),
  sessionId: z.string().uuid().nullable().optional(),
  turnAuditId: z.string().uuid().nullable().optional(),
}).strict();

export const memoryInputSchema = z.object({
  discoveryId: z.string().uuid().nullable(),
  kind: memoryKindSchema,
  content: z.string().trim().min(1).max(400),
  weight: z.number().int().min(1).max(5).default(2),
}).strict();

export const alertStatusInputSchema = z.object({ status: alertStatusSchema }).strict();

export const storyInputSchema = z.object({
  title: z.string().trim().min(1).max(160),
  summary: z.string().trim().min(1).max(600),
  sourceDiscoveryIds: z.array(z.string().uuid()).max(12),
  status: z.enum(["draft", "ready", "failed"]).default("draft"),
}).strict();

// This intentionally stores a category only. The child's wording never enters the parent alert.
export const parentSignalSchema = z.enum(["family_change", "adoption", "grief", "none"]);
export const childProfileInputSchema = z.object({
  name: z.string().trim().min(1).max(60),
  age: z.number().int().min(6).max(10),
  language: languageSchema,
  deviceName: z.string().trim().min(1).max(80),
  pairingCode: z.string().regex(/^\d{6}$/),
}).strict();

export const watchTurnResponseSchema = z.object({
  turnId: z.string().uuid(),
  verdict: verdictSchema,
  state: z.enum(["happy", "grown_up", "decline", "fallback"]),
  text: z.string().min(1).max(800),
  audioBase64: z.string().min(1).max(2_000_000).optional(),
  audioMimeType: z.literal("audio/mpeg").optional(),
}).strict();
export type WatchTurnResponse = z.infer<typeof watchTurnResponseSchema>;
