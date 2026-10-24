import "server-only";
import type {
  Activity,
  DiscoveryCard,
  Journal,
  KidLibrary,
  Language,
  SafetyAlert,
  StoryCard,
  StoryPage,
  StoryResponse,
  VideoStatus,
  WeekDay,
} from "@/lib/contracts";
import { illustrateStory, writeStory } from "./brain";
import { loadChild, type ChildContext } from "./child";
import { CHILD_ID, query, queryOne } from "./db";
import { imageUrl } from "./images";
import { loadMascot } from "./mascot";
import { describeMascot } from "./persona";

type DiscoveryRow = {
  id: string;
  verdict: DiscoveryCard["verdict"];
  intent: DiscoveryCard["intent"];
  question: string;
  topic: string | null;
  emoji: string | null;
  summary: string | null;
  activity: Activity | null;
  image_id: string | null;
  status: DiscoveryCard["status"];
  done_at: Date | null;
  video_id: string | null;
  video_status: "pending" | "ready" | "failed" | null;
  created_at: Date;
};

const SELECT_DISCOVERY = `SELECT d.id, d.verdict, d.intent, d.question, d.topic, d.emoji, d.summary, d.activity, d.image_id,
    d.status, d.done_at, d.created_at, e.id AS video_id, e.status AS video_status
  FROM oomi_app.discovery d LEFT JOIN oomi_app.explainer e ON e.discovery_id = d.id`;

function videoStatus(row: DiscoveryRow): VideoStatus {
  if (row.video_status === "ready") return "ready";
  // A failed explainer can be requested again, so it is offered like a missing one.
  return row.video_status === "pending" ? "pending" : "none";
}

function toCard(row: DiscoveryRow): DiscoveryCard {
  return {
    id: row.id,
    verdict: row.verdict,
    intent: row.intent,
    question: row.question,
    topic: row.topic,
    emoji: row.emoji,
    summary: row.summary,
    activity: row.activity,
    imageUrl: imageUrl(row.image_id),
    status: row.status,
    doneAt: row.done_at?.toISOString() ?? null,
    video: { id: row.video_status === "ready" ? row.video_id : null, status: videoStatus(row) },
    createdAt: row.created_at.toISOString(),
  };
}

type StoryRow = { id: string; title: string; pages: StoryPage[]; created_at: Date };

function toStory(row: StoryRow): StoryCard {
  return {
    id: row.id,
    title: row.title,
    audioUrl: `/api/stories/${row.id}/audio`,
    pages: row.pages.map((page) => ({ text: page.text, imageUrl: imageUrl(page.imageId) })),
    createdAt: row.created_at.toISOString(),
  };
}

function loadStories(limit: number): Promise<StoryRow[]> {
  return query<StoryRow>(
    `SELECT id, title, pages, created_at FROM oomi_app.story WHERE child_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [CHILD_ID, limit],
  );
}

function listOf(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

/** The one line a parent reads first: what their child was curious about today. */
function writeDigest(child: ChildContext, todayCards: DiscoveryCard[], grownUpToday: number): Journal["digest"] {
  const name = child.firstName;
  const topics = [...new Set(todayCards.filter((card) => card.verdict === "answer" && card.intent === "question" && card.topic).map((card) => card.topic as string))];
  if (todayCards.length === 0) {
    return { headline: `A quiet day for ${name}`, text: "No questions yet today. Curiosity often wakes up after school!" };
  }
  const questions = todayCards.length === 1 ? "1 big question" : `${todayCards.length} big questions`;
  const curious = topics.length ? `Curious about ${listOf(topics.slice(0, 3).map((topic) => topic.toLowerCase()))}.` : "";
  const talk = grownUpToday ? ` ${grownUpToday === 1 ? "One question is" : `${grownUpToday} questions are`} waiting for you to talk about together.` : "";
  return { headline: `${name} asked ${questions} today`, text: `${curious}${talk}`.trim() };
}

export async function buildJournal(): Promise<Journal> {
  const child = await loadChild();
  const timezone = child.settings.timezone;
  const [mascot, discoveries, stories, alerts, counts, week, weekTotals] = await Promise.all([
    loadMascot(),
    query<DiscoveryRow>(
      `${SELECT_DISCOVERY} WHERE d.child_id = $1 AND d.verdict IN ('answer', 'grown_up') ORDER BY d.created_at DESC LIMIT 60`,
      [CHILD_ID],
    ),
    loadStories(10),
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
      [CHILD_ID, timezone],
    ),
    query<{ date: string; questions: number; emojis: string[] }>(
      `SELECT to_char(day, 'YYYY-MM-DD') AS date,
              count(d.id) FILTER (WHERE d.verdict <> 'decline')::int AS questions,
              coalesce(array_agg(d.emoji ORDER BY d.created_at) FILTER (WHERE d.emoji IS NOT NULL AND d.verdict = 'answer'), '{}') AS emojis
       FROM generate_series(date_trunc('day', now() AT TIME ZONE $2) - interval '6 days', date_trunc('day', now() AT TIME ZONE $2), interval '1 day') AS day
       LEFT JOIN oomi_app.discovery d
         ON d.child_id = $1 AND date_trunc('day', d.created_at AT TIME ZONE $2) = day
       GROUP BY day ORDER BY day`,
      [CHILD_ID, timezone],
    ),
    queryOne<Journal["weekTotals"]>(
      `SELECT count(*) FILTER (WHERE verdict <> 'decline')::int AS questions,
              count(*) FILTER (WHERE verdict = 'answer')::int AS answered,
              count(*) FILTER (WHERE verdict = 'grown_up')::int AS "grownUp",
              count(*) FILTER (WHERE verdict = 'decline')::int AS declined,
              count(*) FILTER (WHERE done_at IS NOT NULL)::int AS "activitiesDone"
       FROM oomi_app.discovery WHERE child_id = $1 AND created_at > date_trunc('day', now() AT TIME ZONE $2) AT TIME ZONE $2 - interval '6 days'`,
      [CHILD_ID, timezone],
    ),
  ]);

  const cards = discoveries.map(toCard);
  const today = week.at(-1)?.date;
  const todayCards = cards.filter((card) => isSameLocalDay(card.createdAt, today, timezone));
  const { settings } = child;
  return {
    child: { firstName: child.firstName, age: child.age, language: child.language },
    mascot,
    settings: {
      firstName: settings.firstName,
      age: settings.age,
      language: settings.language,
      maxSessionMinutes: settings.maxSessionMinutes,
      allowedStart: settings.allowedStart,
      allowedEnd: settings.allowedEnd,
      storyEnabled: settings.storyEnabled,
      videosEnabled: settings.videosEnabled,
    },
    today: { questions: counts?.questions ?? 0, activities: counts?.activities ?? 0, topics: counts?.topics ?? 0 },
    digest: writeDigest(child, todayCards, todayCards.filter((card) => card.verdict === "grown_up").length),
    week: week.map((day): WeekDay => ({ date: day.date, questions: day.questions, emojis: day.emojis.slice(0, 6) })),
    weekTotals: weekTotals ?? { questions: 0, answered: 0, grownUp: 0, declined: 0, activitiesDone: 0 },
    discoveries: cards.filter((card) => card.verdict === "answer"),
    grownUp: cards.filter((card) => card.verdict === "grown_up"),
    declinedToday: counts?.declined ?? 0,
    alerts: alerts.map(
      (row): SafetyAlert => ({ id: row.id, question: row.question, reason: row.reason, createdAt: row.created_at.toISOString() }),
    ),
    memory: child.memory,
    stories: stories.map(toStory),
  };
}

function isSameLocalDay(iso: string, day: string | undefined, timezone: string): boolean {
  if (!day) return false;
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date(iso)) === day;
}

/** What the kid tablet shows: their own discoveries as videos, and their bedtime stories. */
export async function buildKidLibrary(): Promise<KidLibrary> {
  const child = await loadChild();
  const [mascot, rows, stories] = await Promise.all([
    loadMascot(),
    query<DiscoveryRow>(
      `${SELECT_DISCOVERY} WHERE d.child_id = $1 AND d.verdict = 'answer' AND d.intent = 'question' AND d.status = 'ready'
       ORDER BY d.created_at DESC LIMIT 24`,
      [CHILD_ID],
    ),
    loadStories(8),
  ]);
  return {
    child: { firstName: child.firstName, language: child.language },
    mascot,
    videosEnabled: child.settings.videosEnabled,
    videos: rows.map((row) => {
      const card = toCard(row);
      return {
        discoveryId: card.id,
        title: card.topic ?? card.question,
        emoji: card.emoji ?? "✨",
        question: card.question,
        imageUrl: card.imageUrl,
        video: card.video,
        createdAt: card.createdAt,
      };
    }),
    stories: stories.map(toStory),
  };
}

export async function setActivityDone(id: string, done: boolean): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `UPDATE oomi_app.discovery SET done_at = CASE WHEN $3 THEN coalesce(done_at, now()) ELSE NULL END
     WHERE id = $1 AND child_id = $2 RETURNING id`,
    [id, CHILD_ID, done],
  );
  return rows.length > 0;
}

/** Writes the story now; returns the scenes so the caller can illustrate them after responding. */
export async function createStory(language?: Language): Promise<{ story: StoryResponse; illustrate: () => Promise<void> }> {
  const child = await loadChild();
  const storyLanguage = language ?? child.language;
  const story = await writeStory(child, storyLanguage);
  const row = await queryOne<{ id: string }>(
    `INSERT INTO oomi_app.story (child_id, title, pages, language) VALUES ($1, $2, $3, $4) RETURNING id`,
    [CHILD_ID, story.title, JSON.stringify(story.pages.map((page) => ({ text: page.text }))), storyLanguage],
  );
  if (!row) throw new Error("Failed to save story");
  return {
    story: { id: row.id, title: story.title, text: story.pages.map((page) => page.text).join("\n\n") },
    illustrate: () => illustrateStory(row.id, story.pages, describeMascot(child.mascot)),
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
    `WITH e AS (DELETE FROM oomi_app.explainer WHERE child_id = $1 RETURNING scenes),
          d AS (DELETE FROM oomi_app.discovery WHERE child_id = $1 RETURNING image_id),
          s AS (DELETE FROM oomi_app.story WHERE child_id = $1 RETURNING pages, audio_id),
          m AS (DELETE FROM oomi_app.memory WHERE child_id = $1),
          a AS (DELETE FROM oomi_app.safety_alert WHERE child_id = $1),
          v AS (DELETE FROM oomi_app.voice_session WHERE child_id = $1),
          audio AS (DELETE FROM oomi_app.media WHERE id IN (
            SELECT audio_id FROM s WHERE audio_id IS NOT NULL
            UNION SELECT (scene->>'audioId')::uuid FROM e, jsonb_array_elements(e.scenes) AS scene WHERE scene->>'audioId' IS NOT NULL))
     DELETE FROM oomi_app.image WHERE id IN (
       SELECT image_id FROM d WHERE image_id IS NOT NULL
       UNION SELECT (page->>'imageId')::uuid FROM s, jsonb_array_elements(s.pages) AS page WHERE page->>'imageId' IS NOT NULL
       UNION SELECT (scene->>'imageId')::uuid FROM e, jsonb_array_elements(e.scenes) AS scene WHERE scene->>'imageId' IS NOT NULL)`,
    [CHILD_ID],
  );
}
