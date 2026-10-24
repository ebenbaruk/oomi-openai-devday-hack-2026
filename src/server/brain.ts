import "server-only";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import type { Intent } from "@/lib/contracts";
import { loadChild, type ChildContext } from "./child";
import { CHILD_ID, query } from "./db";
import { env } from "./env";
import { illustrate } from "./images";
import { openai } from "./openai";

const DiscoveryOutput = z.object({
  topic: z.string().describe("2-3 word topic, Title Case, e.g. 'Aerodynamics'"),
  emoji: z.string().describe("One single emoji"),
  summary: z.string().describe("One warm sentence for the parent about what the child discovered"),
  activity: z.object({
    title: z.string(),
    steps: z.array(z.string()).describe("2 to 4 short screen-free steps doable at home in under 15 minutes"),
    parentTip: z.string().describe("How the parent can extend the moment together, one sentence"),
  }),
  illustration: z.string().describe("A one-sentence visual scene for a picture-book illustration of this discovery"),
  memory: z.object({
    interests: z.array(z.string()).describe("1-2 short lowercase interest keywords, e.g. 'airplanes'"),
    challenge: z.string().nullable().describe("The real-world challenge Oomi proposed, short, or null"),
    fact: z.string().nullable().describe("What the child learned, one short sentence, or null"),
    preference: z.string().nullable().describe("A stable preference only if clearly expressed, else null"),
  }),
});

function brainContext(child: ChildContext): string {
  const open = child.memory.filter((item) => item.kind === "challenge" && item.status === "open").map((item) => item.content);
  return `Child: ${child.firstName}, ${child.age} years old. Write in ${child.language === "fr" ? "French" : "English"}.
Open challenges: ${open.join("; ") || "none"}.`;
}

async function upsertMemory(kind: "interest" | "challenge" | "fact" | "preference", content: string, status: "open" | "done" = "open") {
  await query(
    `INSERT INTO oomi_app.memory (child_id, kind, content, status) VALUES ($1, $2, $3, $4)
     ON CONFLICT (child_id, kind, lower(content))
     DO UPDATE SET weight = oomi_app.memory.weight + 1, status = EXCLUDED.status, updated_at = now()`,
    [CHILD_ID, kind, content.slice(0, 200), status],
  );
}

/** Background step of a turn (SPEC §7.2 step 5): card, activity, illustration and memory. */
export async function consolidateTurn(input: {
  discoveryId: string;
  question: string;
  answer: string;
  intent: Intent;
  verdict: "answer" | "grown_up";
}) {
  const child = await loadChild();
  const task =
    input.verdict === "grown_up"
      ? "Oomi sent this question to a parent. The card invites the parent to talk about it: summary = a kind, non-alarming sentence; activity = how to start the conversation (title, 2-3 gentle steps, parentTip). memory fields must be empty arrays or null."
      : input.intent === "challenge_report"
        ? "The child reported the result of a real-world challenge. The card celebrates it (topic like 'Challenge done'), the activity is a fun next step to explore further. memory.challenge must be null."
        : "The child asked a question and Oomi answered. Build the discovery card for the parent journal, with the at-home activity matching the experiment Oomi proposed.";

  const response = await openai().responses.parse({
    model: env().OOMI_MODEL_BRAIN,
    reasoning: { effort: "low" },
    instructions: `You are the Brain of Oomi, a kids' explorer companion. ${task}\nNever invent facts about the family. Keep everything positive, simple and safe.`,
    input: `${brainContext(child)}\nChild said: "${input.question}"\nOomi answered: "${input.answer}"`,
    text: { format: zodTextFormat(DiscoveryOutput, "discovery") },
  });
  const card = response.output_parsed;
  if (!card) throw new Error("Brain returned no discovery");

  await query(
    `UPDATE oomi_app.discovery SET topic = $2, emoji = $3, summary = $4, activity = $5, status = 'ready' WHERE id = $1`,
    [input.discoveryId, card.topic, card.emoji, card.summary, JSON.stringify(card.activity)],
  );

  if (input.verdict === "grown_up") return;

  if (input.intent === "challenge_report") {
    await query(
      `UPDATE oomi_app.memory SET status = 'done', updated_at = now()
       WHERE id = (SELECT id FROM oomi_app.memory WHERE child_id = $1 AND kind = 'challenge' AND status = 'open'
                   ORDER BY updated_at DESC LIMIT 1)`,
      [CHILD_ID],
    );
  }
  for (const interest of card.memory.interests.slice(0, 2)) await upsertMemory("interest", interest.toLowerCase());
  if (card.memory.challenge) await upsertMemory("challenge", card.memory.challenge);
  if (card.memory.fact) await upsertMemory("fact", card.memory.fact);
  if (card.memory.preference) await upsertMemory("preference", card.memory.preference);

  const imageId = await illustrate(card.illustration);
  await query(`UPDATE oomi_app.discovery SET image_id = $2 WHERE id = $1`, [input.discoveryId, imageId]);
}

const StoryOutput = z.object({
  title: z.string(),
  pages: z
    .array(
      z.object({
        text: z.string().describe("One paragraph of the story, 60 to 90 words"),
        scene: z.string().describe("One-sentence picture-book scene for this page"),
      }),
    )
    .describe("Exactly 4 pages"),
});

type TodayDiscovery = { question: string; topic: string | null; summary: string | null };

/** SPEC §7.7: a short bedtime story built from today's discoveries, with a real ending. */
export async function writeStory(child: ChildContext) {
  const today = await query<TodayDiscovery>(
    `SELECT question, topic, summary FROM oomi_app.discovery
     WHERE child_id = $1 AND verdict = 'answer' AND created_at > now() - interval '24 hours'
     ORDER BY created_at DESC LIMIT 5`,
    [CHILD_ID],
  );
  const interests = child.memory.filter((item) => item.kind === "interest").slice(0, 3).map((item) => item.content);
  const discoveries = today.map((item) => `- ${item.topic ?? ""}: ${item.summary ?? item.question}`).join("\n");

  const response = await openai().responses.parse({
    model: env().OOMI_MODEL_BRAIN,
    reasoning: { effort: "low" },
    instructions: `You write gentle bedtime stories for a ${child.age}-year-old, read aloud by Oomi, a tiny explorer companion.
Write in ${child.language === "fr" ? "French" : "English"}. ${child.firstName} is the hero. Reuse today's discoveries as the heart of the plot.
Calm, cozy, wonder-filled, slowly winding down. 4 pages. The story MUST have a real, peaceful ending where everyone falls asleep. Never suggest "one more story".`,
    input: `Today's discoveries:\n${discoveries || "- none yet: invent a cozy adventure about curiosity"}\nInterests: ${interests.join(", ") || "exploring"}`,
    text: { format: zodTextFormat(StoryOutput, "story") },
  });
  const story = response.output_parsed;
  if (!story) throw new Error("Brain returned no story");
  return story;
}

export async function illustrateStory(storyId: string, pages: { text: string; scene: string }[]) {
  const imageIds = await Promise.all(
    pages.map((page) =>
      illustrate(page.scene).catch((error: unknown) => {
        console.error("[story] illustration failed:", error);
        return undefined;
      }),
    ),
  );
  const illustrated = pages.map((page, index) => ({ text: page.text, imageId: imageIds[index] }));
  await query(`UPDATE oomi_app.story SET pages = $2 WHERE id = $1`, [storyId, JSON.stringify(illustrated)]);
}
