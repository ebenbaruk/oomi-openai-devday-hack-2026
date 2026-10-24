import { z } from "zod";

/** Every expression the device screen can show (SPEC §5.1). */
export const FACES = [
  "idle",
  "listening",
  "thinking",
  "speaking",
  "happy",
  "curious",
  "grown_up",
  "sleep",
] as const;
export type Face = (typeof FACES)[number];

export const VERDICTS = ["answer", "grown_up", "decline"] as const;
export const Verdict = z.enum(VERDICTS);
export type Verdict = z.infer<typeof Verdict>;

/** What the child is trying to do, decided by the server, never by the voice model. */
export const INTENTS = ["question", "challenge_report", "story", "chat"] as const;
export const Intent = z.enum(INTENTS);
export type Intent = z.infer<typeof Intent>;

export const Activity = z.object({
  title: z.string(),
  steps: z.array(z.string()),
  parentTip: z.string(),
});
export type Activity = z.infer<typeof Activity>;

// ---------- Device protocol (simulator today, ESP32 tomorrow) ----------

export const GateRequest = z.object({
  sessionId: z.uuid(),
  transcript: z.string().max(2000),
  /** Seconds the button was held. Used to drop transcription hallucinations on silence. */
  audioSeconds: z.number().min(0).max(120).optional(),
});
export type GateRequest = z.infer<typeof GateRequest>;

export type GateResponse =
  | { action: "ignore"; face: Face; reason: string }
  | { action: "sleep"; face: "sleep"; say: string; reason: string }
  | {
      action: "speak";
      turnId: string;
      verdict: Verdict;
      intent: Intent;
      face: Face;
      /** Face to show once Oomi has finished speaking. */
      endFace: Face;
      /** Per-response instructions for the live voice model. */
      instructions: string;
      /** When set, Oomi must say exactly this text (decline and fallbacks). */
      exactText?: string;
    }
  | { action: "story"; turnId: string; face: Face; say: string };

export const CompleteTurnRequest = z.object({
  sessionId: z.uuid(),
  turnId: z.string().min(1).max(200),
  answer: z.string().max(4000),
});
export type CompleteTurnRequest = z.infer<typeof CompleteTurnRequest>;

export type CompleteTurnResponse = { safe: boolean; replacement?: string };

export type SessionResponse =
  | { status: "sleep"; reason: string; say: string }
  | {
      status: "ready";
      sessionId: string;
      clientSecret: string;
      model: string;
      voice: string;
      childName: string;
      language: "en" | "fr";
    };

export type StoryPage = { text: string; imageId?: string };
export type StoryResponse = { id: string; title: string; text: string };

// ---------- Parent app ----------

export const SettingsInput = z.object({
  firstName: z.string().trim().min(1).max(40),
  age: z.number().int().min(4).max(12),
  language: z.enum(["en", "fr"]),
  maxSessionMinutes: z.number().int().min(5).max(120),
  allowedStart: z.string().regex(/^\d{2}:\d{2}$/),
  allowedEnd: z.string().regex(/^\d{2}:\d{2}$/),
  storyEnabled: z.boolean(),
});
export type SettingsInput = z.infer<typeof SettingsInput>;

export type DiscoveryCard = {
  id: string;
  verdict: Verdict;
  question: string;
  topic: string | null;
  emoji: string | null;
  summary: string | null;
  activity: Activity | null;
  imageUrl: string | null;
  status: "pending" | "ready";
  createdAt: string;
};

export type MemoryItem = {
  id: string;
  kind: "interest" | "challenge" | "fact" | "preference";
  content: string;
  weight: number;
  status: "open" | "done";
  updatedAt: string;
};

export type StoryCard = {
  id: string;
  title: string;
  pages: { text: string; imageUrl: string | null }[];
  createdAt: string;
};

export type SafetyAlert = { id: string; question: string; reason: string; createdAt: string };

export type Journal = {
  child: { firstName: string; age: number; language: "en" | "fr" };
  settings: SettingsInput;
  today: { questions: number; activities: number; topics: number };
  discoveries: DiscoveryCard[];
  grownUp: DiscoveryCard[];
  declinedToday: number;
  alerts: SafetyAlert[];
  memory: MemoryItem[];
  stories: StoryCard[];
};
