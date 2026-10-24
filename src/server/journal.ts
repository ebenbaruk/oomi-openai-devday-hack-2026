import "server-only";
import type { Activity, DiscoveryCard, Journal, SafetyAlert, StoryCard, StoryPage, StoryResponse } from "@/lib/contracts";
import { illustrateStory, writeStory } from "./brain";
import { loadChild } from "./child";
import { CHILD_ID, query, queryOne } from "./db";
import { imageUrl } from "./images";

type DiscoveryRow = {
  id: string;
  verdict: DiscoveryCard["verdict"];
  question: string;
  topic: string | null;
  emoji: string | null;
  summary: string | null;
  activity: Activity | null;
  image_id: string | null;
  status: DiscoveryCard["status"];
  created_at: Date;
};

function toCard(row: DiscoveryRow): DiscoveryCard {
  return {
    id: row.id,
    verdict: row.verdict,
    question: row.question,
    topic: row.topic,
    emoji: row.emoji,
    summary: row.summary,
    activity: row.activity,
    imageUrl: imageUrl(row.image_id),
    status: row.status,
    createdAt: row.created_at.toISOString(),
  };
}

export async function buildJournal(): Promise<Journal> {
  const child = await loadChild();
  const [discoveries, stories, alerts, counts] = await Promise.all([
    query<DiscoveryRow>(
      `SELECT id, verdict, question, topic, emoji, summary, activity, image_id, status, created_at
       FROM oomi_app.discovery WHERE child_id = $1 AND verdict IN ('answer', 'grown_up')
       ORDER BY created_at DESC LIMIT 60`,
      [CHILD_ID],
    ),
    query<{ id: string; title: string; pages: StoryPage[]; created_at: Date }>(
      `SELECT id, title, pages, created_at FROM oomi_app.story WHERE child_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [CHILD_ID],
    ),
    query<{ id: string; question: string; reason: string; created_at: Date }>(
      `SELECT id, question, reason, created_at FROM oomi_app.safety_alert WHERE child_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [CHILD_ID],
    ),
    queryOne<{ questions: number; activities: number; topics: number; declined: number }>(
      `SELECT count(*) FILTER (WHERE verdict <> 'decline')::int AS questions,
              count(*) FILTER (WHERE verdict = 'answer' AND activity IS NOT NULL)::int AS activities,
              count(DISTINCT topic) FILTER (WHERE verdict = 'answer')::int AS topics,
              count(*) FILTER (WHERE verdict = 'decline')::int AS declined
       FROM oomi_app.discovery WHERE child_id = $1 AND created_at > date_trunc('day', now() AT TIME ZONE $2) AT TIME ZONE $2`,
      [CHILD_ID, child.settings.timezone],
    ),
  ]);

  const cards = discoveries.map(toCard);
  const { settings } = child;
  return {
    child: { firstName: child.firstName, age: child.age, language: child.language },
    settings: {
      firstName: settings.firstName,
      age: settings.age,
      language: settings.language,
      maxSessionMinutes: settings.maxSessionMinutes,
      allowedStart: settings.allowedStart,
      allowedEnd: settings.allowedEnd,
      storyEnabled: settings.storyEnabled,
    },
    today: { questions: counts?.questions ?? 0, activities: counts?.activities ?? 0, topics: counts?.topics ?? 0 },
    discoveries: cards.filter((card) => card.verdict === "answer"),
    grownUp: cards.filter((card) => card.verdict === "grown_up"),
    declinedToday: counts?.declined ?? 0,
    alerts: alerts.map(
      (row): SafetyAlert => ({ id: row.id, question: row.question, reason: row.reason, createdAt: row.created_at.toISOString() }),
    ),
    memory: child.memory,
    stories: stories.map(
      (row): StoryCard => ({
        id: row.id,
        title: row.title,
        pages: row.pages.map((page) => ({ text: page.text, imageUrl: imageUrl(page.imageId) })),
        createdAt: row.created_at.toISOString(),
      }),
    ),
  };
}

/** Writes the story now; returns the scenes so the caller can illustrate them after responding. */
export async function createStory(): Promise<{ story: StoryResponse; illustrate: () => Promise<void> }> {
  const child = await loadChild();
  const story = await writeStory(child);
  const row = await queryOne<{ id: string }>(
    `INSERT INTO oomi_app.story (child_id, title, pages) VALUES ($1, $2, $3) RETURNING id`,
    [CHILD_ID, story.title, JSON.stringify(story.pages.map((page) => ({ text: page.text })))],
  );
  if (!row) throw new Error("Failed to save story");
  return {
    story: { id: row.id, title: story.title, text: story.pages.map((page) => page.text).join("\n\n") },
    illustrate: () => illustrateStory(row.id, story.pages),
  };
}

export async function deleteMemory(id?: string): Promise<void> {
  if (id) {
    await query(`DELETE FROM oomi_app.memory WHERE id = $1 AND child_id = $2`, [id, CHILD_ID]);
    return;
  }
  await query(`DELETE FROM oomi_app.memory WHERE child_id = $1`, [CHILD_ID]);
}

/** "Tout effacer": every trace of the child's activity, keeping only the profile and settings. */
export async function eraseEverything(): Promise<void> {
  await query(
    `WITH d AS (DELETE FROM oomi_app.discovery WHERE child_id = $1 RETURNING image_id),
          s AS (DELETE FROM oomi_app.story WHERE child_id = $1 RETURNING pages),
          m AS (DELETE FROM oomi_app.memory WHERE child_id = $1),
          a AS (DELETE FROM oomi_app.safety_alert WHERE child_id = $1),
          v AS (DELETE FROM oomi_app.voice_session WHERE child_id = $1)
     DELETE FROM oomi_app.image WHERE id IN (
       SELECT image_id FROM d WHERE image_id IS NOT NULL
       UNION SELECT (page->>'imageId')::uuid FROM s, jsonb_array_elements(s.pages) AS page WHERE page->>'imageId' IS NOT NULL)`,
    [CHILD_ID],
  );
}
