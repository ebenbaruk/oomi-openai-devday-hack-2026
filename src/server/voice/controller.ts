import { randomUUID } from "node:crypto";
import type { Language, ServerEvent, Verdict } from "../../lib/contracts";
import { fixedPhrases, screenInput, screenOutput, type SafetyProviders } from "../safety/policy";

type Stage = "capture" | "transcribing" | "screening" | "preparing" | "generating" | "validating" | "approved" | "fixed";
interface Turn { id: string; stage: Stage; started: number; released: number; text: string; input: string; checkedLength: number; streamCheck?: Promise<void>; verdict: Verdict | null; abort: AbortController; timer?: ReturnType<typeof setTimeout>; }
export interface ControllerDependencies {
  providers: SafetyProviders;
  language: Language;
  timeoutMs: number;
  emit(event: ServerEvent): void;
  command(event: Record<string, unknown>, turnId: string): void;
  audit(turnId: string, verdict: Verdict | null, status: "approved" | "blocked" | "fallback" | "ignored" | "cancelled", elapsed: number): Promise<void>;
  now?: () => number;
}

// Only this state machine can authorize generation and playback.
export class TurnController {
  private turn?: Turn;
  private closed = false;
  private now: () => number;
  constructor(private readonly deps: ControllerDependencies) { this.now = deps.now ?? Date.now; }
  private active(turn: Turn) { return !this.closed && this.turn === turn && !turn.abort.signal.aborted; }
  private elapsed(turn: Turn) { return this.now() - turn.released; }
  private clearTimer(turn: Turn) { if (turn.timer) clearTimeout(turn.timer); }
  private deadline(turn: Turn, ms: number) {
    this.clearTimer(turn);
    turn.timer = setTimeout(() => { if (this.active(turn)) this.fallback(turn); }, ms);
  }
  private signal(turn: Turn) { return AbortSignal.any([turn.abort.signal, AbortSignal.timeout(this.deps.timeoutMs)]); }
  private cancel() {
    const turn = this.turn;
    if (turn) {
      this.clearTimer(turn);
      turn.abort.abort();
      if (turn.stage === "generating" || turn.stage === "validating") this.deps.command({ type: "response.cancel" }, turn.id);
      if (turn.stage !== "approved" && turn.stage !== "fixed") void this.deps.audit(turn.id, turn.verdict, "cancelled", this.elapsed(turn)).catch(() => {});
    }
    this.deps.command({ type: "output_audio_buffer.clear" }, turn?.id ?? "");
    this.deps.emit({ type: "audio.discard" });
  }
  press() {
    if (this.closed || this.turn?.stage === "capture") return;
    this.cancel();
    const now = this.now();
    const turn: Turn = { id: randomUUID(), stage: "capture", started: now, released: now, text: "", input: "", checkedLength: 0, verdict: null, abort: new AbortController() };
    this.turn = turn;
    this.deps.command({ type: "input_audio_buffer.clear" }, turn.id);
    this.deps.emit({ type: "capture.start", turnId: turn.id });
    this.deps.emit({ type: "state", state: "listening", turnId: turn.id });
    turn.timer = setTimeout(() => this.release(), 20_000);
  }
  release() {
    const turn = this.turn;
    if (!turn || this.closed || turn.stage !== "capture") return;
    this.clearTimer(turn);
    this.deps.emit({ type: "capture.stop" });
    turn.released = this.now();
    if (turn.released - turn.started < 200) {
      this.deps.command({ type: "input_audio_buffer.clear" }, turn.id);
      void this.deps.audit(turn.id, null, "ignored", 0).catch(() => {});
      this.turn = undefined;
      this.deps.emit({ type: "state", state: "idle" });
      return;
    }
    turn.stage = "transcribing";
    this.deps.emit({ type: "state", state: "thinking", turnId: turn.id });
    this.deps.command({ type: "input_audio_buffer.commit" }, turn.id);
    this.deadline(turn, 12_000);
  }
  async transcript(turnId: string, text: string) {
    const turn = this.turn;
    if (!turn || turn.id !== turnId || turn.stage !== "transcribing" || !this.active(turn)) return;
    turn.stage = "screening";
    this.deadline(turn, this.deps.timeoutMs + 100);
    const result = await screenInput(text, this.deps.providers, this.signal(turn));
    if (!this.active(turn) || turn.stage !== "screening") return;
    this.clearTimer(turn);
    if (result.kind === "ignored") {
      void this.deps.audit(turn.id, null, "ignored", this.elapsed(turn)).catch(() => {});
      this.deps.emit({ type: "state", state: "idle" });
      this.turn = undefined;
      return;
    }
    if (result.kind === "fallback") return this.fallback(turn);
    turn.verdict = result.verdict;
    turn.input = text;
    this.deps.emit({ type: "verdict", turnId, verdict: result.verdict, elapsedMs: this.elapsed(turn) });
    if (result.verdict !== "answer") return this.fixed(turn, result.verdict);
    turn.stage = "preparing";
    this.deps.emit({ type: "audio.prepare", turnId });
    this.deadline(turn, 5000);
  }
  prepared(turnId: string) {
    const turn = this.turn;
    if (!turn || turn.id !== turnId || turn.stage !== "preparing" || !this.active(turn)) return;
    turn.stage = "generating";
    // An isolated response cannot inherit a rejected or interrupted earlier question.
    this.deps.command({ type: "response.create", response: {
      conversation: "none", input: [{ type: "message", role: "user", content: [{ type: "input_text", text: turn.input }] }],
      output_modalities: ["audio"], metadata: { turn_id: turn.id }, max_output_tokens: 400,
    } }, turn.id);
    this.deadline(turn, 30_000);
  }
  output(turnId: string, delta: string) {
    const turn = this.turn;
    if (!turn || turn.id !== turnId || turn.stage !== "generating" || !this.active(turn)) return;
    turn.text += delta;
    if (turn.text.length > 2000) return this.fallback(turn);
    if (!turn.streamCheck && turn.text.length - turn.checkedLength >= 120) {
      turn.checkedLength = turn.text.length;
      turn.streamCheck = this.deps.providers.moderate(turn.text, this.signal(turn))
        .then(flagged => { if (flagged && this.active(turn)) this.fallback(turn); })
        .catch(() => { if (this.active(turn)) this.fallback(turn); })
        .finally(() => { turn.streamCheck = undefined; });
    }
    // Streaming checks can cancel early; final full-text checks still gate playback.
  }
  async completed(turnId: string, status: string) {
    const turn = this.turn;
    if (!turn || turn.id !== turnId || turn.stage !== "generating" || !this.active(turn)) return;
    if (status !== "completed") return this.fallback(turn);
    turn.stage = "validating";
    this.deadline(turn, this.deps.timeoutMs + 100);
    await turn.streamCheck;
    if (!this.active(turn)) return;
    const approved = await screenOutput(turn.text, this.deps.providers, this.signal(turn));
    if (!this.active(turn) || turn.stage !== "validating") return;
    if (!approved) return this.fallback(turn);
    try { await this.deps.audit(turn.id, turn.verdict, "approved", this.elapsed(turn)); }
    catch { return this.fallback(turn); }
    if (!this.active(turn) || turn.stage !== "validating") return;
    this.clearTimer(turn);
    turn.stage = "approved";
    this.deps.emit({ type: "audio.approved", turnId, elapsedMs: this.elapsed(turn) });
    // Actual playback owns the speaking indicator in the device.
    this.deadline(turn, 45_000);
  }
  drained(turnId: string) {
    const turn = this.turn;
    if (turn && turn.id === turnId && this.active(turn)) this.deps.emit({ type: "audio.drained", turnId });
  }
  playbackEnded(turnId: string) {
    const turn = this.turn;
    if (!turn || turn.id !== turnId || !["approved", "fixed"].includes(turn.stage)) return;
    this.clearTimer(turn);
    this.deps.emit({ type: "state", state: turn.verdict === "answer" ? "happy" : "idle", turnId });
    this.turn = undefined;
  }
  fail() { if (this.turn && !this.closed) this.fallback(this.turn); }
  private fixed(turn: Turn, verdict: "grown_up" | "decline" | "fallback") {
    this.clearTimer(turn);
    turn.stage = "fixed";
    turn.abort.abort();
    this.deps.emit({ type: "audio.discard" });
    this.deps.emit({ type: "fixed", turnId: turn.id, verdict, text: fixedPhrases[this.deps.language][verdict] });
    void this.deps.audit(turn.id, turn.verdict, verdict === "fallback" ? "fallback" : "blocked", this.elapsed(turn)).catch(() => {});
  }
  private fallback(turn: Turn) {
    if (this.closed || this.turn !== turn || turn.stage === "fixed") return;
    if (turn.stage === "generating" || turn.stage === "validating") this.deps.command({ type: "response.cancel" }, turn.id);
    this.deps.command({ type: "output_audio_buffer.clear" }, turn.id);
    this.fixed(turn, "fallback");
  }
  close() {
    if (this.closed) return;
    this.closed = true;
    this.cancel();
    this.deps.emit({ type: "capture.stop" });
    this.deps.emit({ type: "state", state: "sleep" });
    this.turn = undefined;
  }
}
