import { z } from "zod";
import { discoverySchema, languageSchema, verdictSchema } from "./contracts";

// Shared contracts for the parent journal, the memory and the stories.
// Used by the server (src/server), the dashboard pages (src/app/parent) and the API routes.

export const childSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().min(1).max(60),
  age: z.number().int().min(6).max(10),
  language: languageSchema,
});
export type Child = z.infer<typeof childSchema>;

export const allowedHoursSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
  timezone: z.string().min(1),
});
export const settingsSchema = z.object({
  childId: z.string().uuid(),
  maxSessionMinutes: z.number().int().min(1).max(30),
  allowedHours: allowedHoursSchema,
  storyEnabled: z.boolean(),
});
export type Settings = z.infer<typeof settingsSchema>;
export const settingsPatchSchema = settingsSchema.omit({ childId: true }).partial();

export const imageStatusSchema = z.enum(["none", "pending", "ready", "failed"]);

// One card of the journal. `activity` reuses the Discovery contract (spec §7.8).
export const discoveryCardSchema = z.object({
  id: z.string().uuid(),
  childId: z.string().uuid(),
  verdict: verdictSchema,
  question: z.string().min(1).max(500),
  topic: z.string().max(120).nullable(),
  emoji: z.string().max(8).nullable(),
  summary: z.string().max(400).nullable(),
  spokenText: z.string().max(800).nullable(),
  activity: discoverySchema.shape.activity,
  imageUrl: z.string().url().nullable(),
  imageStatus: imageStatusSchema,
  createdAt: z.string().datetime(),
});
export type DiscoveryCard = z.infer<typeof discoveryCardSchema>;

export const memoryKindSchema = z.enum(["interest", "challenge", "fact", "preference"]);
export const memoryStatusSchema = z.enum(["open", "done", "archived"]);
export const memoryItemSchema = z.object({
  id: z.string().uuid(),
  childId: z.string().uuid(),
  kind: memoryKindSchema,
  content: z.string().min(1).max(300),
  weight: z.number().int().min(0),
  status: memoryStatusSchema,
  updatedAt: z.string().datetime(),
});
export type MemoryItem = z.infer<typeof memoryItemSchema>;

export const storySchema = z.object({
  id: z.string().uuid(),
  childId: z.string().uuid(),
  title: z.string().min(1).max(120),
  text: z.string().min(1).max(6000),
  imageUrls: z.array(z.string().url()).max(4),
  imageStatus: imageStatusSchema,
  createdAt: z.string().datetime(),
});
export type Story = z.infer<typeof storySchema>;

// What the "Aujourd'hui" header of the dashboard shows: three numbers, nothing anxious.
export const todaySummarySchema = z.object({
  questions: z.number().int().min(0),
  activities: z.number().int().min(0),
  topics: z.number().int().min(0),
  grownUpQuestions: z.number().int().min(0),
  safetyAlerts: z.number().int().min(0),
});
export type TodaySummary = z.infer<typeof todaySummarySchema>;

// Memory context injected into every voice turn (spec §7.6). Kept small and text-only.
export const childContextSchema = z.object({
  firstName: z.string(),
  age: z.number().int(),
  language: languageSchema,
  interests: z.array(z.string()).max(8),
  openChallenges: z.array(z.string()).max(3),
  recentDiscoveries: z.array(z.string()).max(3),
  preferences: z.array(z.string()).max(4),
});
export type ChildContext = z.infer<typeof childContextSchema>;
