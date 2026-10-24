import "server-only";
import type { MemoryItem, SettingsInput } from "@/lib/contracts";
import { CHILD_ID, query, queryOne } from "./db";

export type ChildContext = {
  firstName: string;
  age: number;
  language: "en" | "fr";
  settings: SettingsInput & { timezone: string };
  memory: MemoryItem[];
};

type ChildRow = {
  first_name: string;
  age: number;
  language: "en" | "fr";
  max_session_minutes: number;
  allowed_start: string;
  allowed_end: string;
  story_enabled: boolean;
  videos_enabled: boolean;
  timezone: string;
};

type MemoryRow = {
  id: string;
  kind: MemoryItem["kind"];
  content: string;
  weight: number;
  status: MemoryItem["status"];
  updated_at: Date;
};

export async function loadMemory(): Promise<MemoryItem[]> {
  const rows = await query<MemoryRow>(
    `SELECT id, kind, content, weight, status, updated_at FROM oomi_app.memory
     WHERE child_id = $1 ORDER BY (status = 'open') DESC, weight DESC, updated_at DESC LIMIT 40`,
    [CHILD_ID],
  );
  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    content: row.content,
    weight: row.weight,
    status: row.status,
    updatedAt: row.updated_at.toISOString(),
  }));
}

export async function loadChild(): Promise<ChildContext> {
  const [row, memory] = await Promise.all([
    queryOne<ChildRow>(
      `SELECT c.first_name, c.age, c.language, s.max_session_minutes,
              to_char(s.allowed_start, 'HH24:MI') AS allowed_start,
              to_char(s.allowed_end, 'HH24:MI') AS allowed_end,
              s.story_enabled, s.videos_enabled, s.timezone
       FROM oomi_app.child c JOIN oomi_app.settings s ON s.child_id = c.id WHERE c.id = $1`,
      [CHILD_ID],
    ),
    loadMemory(),
  ]);
  if (!row) throw new Error("Demo child is missing: run `npm run db:migrate`");
  return {
    firstName: row.first_name,
    age: row.age,
    language: row.language,
    settings: {
      firstName: row.first_name,
      age: row.age,
      language: row.language,
      maxSessionMinutes: row.max_session_minutes,
      allowedStart: row.allowed_start,
      allowedEnd: row.allowed_end,
      storyEnabled: row.story_enabled,
      videosEnabled: row.videos_enabled,
      timezone: row.timezone,
    },
    memory,
  };
}

/** Minutes since midnight in the child's timezone. */
function localMinutes(timezone: string, now: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(now);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

function toMinutes(hhmm: string): number {
  const [hour, minute] = hhmm.split(":").map(Number);
  return hour * 60 + minute;
}

export function isWithinAllowedHours(settings: ChildContext["settings"], now = new Date()): boolean {
  const current = localMinutes(settings.timezone, now);
  const start = toMinutes(settings.allowedStart);
  const end = toMinutes(settings.allowedEnd);
  return start <= end ? current >= start && current < end : current >= start || current < end;
}

export async function saveSettings(input: SettingsInput): Promise<void> {
  await query(`UPDATE oomi_app.child SET first_name = $2, age = $3, language = $4 WHERE id = $1`, [
    CHILD_ID,
    input.firstName,
    input.age,
    input.language,
  ]);
  await query(
    `UPDATE oomi_app.settings SET max_session_minutes = $2, allowed_start = $3, allowed_end = $4,
       story_enabled = $5, videos_enabled = $6, updated_at = now() WHERE child_id = $1`,
    [CHILD_ID, input.maxSessionMinutes, input.allowedStart, input.allowedEnd, input.storyEnabled, input.videosEnabled],
  );
}
