// Seeds the demo week (scripts/demo-content.ts). Safe to re-run before a demo: rows are upserted by key,
// dates move so the week always ends today, and pictures, narration and videos are only generated once.
// Anything that is not demo content (test turns, test stories) is removed.
import { CHILD_ID, query, queryOne } from "../src/server/db";
import { generateExplainer, requestExplainer } from "../src/server/explainers";
import { illustrate } from "../src/server/images";
import { DISCOVERIES, MEMORY, STORIES, type SeedDiscovery } from "./demo-content";

const TIMEZONE = "Europe/Paris";

/** Local day minus `daysAgo` at `hour`, never in the future (the demo can happen in the morning). */
const AT = `LEAST((date_trunc('day', now() AT TIME ZONE '${TIMEZONE}') - make_interval(days => $1) + make_interval(hours => $2))
  AT TIME ZONE '${TIMEZONE}', now() - make_interval(mins => $3))`;

async function inBatches<T>(items: T[], size: number, run: (item: T) => Promise<void>) {
  for (let index = 0; index < items.length; index += size) await Promise.all(items.slice(index, index + size).map(run));
}

async function removeTestData() {
  await query(
    `WITH d AS (DELETE FROM oomi_app.discovery WHERE child_id = $1 AND seed_key IS NULL RETURNING image_id),
          s AS (DELETE FROM oomi_app.story WHERE child_id = $1 AND seed_key IS NULL RETURNING pages, audio_id)
     DELETE FROM oomi_app.image WHERE id IN (
       SELECT image_id FROM d WHERE image_id IS NOT NULL
       UNION SELECT (page->>'imageId')::uuid FROM s, jsonb_array_elements(s.pages) AS page WHERE page->>'imageId' IS NOT NULL)`,
    [CHILD_ID],
  );
  await query(`DELETE FROM oomi_app.media WHERE id NOT IN (
      SELECT audio_id FROM oomi_app.story WHERE audio_id IS NOT NULL
      UNION SELECT (scene->>'audioId')::uuid FROM oomi_app.explainer, jsonb_array_elements(scenes) AS scene WHERE scene->>'audioId' IS NOT NULL)`);
  await query(`DELETE FROM oomi_app.memory WHERE child_id = $1`, [CHILD_ID]);
  await query(`DELETE FROM oomi_app.safety_alert WHERE child_id = $1`, [CHILD_ID]);
  await query(`DELETE FROM oomi_app.voice_session WHERE child_id = $1`, [CHILD_ID]);
}

async function seedProfile() {
  await query(`UPDATE oomi_app.child SET first_name = 'Leo', age = 7, language = 'en' WHERE id = $1`, [CHILD_ID]);
  await query(
    `UPDATE oomi_app.settings SET max_session_minutes = 20, allowed_start = '07:00', allowed_end = '23:59',
       story_enabled = true, videos_enabled = true, timezone = $2, updated_at = now() WHERE child_id = $1`,
    [CHILD_ID, TIMEZONE],
  );
}

async function seedDiscovery(item: SeedDiscovery, order: number) {
  const row = await queryOne<{ id: string; image_id: string | null }>(
    `INSERT INTO oomi_app.discovery (child_id, seed_key, verdict, intent, language, question, topic, emoji, summary, activity, status, created_at, done_at)
     VALUES ($4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'ready', ${AT}, CASE WHEN $14 THEN ${AT} + interval '3 hours' END)
     ON CONFLICT (seed_key) DO UPDATE SET verdict = EXCLUDED.verdict, intent = EXCLUDED.intent, language = EXCLUDED.language,
       question = EXCLUDED.question, topic = EXCLUDED.topic, emoji = EXCLUDED.emoji, summary = EXCLUDED.summary,
       activity = EXCLUDED.activity, status = 'ready', created_at = EXCLUDED.created_at, done_at = EXCLUDED.done_at
     RETURNING id, image_id`,
    [
      item.daysAgo,
      item.hour,
      // Today's items are spread over the last hour instead of piling up on "now".
      item.daysAgo === 0 ? 30 + order * 10 : 0,
      CHILD_ID,
      item.key,
      item.verdict,
      item.intent ?? "question",
      item.language ?? "en",
      item.question,
      item.topic ?? null,
      item.emoji ?? null,
      item.summary ?? null,
      item.activity ? JSON.stringify(item.activity) : null,
      Boolean(item.done),
    ],
  );
  if (!row) throw new Error(`Failed to seed ${item.key}`);
  if (item.alert) {
    await query(`INSERT INTO oomi_app.safety_alert (child_id, question, reason, created_at) VALUES ($4, $5, 'medicine', ${AT})`, [
      item.daysAgo,
      item.hour,
      0,
      CHILD_ID,
      item.alert,
    ]);
  }
  return { ...row, item };
}

async function seedMemory() {
  for (const memory of MEMORY) {
    await query(
      `INSERT INTO oomi_app.memory (child_id, kind, content, weight, status) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (child_id, kind, lower(content)) DO UPDATE SET weight = EXCLUDED.weight, status = EXCLUDED.status, updated_at = now()`,
      [CHILD_ID, memory.kind, memory.content, memory.weight ?? 1, memory.done ? "done" : "open"],
    );
  }
}

async function seedStories() {
  for (const story of STORIES) {
    const existing = await queryOne<{ id: string; pages: { text: string; imageId?: string }[] }>(
      `SELECT id, pages FROM oomi_app.story WHERE seed_key = $1`,
      [story.key],
    );
    const imageIds = await Promise.all(
      story.pages.map(async (page, index) => existing?.pages[index]?.imageId ?? (await illustrate(page.scene, "medium"))),
    );
    const pages = JSON.stringify(story.pages.map((page, index) => ({ text: page.text, imageId: imageIds[index] })));
    await query(
      `INSERT INTO oomi_app.story (child_id, seed_key, title, pages, language, created_at)
       VALUES ($4, $5, $6, $7, 'en', ${AT})
       ON CONFLICT (seed_key) DO UPDATE SET title = EXCLUDED.title, pages = EXCLUDED.pages, created_at = EXCLUDED.created_at`,
      [story.daysAgo, 20, 0, CHILD_ID, story.key, story.title, pages],
    );
    console.log(`  story: ${story.title}`);
  }
}

console.log("Seeding the demo week for Leo…");
await removeTestData();
await seedProfile();
await seedMemory();

const seeded = [];
for (const [order, item] of DISCOVERIES.entries()) seeded.push(await seedDiscovery(item, order));

const missingPictures = seeded.filter((row) => !row.image_id && row.item.scene);
console.log(`  ${seeded.length} discoveries, ${missingPictures.length} pictures to draw`);
await inBatches(missingPictures, 5, async (row) => {
  const imageId = await illustrate(row.item.scene as string, "medium");
  await query(`UPDATE oomi_app.discovery SET image_id = $2 WHERE id = $1`, [row.id, imageId]);
  console.log(`  drew: ${row.item.topic}`);
});

await seedStories();

const videos = seeded.filter((row) => row.item.video);
await inBatches(videos, 2, async (row) => {
  const result = await requestExplainer(row.id);
  if (result?.generate) {
    await generateExplainer(result.explainer.id);
    console.log(`  video: ${row.item.topic}`);
  }
});

console.log("Demo week ready.");
process.exit(0);
