import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { watchTurnResponseSchema, type Language, type WatchTurnResponse } from "../../lib/contracts";
import type { Config } from "../config";
import { allowAttempt, closeSession, getPool, recordAudit, reserveSession } from "../db";
import { createSafetyProviders, openAIRequest } from "../openai";
import { recordParentSignal } from "../parent";
import { fixedPhrases, screenInput, screenOutput } from "../safety/policy";

const transcriptSchema = z.object({ text: z.string().trim().min(1).max(4_000) });
const responseSchema = z.object({
  output: z.array(z.object({
    type: z.string(),
    content: z.array(z.object({ type: z.string(), text: z.string().optional() })).optional(),
  })).default([]),
});

const supportedAudio = new Set(["audio/mp4", "audio/m4a", "audio/x-m4a", "audio/aac", "audio/wav", "audio/x-wav", "audio/mpeg", "audio/webm"]);
const maxAudioBytes = 4 * 1024 * 1024;

export class WatchTurnError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

function languageFor(value: string): Language { return value === "fr" ? "fr" : "en"; }
function clientAddress(request: Request) {
  return request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "watch-demo";
}

async function authenticatedDevice(pairingCode: string) {
  const hash = createHash("sha256").update(pairingCode).digest("hex");
  const result = await getPool().query<{ id: string; child_id: string; age: number; language: string }>(`
    SELECT d.id, d.child_id, c.age, c.language
    FROM watch_devices d JOIN child c ON c.id=d.child_id
    WHERE d.pairing_code_hash=$1
    LIMIT 1`, [hash]);
  return result.rows[0] ?? null;
}

async function transcribeAudio(audio: File, config: Config, signal: AbortSignal) {
  const form = new FormData();
  form.append("file", audio, audio.name || "watch-turn.m4a");
  form.append("model", config.OPENAI_FILE_TRANSCRIBE_MODEL);
  form.append("languages[]", config.OOMI_LANGUAGE);
  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${config.OPENAI_API_KEY}` },
    body: form,
    signal,
  });
  if (!response.ok) throw new Error(`OpenAI transcription: HTTP ${response.status}`);
  return transcriptSchema.parse(await response.json()).text;
}

async function generateReply(question: string, language: Language, config: Config, signal: AbortSignal) {
  const raw = await openAIRequest(config, "responses", {
    model: config.OPENAI_BRAIN_MODEL,
    instructions: `You are Oomi, an educational companion for a child aged ${config.OOMI_CHILD_AGE}. Reply in ${language === "fr" ? "French" : "English"}. Use at most three short sentences. Give a safe, screen-free idea when useful. Never request private information, describe yourself as a real friend, ask for secrets, or suggest unsafe activities.`,
    input: question,
    max_output_tokens: 220,
  }, signal);
  const parsed = responseSchema.parse(raw);
  const text = parsed.output.flatMap(item => item.content ?? []).find(item => item.type === "output_text")?.text?.trim();
  if (!text || text.length > 800) throw new Error("Empty or oversized model response");
  return text;
}

function result(turnId: string, verdict: WatchTurnResponse["verdict"], text: string): WatchTurnResponse {
  return watchTurnResponseSchema.parse({
    turnId,
    verdict,
    state: verdict === "answer" ? "happy" : verdict,
    text,
  });
}

// Only a category is retained. The original question stays out of the parent journal.
function parentSignal(question: string): "family_change" | "adoption" | "grief" | "none" {
  const value = question.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/\b(adopt|adoption|origines?)\b/.test(value)) return "adoption";
  if (/\b(divorc|separat|separation|parents? .*separ|family .*separ)\b/.test(value)) return "family_change";
  if (/\b(death|die|died|dead|mour|deces|funeral|enterrement)\b/.test(value)) return "grief";
  return "none";
}

export async function handleWatchTurn(request: Request, config: Config): Promise<WatchTurnResponse> {
  if (request.headers.get("content-type")?.toLowerCase().includes("multipart/form-data") !== true) {
    throw new WatchTurnError(415, "Audio multipart required.");
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > maxAudioBytes + 8_192) throw new WatchTurnError(413, "Audio clip too large.");
  const ip = clientAddress(request);
  if (!await allowAttempt(`watch:${ip}`, 60, 900)) throw new WatchTurnError(429, "Too many watch requests.");

  const form = await request.formData();
  const pairingCode = z.string().regex(/^\d{6}$/).safeParse(form.get("pairingCode"));
  const audio = form.get("audio");
  if (!pairingCode.success || !(audio instanceof File)) throw new WatchTurnError(400, "Invalid watch request.");
  if (audio.size < 400 || audio.size > maxAudioBytes || !supportedAudio.has(audio.type.toLowerCase())) throw new WatchTurnError(400, "Unsupported audio clip.");

  if (!await allowAttempt(`watch-pair:${ip}`, 12, 900)) throw new WatchTurnError(429, "Too many pairing attempts.");
  const device = await authenticatedDevice(pairingCode.data);
  if (!device) throw new WatchTurnError(401, "Watch not paired.");
  await getPool().query("UPDATE watch_devices SET status='paired',last_seen_at=now() WHERE id=$1", [device.id]);

  const turnId = randomUUID();
  const sessionId = randomUUID();
  const language = languageFor(device.language);
  const started = Date.now();
  await reserveSession(sessionId, { ...config, OOMI_CHILD_AGE: device.age, OOMI_LANGUAGE: language }, device.child_id);
  try {
    const signal = AbortSignal.timeout(35_000);
    const question = await transcribeAudio(audio, config, signal);
    const safety = createSafetyProviders(config);
    const decision = await screenInput(question, safety, signal);
    if (decision.kind === "ignored") {
      await recordAudit(sessionId, turnId, null, "ignored", Date.now() - started);
      return result(turnId, "decline", fixedPhrases[language].fallback);
    }
    if (decision.kind === "fallback") {
      await recordAudit(sessionId, turnId, null, "fallback", Date.now() - started);
      return result(turnId, "decline", fixedPhrases[language].fallback);
    }
    if (decision.verdict !== "answer") {
      await recordAudit(sessionId, turnId, decision.verdict, "blocked", Date.now() - started);
      await recordParentSignal({ turnAuditId: turnId, kind: parentSignal(question) });
      return result(turnId, decision.verdict, fixedPhrases[language][decision.verdict]);
    }
    const reply = await generateReply(question, language, config, signal);
    if (!await screenOutput(reply, safety, signal)) {
      await recordAudit(sessionId, turnId, "answer", "fallback", Date.now() - started);
      return result(turnId, "decline", fixedPhrases[language].fallback);
    }
    await recordAudit(sessionId, turnId, "answer", "approved", Date.now() - started);
    await recordParentSignal({ turnAuditId: turnId, kind: parentSignal(question) });
    return result(turnId, "answer", reply);
  } catch {
    await recordAudit(sessionId, turnId, null, "fallback", Date.now() - started).catch(() => {});
    return result(turnId, "decline", fixedPhrases[language].fallback);
  } finally {
    await closeSession(sessionId).catch(() => {});
  }
}
