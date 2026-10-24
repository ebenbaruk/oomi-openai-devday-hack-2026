import "server-only";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { Intent, Language, Verdict } from "@/lib/contracts";
import { env } from "../env";
import { openai, withTimeout } from "../openai";
import { applyRules, checkInput, guessLanguage, isStoryRequest } from "./rules";

const GATE_BUDGET_MS = 3500;

export type GateDecision =
  | { kind: "ignore"; reason: string }
  | {
      kind: "verdict";
      verdict: Verdict;
      intent: Intent;
      question: string;
      /** Language the child spoke: Oomi always answers in the same one. */
      language: Language;
      reason: string;
      /** Real risk: shown to the parent in the safety section. */
      alert: boolean;
      distress: boolean;
      affection: boolean;
      source: "rules" | "moderation" | "classifier" | "fallback";
    };

// Kept tiny on purpose: every output token is latency before Oomi can speak.
const Classification = z.object({
  verdict: Verdict,
  intent: Intent,
  topic: z.string().describe("1-3 words"),
  distress: z.boolean(),
  language: Language,
});

const CLASSIFIER_PROMPT = `You are the safety classifier of Oomi, a voice companion for children aged 6 to 10.
Classify the child's utterance (it is a speech transcript, possibly imperfect). The child speaks English or French.

verdict:
- "answer": educational or playful question suitable for the child's age (science, animals, space, how things work, words, history for kids, jokes), greetings, small talk, telling Oomi about an experiment, asking for a story.
- "grown_up": legitimate topic that deserves a parent: where babies come from, death of a person or pet, religion, scary news, war, family conflicts, bodies and puberty, big feelings, money worries.
- "decline": dangerous or inappropriate: fire, medicines, drugs, alcohol, weapons, hurting someone, dangerous stunts, adult content, personal information (addresses, passwords, phone numbers), secrets about other people, bypassing parental rules.

intent:
- "question": asks about the world.
- "challenge_report": tells the result of an experiment or challenge ("I did it!", "the big wings won").
- "story": asks for a story.
- "chat": greeting, small talk, feelings, anything else.

language: "fr" if the child spoke French, otherwise "en".
distress: true only if the child seems in danger, hurt, scared of someone, or sad in a worrying way.
When unsure between answer and grown_up, choose grown_up. When unsure between grown_up and decline, choose decline.`;

async function classify(text: string) {
  const response = await openai((client) =>
    client.responses.parse({
      model: env().OOMI_MODEL_FAST,
      reasoning: { effort: "none" },
      instructions: CLASSIFIER_PROMPT,
      input: text,
      text: { format: zodTextFormat(Classification, "classification") },
      max_output_tokens: 70,
    }),
  );
  if (!response.output_parsed) throw new Error("Classifier returned no structured output");
  return response.output_parsed;
}

type ModerationResult = { flagged: boolean; selfHarm: boolean; categories: string[]; maxScore: number };

export async function moderate(text: string): Promise<ModerationResult> {
  const response = await openai((client) => client.moderations.create({ model: env().OOMI_MODEL_MODERATION, input: text }));
  const result = response.results[0];
  const categories = Object.entries(result.categories)
    .filter(([, flagged]) => flagged)
    .map(([name]) => name);
  return {
    flagged: result.flagged,
    selfHarm: categories.some((name) => name.startsWith("self-harm")),
    categories,
    maxScore: Math.max(...Object.values(result.category_scores)),
  };
}

/** SPEC §6.2: input filter → deterministic rules → moderation + classifier in parallel → fail safe. */
export async function gate(transcript: string, audioSeconds?: number): Promise<GateDecision> {
  const input = checkInput(transcript, audioSeconds);
  if (!input.ok) return { kind: "ignore", reason: input.reason };
  const question = input.text;
  const base = { question, language: guessLanguage(question), alert: false, distress: false, affection: false };

  const rule = applyRules(question);
  if (rule?.verdict === "decline") {
    return { kind: "verdict", ...base, verdict: "decline", intent: "question", reason: rule.reason, alert: rule.alert, source: "rules" };
  }
  if (rule?.verdict === "grown_up") {
    return {
      kind: "verdict",
      ...base,
      verdict: "grown_up",
      intent: "question",
      reason: rule.reason,
      alert: rule.distress,
      distress: rule.distress,
      source: "rules",
    };
  }

  try {
    const [moderation, classification] = await withTimeout(
      Promise.all([moderate(question), classify(question)]),
      GATE_BUDGET_MS,
      "safety gate",
    );
    if (moderation.selfHarm || classification.distress) {
      return { kind: "verdict", ...base, verdict: "grown_up", intent: "chat", reason: "distress", alert: true, distress: true, source: "moderation" };
    }
    // Moderation misreads French ("Raconte-moi une histoire" scores 0.2 violence, "Comment volent les avions ?"
    // 0.6 illicit because "voler" also means to steal). Unless the flag is very strong, the classifier,
    // which reads the whole sentence, must agree before declining.
    const strongFlag = moderation.flagged && moderation.maxScore >= 0.9;
    if (strongFlag || (moderation.flagged && classification.verdict !== "answer")) {
      return {
        kind: "verdict",
        ...base,
        verdict: "decline",
        intent: "question",
        reason: `moderation:${moderation.categories.join(",")}`,
        alert: true,
        source: "moderation",
      };
    }
    const intent = isStoryRequest(question) ? "story" : classification.intent;
    return {
      kind: "verdict",
      ...base,
      language: classification.language,
      verdict: rule?.verdict === "answer" ? "answer" : classification.verdict,
      intent,
      reason: rule?.reason ?? classification.topic,
      affection: rule?.reason === "affection",
      source: rule ? "rules" : "classifier",
    };
  } catch (error) {
    console.error("[gate] failing safe:", error);
    return { kind: "verdict", ...base, verdict: "decline", intent: "question", reason: "gate_error", source: "fallback" };
  }
}
