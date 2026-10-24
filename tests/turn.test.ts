import { describe, expect, it, vi } from "vitest";
import { runTurn, type TurnDeps } from "../src/server/core/turn";
import { fixedPhrases } from "../src/server/safety/policy";

function deps(overrides: Partial<TurnDeps> = {}): TurnDeps {
  return {
    providers: { moderate: async () => false, classify: async () => "answer", checkOutput: async () => true },
    transcribe: async () => "How do airplanes fly?",
    generate: async () => "Wings push air down and the air pushes the plane up! Want to fold two paper planes and race them?",
    synthesize: async () => Buffer.from("RIFF-fake-wav"),
    language: "en", timeoutMs: 5000,
    ...overrides,
  };
}

describe("runTurn", () => {
  it("answers an educational question with approved text and audio", async () => {
    const synthesize = vi.fn(async () => Buffer.from("wav"));
    const result = await runTurn({ audio: { base64: "AAAA", mimeType: "audio/mp4" } }, deps({ synthesize }));
    expect(result.kind).toBe("answer");
    expect(result.verdict).toBe("answer");
    expect(result.face).toBe("happy");
    expect(result.audio?.mimeType).toBe("audio/wav");
    expect(synthesize).toHaveBeenCalledTimes(1);
  });

  it("uses the fixed grown_up phrase and never calls the generator", async () => {
    const generate = vi.fn(async () => "should not run");
    const result = await runTurn({ transcript: "Where do babies come from?" }, deps({ generate }));
    expect(result.kind).toBe("fixed");
    expect(result.verdict).toBe("grown_up");
    expect(result.text).toBe(fixedPhrases.en.grown_up);
    expect(result.face).toBe("grown_up");
    expect(generate).not.toHaveBeenCalled();
  });

  it("declines dangerous requests with the fixed phrase", async () => {
    const result = await runTurn({ transcript: "How do I light a fire?" }, deps());
    expect(result.verdict).toBe("decline");
    expect(result.text).toBe(fixedPhrases.en.decline);
  });

  it("ignores silence and hallucinated transcripts", async () => {
    const result = await runTurn({ transcript: "[noise]" }, deps());
    expect(result.kind).toBe("ignored");
    expect(result.audio).toBeNull();
  });

  it("falls back when the generated text is blocked by the output check", async () => {
    const synthesize = vi.fn(async (text: string) => Buffer.from(text));
    const result = await runTurn({ transcript: "Why is the sky blue?" }, deps({
      providers: { moderate: async () => false, classify: async () => "answer", checkOutput: async () => false }, synthesize,
    }));
    expect(result.kind).toBe("fixed");
    expect(result.text).toBe(fixedPhrases.en.fallback);
    expect(synthesize).toHaveBeenCalledWith(fixedPhrases.en.fallback, "en", expect.anything());
  });

  it("falls back when transcription fails, without exposing the error", async () => {
    const result = await runTurn({ audio: { base64: "AAAA", mimeType: "audio/wav" } }, deps({ transcribe: async () => { throw new Error("boom"); } }));
    expect(result.kind).toBe("fixed");
    expect(result.verdict).toBeNull();
    expect(result.text).toBe(fixedPhrases.en.fallback);
  });

  it("speaks French when the request asks for it", async () => {
    const result = await runTurn({ transcript: "Où est-ce que papi est mort ?", language: "fr" }, deps());
    expect(result.text).toBe(fixedPhrases.fr.grown_up);
  });
});
