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

export const LANGUAGES = ["en", "fr"] as const;
export const Language = z.enum(LANGUAGES);
export type Language = z.infer<typeof Language>;

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
      /** Language the child spoke in this turn: Oomi answers in the same one. */
      language: Language;
    }
  | { action: "story"; turnId: string; face: Face; say: string; language: Language };

export const CompleteTurnRequest = z.object({
  sessionId: z.uuid(),
  turnId: z.string().min(1).max(200),
  answer: z.string().max(4000),
  language: Language.default("en"),
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
      language: Language;
      mascot: MascotState;
    };

export const StoryRequest = z.object({ language: Language.optional() });
export type StoryPage = { text: string; imageId?: string };
export type StoryResponse = { id: string; title: string; text: string };

// ---------- Mascot studio (parent settings) ----------

/** Characters the family can pick for Oomi. Each one is drawn in code and can also be painted by GPT Image. */
export const MASCOT_SPECIES = [
  "pebble",
  "cat",
  "bear",
  "bunny",
  "frog",
  "ghost",
  "cloud",
  "octopus",
  "axolotl",
  "robot",
  "dino",
  "penguin",
] as const;
export const MASCOT_EYES = ["round", "dots", "ovals", "sleepy", "sparkle"] as const;
export const MASCOT_MOUTHS = ["none", "smile", "open", "cat"] as const;
export const MASCOT_ACCESSORIES = ["none", "scarf", "cap", "bow", "headphones", "leaf", "crown", "glasses"] as const;
export const MASCOT_PERSONALITIES = ["playful", "calm", "silly", "curious"] as const;
/** Voices available both for the live session and for TTS narration. */
export const MASCOT_VOICES = ["marin", "cedar", "coral", "sage", "shimmer", "ballad", "verse", "alloy", "ash", "echo"] as const;

const HexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const MascotConfig = z.object({
  name: z.string().trim().min(1).max(20),
  species: z.enum(MASCOT_SPECIES),
  bodyColor: HexColor,
  accentColor: HexColor,
  backgroundColor: HexColor,
  eyes: z.enum(MASCOT_EYES),
  mouth: z.enum(MASCOT_MOUTHS),
  cheeks: z.boolean(),
  accessory: z.enum(MASCOT_ACCESSORIES),
  corner: z.enum(["left", "right"]),
  personality: z.enum(MASCOT_PERSONALITIES),
  voice: z.enum(MASCOT_VOICES),
  /** Generated portrait chosen as the avatar, if any (image id from the gallery). */
  portraitId: z.uuid().nullable(),
});
export type MascotConfig = z.infer<typeof MascotConfig>;

export const DEFAULT_MASCOT: MascotConfig = {
  name: "Oomi",
  species: "pebble",
  bodyColor: "#f26a4b",
  accentColor: "#8fdcbb",
  backgroundColor: "#1b1f3b",
  eyes: "round",
  mouth: "none",
  cheeks: false,
  accessory: "none",
  corner: "right",
  personality: "playful",
  voice: "marin",
  portraitId: null,
};

export type MascotPortrait = { id: string; imageUrl: string; species: string; createdAt: string };

export type MascotState = { config: MascotConfig; portraitUrl: string | null; portraits: MascotPortrait[] };

export const PortraitRequest = z.object({ config: MascotConfig });

// ---------- Parent app ----------

export const SettingsInput = z.object({
  firstName: z.string().trim().min(1).max(40),
  age: z.number().int().min(4).max(12),
  language: Language,
  maxSessionMinutes: z.number().int().min(5).max(120),
  allowedStart: z.string().regex(/^\d{2}:\d{2}$/),
  allowedEnd: z.string().regex(/^\d{2}:\d{2}$/),
  storyEnabled: z.boolean(),
  /** Oomi TV: the short explainer videos the child can rewatch on a tablet. */
  videosEnabled: z.boolean(),
});
export type SettingsInput = z.infer<typeof SettingsInput>;

export type VideoStatus = "none" | "pending" | "ready";

export type DiscoveryCard = {
  id: string;
  verdict: Verdict;
  intent: "question" | "challenge_report";
  question: string;
  topic: string | null;
  emoji: string | null;
  summary: string | null;
  activity: Activity | null;
  imageUrl: string | null;
  status: "pending" | "ready";
  /** When the family marked the activity as done together. */
  doneAt: string | null;
  video: { id: string | null; status: VideoStatus };
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
  /** Streamed bedtime narration (mp3). */
  audioUrl: string;
  pages: { text: string; imageUrl: string | null }[];
  createdAt: string;
};

export type SafetyAlert = { id: string; question: string; reason: string; createdAt: string };

/** One day of the week strip in the parent app. */
export type WeekDay = { date: string; questions: number; emojis: string[] };

export type Journal = {
  child: { firstName: string; age: number; language: Language };
  mascot: MascotState;
  settings: SettingsInput;
  today: { questions: number; activities: number; topics: number };
  /** A one-line summary of the day, written for the parent. */
  digest: { headline: string; text: string };
  week: WeekDay[];
  weekTotals: { questions: number; answered: number; grownUp: number; declined: number; activitiesDone: number };
  discoveries: DiscoveryCard[];
  grownUp: DiscoveryCard[];
  declinedToday: number;
  alerts: SafetyAlert[];
  memory: MemoryItem[];
  stories: StoryCard[];
};

export const ActivityDoneRequest = z.object({ done: z.boolean() });

// ---------- Oomi TV (kid tablet) ----------

export const SCENE_COLORS = ["coral", "mint", "sun", "sky", "grape", "bubble"] as const;
export type SceneColor = (typeof SCENE_COLORS)[number];

/** One beat of a motion-design explainer: a big caption, a picture, stickers and one narrated sentence. */
export type ExplainerScene = {
  caption: string;
  narration: string;
  imageUrl: string | null;
  emojis: string[];
  color: SceneColor;
  /** Narration audio (mp3), null while it is being generated. */
  audioUrl: string | null;
};

export type Explainer = {
  id: string;
  discoveryId: string;
  title: string;
  emoji: string;
  language: Language;
  status: "pending" | "ready";
  scenes: ExplainerScene[];
  /** The real-world mission shown at the end: the video always sends the child back to the real world. */
  mission: Activity | null;
  coverUrl: string | null;
};

export type KidVideo = {
  discoveryId: string;
  title: string;
  emoji: string;
  question: string;
  imageUrl: string | null;
  video: { id: string | null; status: VideoStatus };
  createdAt: string;
};

export type KidLibrary = {
  child: { firstName: string; language: Language };
  mascot: MascotState;
  videosEnabled: boolean;
  videos: KidVideo[];
  stories: StoryCard[];
};

export const CreateExplainerRequest = z.object({ discoveryId: z.uuid() });

// ---------- Apple Watch ----------

/** A compact, private copy of the family mascot sent to its paired Watch. */
export const WatchMascot = z.object({
  config: MascotConfig,
  portrait: z.object({ mime: z.string().min(1), base64: z.string().min(1) }).nullable(),
});
export type WatchMascot = z.infer<typeof WatchMascot>;

export const WatchProfileResponse = z.object({
  childName: z.string().min(1),
  mascot: WatchMascot,
});
export type WatchProfileResponse = z.infer<typeof WatchProfileResponse>;

/** Result returned to the watch after a recorded push-to-talk turn. */
export const WatchTurnResponse = z.object({
  turnId: z.string().min(1),
  verdict: Verdict,
  state: z.enum(["happy", "grown_up", "decline"]),
  text: z.string().min(1).max(1000),
  audioBase64: z.string().optional(),
  audioMimeType: z.string().optional(),
  mascot: WatchMascot,
});
export type WatchTurnResponse = z.infer<typeof WatchTurnResponse>;
