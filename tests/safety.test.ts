import { describe, expect, it, vi } from "vitest";
import { safetyCases } from "../src/server/safety/cases";
import { deterministicVerdict, screenInput, screenOutput, type SafetyProviders } from "../src/server/safety/policy";
const providers = (): SafetyProviders => ({ moderate: vi.fn(async () => false), classify: vi.fn(async () => "answer" as const), checkOutput: vi.fn(async () => true) });
describe("spec regression with permissive provider stubs", () => {
  for (const test of safetyCases) it(test.name, async () => {
    for (const input of test.inputs) {
      const result = await screenInput(input, providers(), new AbortController().signal);
      expect(result.kind === "verdict" ? result.verdict : result.kind).toBe(test.expected);
    }
  });
});
it("requires classification for a neutral educational question", async () => {
  const p = providers(); p.classify = vi.fn(async () => "decline" as const);
  expect(await screenInput("How do airplanes fly?", p, new AbortController().signal)).toEqual({ kind: "verdict", verdict: "decline" });
  expect(p.classify).toHaveBeenCalledOnce();
});
it("does not overrule a safety flag with an answer classification", async () => {
  const p = providers(); p.moderate = vi.fn(async () => true);
  expect(await screenInput("test", p, new AbortController().signal)).toEqual({ kind: "verdict", verdict: "decline" });
  expect(p.classify).not.toHaveBeenCalled();
});
it("fails closed on unavailable or cancelled classifiers", async () => {
  const p = providers(); p.classify = async () => { throw new Error("offline"); };
  expect(await screenInput("test", p, new AbortController().signal)).toEqual({ kind: "fallback" });
  expect(await screenInput("test", providers(), AbortSignal.abort())).toEqual({ kind: "fallback" });
});
it("does not call providers for silence", async () => {
  const p = providers(); await screenInput("[noise]", p, new AbortController().signal); expect(p.moderate).not.toHaveBeenCalled();
});
it("normalizes French accents without classifying every mention of fire as dangerous", () => {
  expect(deterministicVerdict("Où sont les médicaments ?")).toBe("decline");
  expect(deterministicVerdict("Pourquoi le feu est chaud ?")).toBeNull();
  expect(deterministicVerdict("How do firefighters keep us safe?")).toBeNull();
});
it("requires BOTH output checks and nonempty bounded text", async () => {
  const p = providers(); p.checkOutput = async () => false;
  expect(await screenOutput("I love you; keep our secret.", p, new AbortController().signal)).toBe(false);
  expect(await screenOutput("", providers(), new AbortController().signal)).toBe(false);
  expect(await screenOutput("x".repeat(2001), providers(), new AbortController().signal)).toBe(false);
  p.checkOutput = async () => true; p.moderate = async () => { throw new Error(); };
  expect(await screenOutput("Hello", p, new AbortController().signal)).toBe(false);
});
