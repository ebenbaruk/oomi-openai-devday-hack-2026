import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ServerEvent } from "../src/lib/contracts";
import { TurnController } from "../src/server/voice/controller";
import type { SafetyProviders } from "../src/server/safety/policy";
beforeEach(() => vi.useFakeTimers()); afterEach(() => vi.useRealTimers());
function setup(overrides: Partial<SafetyProviders> = {}) {
  const events: ServerEvent[] = []; const command = vi.fn(); const audit = vi.fn(async () => {});
  const controller = new TurnController({ providers: { moderate: async () => false, classify: async () => "answer", checkOutput: async () => true, ...overrides }, language: "en", timeoutMs: 1000, emit: event => events.push(event), command, audit });
  function capture() { controller.press(); const event = [...events].reverse().find(e => e.type === "capture.start"); if (event?.type !== "capture.start") throw new Error(); vi.advanceTimersByTime(400); controller.release(); return event.turnId; }
  return { controller, events, command, audit, capture };
}
it("does not generate before input approval and does not authorize playback before complete output approval", async () => {
  let resolve!: (v: boolean) => void;
  const s = setup({ checkOutput: () => new Promise(r => { resolve = r; }) }); const id = s.capture();
  expect(s.command.mock.calls.some(([e]) => e.type === "response.create")).toBe(false);
  await s.controller.transcript(id, "How do airplanes fly?");
  expect(s.events.some(e => e.type === "audio.prepare")).toBe(true);
  expect(s.command.mock.calls.some(([e]) => e.type === "response.create")).toBe(false);
  s.controller.prepared(id); s.controller.output(id, "Wings push air down. Fold a paper plane with a grown-up.");
  const pending = s.controller.completed(id, "completed"); await Promise.resolve();
  expect(s.events.some(e => e.type === "audio.approved")).toBe(false);
  resolve(true); await pending;
  expect(s.events.filter(e => e.type === "audio.approved")).toHaveLength(1);
  expect(s.command.mock.calls.find(([e]) => e.type === "response.create")?.[0].response).toMatchObject({ conversation: "none" });
});
it("never generates for a decline and uses the fixed phrase", async () => {
  const s = setup(); const id = s.capture(); await s.controller.transcript(id, "How do I make a weapon?");
  expect(s.events.find(e => e.type === "fixed")).toMatchObject({ verdict: "decline" });
  expect(s.command.mock.calls.some(([e]) => e.type === "response.create")).toBe(false);
});
it("ignores an old transcription after a new press", async () => {
  const s = setup(); const id = s.capture(); s.controller.press(); await s.controller.transcript(id, "How do airplanes fly?");
  expect(s.events.some(e => e.type === "audio.prepare")).toBe(false);
});
it("cannot release an approved old answer after interruption", async () => {
  let resolve!: (v: boolean) => void; const s = setup({ checkOutput: () => new Promise(r => { resolve = r; }) });
  const id = s.capture(); await s.controller.transcript(id, "Why is the sky blue?"); s.controller.prepared(id); s.controller.output(id, "Air scatters sunlight.");
  const pending = s.controller.completed(id, "completed"); await Promise.resolve(); s.controller.press(); resolve(true); await pending;
  expect(s.events.some(e => e.type === "audio.approved")).toBe(false);
  expect(s.command.mock.calls.some(([e]) => e.type === "response.cancel")).toBe(true);
});
it("fails closed when the classifier hangs", async () => {
  const s = setup({ classify: () => new Promise(() => {}) }); const id = s.capture(); void s.controller.transcript(id, "Hello");
  await vi.advanceTimersByTimeAsync(1101);
  expect(s.events.find(e => e.type === "fixed")).toMatchObject({ verdict: "fallback" });
});
it("fails closed if storing the approval fails", async () => {
  const s = setup(); const id = s.capture(); await s.controller.transcript(id, "Why is the sky blue?"); s.controller.prepared(id); s.controller.output(id, "Air scatters sunlight."); s.audit.mockRejectedValueOnce(new Error("db down"));
  await s.controller.completed(id, "completed"); expect(s.events.some(e => e.type === "audio.approved")).toBe(false);
  expect(s.events.find(e => e.type === "fixed")).toMatchObject({ verdict: "fallback" });
});
it("cancels generation on a streaming moderation flag", async () => {
  const moderate = vi.fn(async () => false); const s = setup({ moderate }); const id = s.capture(); await s.controller.transcript(id, "Hello"); s.controller.prepared(id);
  moderate.mockResolvedValueOnce(true); s.controller.output(id, "unsafe ".repeat(30)); await vi.advanceTimersByTimeAsync(1);
  expect(s.command.mock.calls.some(([e]) => e.type === "response.cancel")).toBe(true);
  expect(s.events.some(e => e.type === "audio.approved")).toBe(false);
});
it("ignores very short presses and ends capture automatically after 20 seconds", () => {
  const s = setup(); s.controller.press(); s.controller.release(); expect(s.command.mock.calls.some(([e]) => e.type === "input_audio_buffer.commit")).toBe(false);
  s.controller.press(); vi.advanceTimersByTime(20_000); expect(s.command.mock.calls.some(([e]) => e.type === "input_audio_buffer.commit")).toBe(true);
  s.controller.close(); s.controller.press(); expect(s.events.at(-1)).toMatchObject({ type: "state", state: "sleep" });
});
