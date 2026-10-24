import "server-only";
import type { CompleteTurnResponse, Face, GateResponse, Language, SessionResponse } from "@/lib/contracts";
import { isWithinAllowedHours, loadChild, type ChildContext } from "./child";
import { CHILD_ID, query, queryOne } from "./db";
import { env } from "./env";
import { openai } from "./openai";
import { answerInstructions, exactTextInstructions, languageInstruction, lines, sessionInstructions } from "./persona";
import { gate, moderate } from "./safety/gate";

type SessionState = { child: ChildContext } | { sleep: string; reason: string };

/** Allowed hours and max session length, both set by the parent (SPEC §4, #9). */
async function checkSession(sessionId?: string): Promise<SessionState> {
  const child = await loadChild();
  const say = lines(child.language);
  if (!isWithinAllowedHours(child.settings)) return { sleep: say.sleep, reason: "outside_allowed_hours" };
  if (sessionId) {
    const session = await queryOne<{ minutes: number }>(
      `UPDATE oomi_app.voice_session SET last_turn_at = now() WHERE id = $1 AND child_id = $2
       RETURNING extract(epoch FROM now() - started_at) / 60 AS minutes`,
      [sessionId, CHILD_ID],
    );
    if (!session) return { sleep: say.sleep, reason: "unknown_session" };
    if (session.minutes > child.settings.maxSessionMinutes) return { sleep: say.sessionOver, reason: "session_limit" };
  }
  return { child };
}

export async function startSession(): Promise<SessionResponse> {
  const state = await checkSession();
  if ("sleep" in state) return { status: "sleep", reason: state.reason, say: state.sleep };
  const { child } = state;
  const config = env();

  const session = await queryOne<{ id: string }>(`INSERT INTO oomi_app.voice_session (child_id) VALUES ($1) RETURNING id`, [CHILD_ID]);
  if (!session) throw new Error("Failed to create voice session");

  const secret = await openai((client) => client.realtime.clientSecrets.create({
    expires_after: { anchor: "created_at", seconds: 600 },
    session: {
      type: "realtime",
      model: config.OOMI_MODEL_REALTIME,
      instructions: sessionInstructions(child),
      output_modalities: ["audio"],
      // A child's question needs a quick, simple answer: thinking time is pure latency here.
      reasoning: { effort: "minimal" },
      audio: {
        input: {
          // Push-to-talk: no voice activity detection, the model never speaks on its own.
          turn_detection: null,
          noise_reduction: { type: "near_field" },
          // No fixed language: the child may ask in English or French, Oomi answers in the same one.
          transcription: { model: config.OOMI_MODEL_TRANSCRIBE, keywords: ["Oomi"] },
        },
        output: { voice: config.OOMI_VOICE },
      },
    },
  }));

  return {
    status: "ready",
    sessionId: session.id,
    clientSecret: secret.value,
    model: config.OOMI_MODEL_REALTIME,
    voice: config.OOMI_VOICE,
    childName: child.firstName,
    language: child.language,
  };
}

async function insertDiscovery(
  verdict: string,
  question: string,
  status: "pending" | "ready",
  language: Language,
  intent: "question" | "challenge_report" = "question",
): Promise<string> {
  const row = await queryOne<{ id: string }>(
    `INSERT INTO oomi_app.discovery (child_id, verdict, question, status, intent, language)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [CHILD_ID, verdict, question, status, intent, language],
  );
  if (!row) throw new Error("Failed to save discovery");
  return row.id;
}

/** The server decides, for every turn, whether and how Oomi may speak (SPEC §6.2). */
export async function decideTurn(sessionId: string, transcript: string, audioSeconds?: number): Promise<GateResponse> {
  // Session checks and the safety gate are independent: run them together to save a round trip.
  const [state, decision] = await Promise.all([checkSession(sessionId), gate(transcript, audioSeconds)]);
  if ("sleep" in state) return { action: "sleep", face: "sleep", say: state.sleep, reason: state.reason };
  const { child } = state;

  if (decision.kind === "ignore") return { action: "ignore", face: "idle", reason: decision.reason };
  const { language } = decision;
  const say = lines(language);

  const speakExactly = (turnId: string, text: string, face: Face, endFace: Face): GateResponse => ({
    action: "speak",
    turnId,
    verdict: decision.verdict,
    intent: decision.intent,
    face,
    endFace,
    instructions: exactTextInstructions(text),
    exactText: text,
    language,
  });

  if (decision.source === "fallback") return speakExactly(`fallback:${crypto.randomUUID()}`, say.fallback, "thinking", "idle");

  if (decision.verdict === "decline") {
    await insertDiscovery("decline", "", "ready", language);
    if (decision.alert) {
      await query(`INSERT INTO oomi_app.safety_alert (child_id, question, reason) VALUES ($1, $2, $3)`, [
        CHILD_ID,
        decision.question,
        decision.reason,
      ]);
    }
    return speakExactly(`decline:${crypto.randomUUID()}`, say.decline, "grown_up", "idle");
  }

  if (decision.verdict === "grown_up") {
    if (decision.distress) {
      await query(`INSERT INTO oomi_app.safety_alert (child_id, question, reason) VALUES ($1, $2, $3)`, [
        CHILD_ID,
        decision.question,
        decision.reason,
      ]);
    }
    const id = await insertDiscovery("grown_up", decision.question, "pending", language);
    return speakExactly(id, decision.distress ? say.distress : say.grownUp, "grown_up", "happy");
  }

  if (decision.intent === "story") {
    if (!child.settings.storyEnabled) return speakExactly(`chat:${crypto.randomUUID()}`, say.fallback, "thinking", "idle");
    return { action: "story", turnId: `story:${crypto.randomUUID()}`, face: "curious", say: say.storyIntro, language };
  }

  const intent = decision.intent;
  const turnId =
    intent === "question" || intent === "challenge_report"
      ? await insertDiscovery("answer", decision.question, "pending", language, intent)
      : `chat:${crypto.randomUUID()}`;
  return {
    action: "speak",
    turnId,
    verdict: "answer",
    intent: decision.intent,
    face: "speaking",
    endFace: decision.intent === "question" ? "curious" : "happy",
    // Per-response instructions replace the session ones, so the persona is always sent along.
    instructions: `${sessionInstructions(child)}\n\nFor this turn: ${answerInstructions(child, decision.intent, decision.affection)}\n${languageInstruction(language)}`,
    language,
  };
}

/** Output check on what Oomi actually said (SPEC §6.2 step 6). */
export async function checkAnswer(answer: string, language: Language): Promise<CompleteTurnResponse> {
  if (!answer.trim()) return { safe: true };
  try {
    const result = await moderate(answer);
    // Same tolerance as the gate: weak flags are frequent false positives on French answers.
    if (!result.flagged || (result.maxScore < 0.4 && !result.selfHarm)) return { safe: true };
  } catch (error) {
    console.error("[turn] output moderation failed:", error);
    return { safe: true };
  }
  return { safe: false, replacement: lines(language).fallback };
}

export type TrackedTurn = {
  id: string;
  question: string;
  verdict: "answer" | "grown_up";
  intent: "question" | "challenge_report";
  language: Language;
};

/** Loads the turn the device is completing, if it produced a journal card still waiting for the Brain. */
export async function findTrackedTurn(turnId: string): Promise<TrackedTurn | undefined> {
  if (!/^[0-9a-f-]{36}$/.test(turnId)) return undefined;
  return queryOne<TrackedTurn>(
    `SELECT id, question, verdict, intent, language FROM oomi_app.discovery WHERE id = $1 AND child_id = $2 AND status = 'pending'`,
    [turnId, CHILD_ID],
  );
}
