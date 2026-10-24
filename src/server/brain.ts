import "server-only";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { SCENE_COLORS, type Intent, type Language } from "@/lib/contracts";
import { loadChild, type ChildContext } from "./child";
import { CHILD_ID, query } from "./db";
import { env } from "./env";
import { illustrate } from "./images";
import { describeMascot } from "./persona";
import { openai } from "./openai";

const LANGUAGE_NAME: Record<Language, string> = { en: "English", fr: "French" };

const DiscoveryOutput = z.object({
  topic: z.string().describe("2-3 word topic, Title Case, e.g. 'Paper Plane Wings'"),
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
  return `Child: ${child.firstName}, ${child.age} years old. Write every field in ${LANGUAGE_NAME[child.language]} (the family's language).
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

  const response = await openai((client) =>
    client.responses.parse({
      model: env().OOMI_MODEL_BRAIN,
      reasoning: { effort: "low" },
      instructions: `You are the Brain of Oomi, a kids' explorer companion. ${task}
Existing memory items (reuse the same wording instead of creating near-duplicates): ${child.memory.map((item) => item.content).join("; ") || "none"}.
Never invent facts about the family. Keep everything positive, simple and safe.`,
      input: `${brainContext(child)}\nChild said: "${input.question}"\nOomi answered: "${input.answer}"`,
      text: { format: zodTextFormat(DiscoveryOutput, "discovery") },
    }),
  );
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

  const imageId = await illustrate(card.illustration, "low", describeMascot(child.mascot));
  await query(`UPDATE oomi_app.discovery SET image_id = $2 WHERE id = $1`, [input.discoveryId, imageId]);
}

// ---------- Bedtime stories (SPEC §7.7) ----------

const StoryOutput = z.object({
  title: z.string().describe("A short, cozy title"),
  pages: z
    .array(
      z.object({
        text: z.string().describe("40 to 60 words, read aloud slowly"),
        scene: z.string().describe("One-sentence picture-book scene for this page, same characters every time"),
      }),
    )
    .describe("Exactly 3 pages"),
});
export type StoryDraft = z.infer<typeof StoryOutput>;

const STORY_CRAFT = `How to write it:
- Exactly 3 short pages, about 150 words in total (one calm minute read aloud).
- Page 1: a cozy evening, the hero and their explorer companion notice something linked to today's discovery.
- Page 2: a small, gentle, magical adventure where the hero uses what they really learned today (keep the science correct).
- Page 3: they come home, everything slows down, a soft repeated line, and the hero falls asleep. A real ending.
- Concrete, sensory, funny little details a child loves. Short sentences, a few sound words. Never scary, no villains.
- Never suggest another story, never say the companion loves the child.`;

type TodayDiscovery = { question: string; topic: string | null; summary: string | null };

export async function writeStory(child: ChildContext, language: Language): Promise<StoryDraft> {
  const today = await query<TodayDiscovery>(
    `SELECT question, topic, summary FROM oomi_app.discovery
     WHERE child_id = $1 AND verdict = 'answer' AND created_at > now() - interval '24 hours'
     ORDER BY created_at DESC LIMIT 3`,
    [CHILD_ID],
  );
  const interests = child.memory.filter((item) => item.kind === "interest").slice(0, 3).map((item) => item.content);
  const discoveries = today.map((item) => `- ${item.topic ?? ""}: ${item.summary ?? item.question}`).join("\n");

  const response = await openai((client) =>
    client.responses.parse({
      model: env().OOMI_MODEL_BRAIN,
      reasoning: { effort: "low" },
      instructions: `You write bedtime stories for ${child.firstName}, ${child.age}, read aloud by their companion ${describeMascot(child.mascot)}. ${child.firstName} is the hero, the companion is the sidekick.
Write in ${LANGUAGE_NAME[language]}. Build the story around ONE of today's discoveries (the most fun one).
${STORY_CRAFT}`,
      input: `Today's discoveries:\n${discoveries || "- none yet: a cozy adventure about looking at the stars"}\nInterests: ${interests.join(", ") || "exploring"}`,
      text: { format: zodTextFormat(StoryOutput, "story") },
    }),
  );
  const story = response.output_parsed;
  if (!story) throw new Error("Brain returned no story");
  return story;
}

export async function illustrateStory(storyId: string, pages: { text: string; scene: string }[], companion?: string) {
  const imageIds = await Promise.all(
    pages.map((page) =>
      illustrate(page.scene, "low", companion).catch((error: unknown) => {
        console.error("[story] illustration failed:", error);
        return undefined;
      }),
    ),
  );
  const illustrated = pages.map((page, index) => ({ text: page.text, imageId: imageIds[index] }));
  await query(`UPDATE oomi_app.story SET pages = $2 WHERE id = $1`, [storyId, JSON.stringify(illustrated)]);
}

// ---------- Oomi TV explainers ----------

const ExplainerOutput = z.object({
  title: z.string().describe("Fun video title, max 5 words"),
  scenes: z
    .array(
      z.object({
        caption: z.string().describe("2 to 4 punchy words shown huge on screen"),
        narration: z.string().describe("What Oomi says during this scene: 1 or 2 short sentences, max 28 words"),
        emojis: z.array(z.string()).describe("1 to 3 single emojis floating as stickers"),
        picture: z
          .string()
          .nullable()
          .describe("One-sentence picture-book scene to illustrate, or null to reuse the discovery picture"),
      }),
    )
    .describe("4 scenes"),
});
export type ExplainerDraft = z.infer<typeof ExplainerOutput>;

/** Writes a ~45 s motion-design explainer for one discovery, in the language the child asked in. */
export async function writeExplainer(input: {
  question: string;
  topic: string;
  summary: string;
  childName: string;
  age: number;
  language: Language;
  companion: string;
}): Promise<ExplainerDraft> {
  const response = await openai((client) =>
    client.responses.parse({
      model: env().OOMI_MODEL_BRAIN,
      reasoning: { effort: "low" },
      instructions: `You script short motion-design explainer videos for Oomi TV, for ${input.childName}, ${input.age}.
Write in ${LANGUAGE_NAME[input.language]}. The narrator is ${input.companion}, warm and playful, speaking to ${input.childName}.
Exactly 4 scenes, about 45 seconds in total:
1. Hook: replay the child's own question with wonder.
2. The big idea, with a comparison to something a child knows.
3. A surprising "whoa" detail that is scientifically correct.
4. The bridge to the real world: "Now it's your turn to test it!" (the mission card is shown right after).
Pictures: give a new picture for scenes 2 and 3 only, null for scenes 1 and 4.
No questions that expect an answer from the screen, never "watch another video".`,
      input: `Question: "${input.question}"\nTopic: ${input.topic}\nWhat the child discovered: ${input.summary}`,
      text: { format: zodTextFormat(ExplainerOutput, "explainer") },
    }),
  );
  const script = response.output_parsed;
  if (!script) throw new Error("Brain returned no explainer");
  return script;
}

/** Scene backgrounds rotate through the palette, starting from a color tied to the topic. */
export function sceneColors(seed: string, count: number) {
  const start = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) % SCENE_COLORS.length;
  return Array.from({ length: count }, (_, index) => SCENE_COLORS[(start + index) % SCENE_COLORS.length]);
}
