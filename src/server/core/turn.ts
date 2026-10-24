import { randomUUID } from "node:crypto";
import type { Language } from "../../lib/contracts";
import type { TurnRequest, TurnResponse, TurnTimings } from "../../lib/turn";
import { fixedPhrases, screenInput, screenOutput, type SafetyProviders } from "../safety/policy";

// The one brain shared by every collier. No transport, no OpenAI client, no database in here:
// everything external comes through `TurnDeps`, so this module is fully testable with stubs.

export interface TurnDeps {
  providers: SafetyProviders;
  transcribe(audio: { base64: string; mimeType: string }, language: Language, signal: AbortSignal): Promise<string>;
  generate(transcript: string, language: Language, signal: AbortSignal): Promise<string>;
  synthesize(text: string, language: Language, signal: AbortSignal): Promise<Buffer>;
  language: Language;
  timeoutMs: number;
  now?: () => number;
}

export async function runTurn(request: TurnRequest, deps: TurnDeps): Promise<TurnResponse> {
  const now = deps.now ?? Date.now;
  const started = now();
  const turnId = randomUUID();
  const language = request.language ?? deps.language;
  const signal = AbortSignal.timeout(deps.timeoutMs);
  const timings: TurnTimings = {};
  const timed = async <T>(key: keyof TurnTimings, work: () => Promise<T>): Promise<T> => {
    const t0 = now();
    try { return await work(); } finally { timings[key] = Math.max(0, Math.round(now() - t0)); }
  };
  const done = (partial: Omit<TurnResponse, "turnId" | "elapsedMs" | "timings">): TurnResponse =>
    ({ turnId, elapsedMs: Math.max(0, Math.round(now() - started)), timings, ...partial });

  const fixed = async (verdict: "grown_up" | "decline" | "fallback", transcript: string): Promise<TurnResponse> => {
    const text = fixedPhrases[language][verdict];
    const audio = await timed("synthesizeMs", () => deps.synthesize(text, language, signal)).catch(() => null);
    return done({
      kind: "fixed", verdict: verdict === "fallback" ? null : verdict, transcript, text,
      audio: audio ? { base64: audio.toString("base64"), mimeType: "audio/wav" } : null,
      face: verdict === "grown_up" ? "grown_up" : "idle",
    });
  };

  let transcript = request.transcript ?? "";
  if (!transcript && request.audio) {
    const audio = request.audio;
    try { transcript = await timed("transcribeMs", () => deps.transcribe(audio, language, signal)); }
    catch { return fixed("fallback", ""); }
  }

  const decision = await timed("screenMs", () => screenInput(transcript, deps.providers, signal));
  if (decision.kind === "ignored") return done({ kind: "ignored", verdict: null, transcript, text: "", audio: null, face: "idle" });
  if (decision.kind === "fallback") return fixed("fallback", transcript);
  if (decision.verdict !== "answer") return fixed(decision.verdict, transcript);

  let text: string;
  try { text = (await timed("generateMs", () => deps.generate(transcript, language, signal))).trim(); }
  catch { return fixed("fallback", transcript); }
  if (!text || !(await timed("checkMs", () => screenOutput(text, deps.providers, signal)))) return fixed("fallback", transcript);

  // Text is approved before any audio exists: the synthesized voice can only say approved words.
  let audio: Buffer;
  try { audio = await timed("synthesizeMs", () => deps.synthesize(text, language, signal)); }
  catch { return fixed("fallback", transcript); }
  return done({ kind: "answer", verdict: "answer", transcript, text, audio: { base64: audio.toString("base64"), mimeType: "audio/wav" }, face: "happy" });
}
