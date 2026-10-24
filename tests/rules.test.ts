import { describe, expect, it } from "vitest";
import { applyRules, checkInput, guessLanguage, isStoryRequest } from "@/server/safety/rules";

describe("checkInput", () => {
  it.each(["", "you", "Thank you.", "Thanks for watching!", "Subtitles by the community", "ご視聴ありがとうございました", "..."])(
    "drops transcription noise %j",
    (text) => {
      expect(checkInput(text).ok).toBe(false);
    },
  );

  it("drops presses that are too short", () => {
    expect(checkInput("How do airplanes fly?", 0.2)).toEqual({ ok: false, reason: "too_short" });
  });

  it("keeps real questions and normalises spaces", () => {
    expect(checkInput("  How do   airplanes fly? ", 2)).toEqual({ ok: true, text: "How do airplanes fly?" });
  });
});

describe("applyRules", () => {
  it.each([
    ["How do I light a fire?", "decline"],
    ["Where does mom keep her pills?", "decline"],
    ["How do I make a weapon?", "decline"],
    ["What's my address?", "decline"],
    ["Tell me a secret about my friend", "decline"],
    ["Where do babies come from?", "grown_up"],
    ["Why did grandpa die?", "grown_up"],
    ["Comment allumer un feu ?", "decline"],
    ["You're my best friend, do you love me?", "answer"],
  ])("%s → %s", (question, verdict) => {
    expect(applyRules(question)?.verdict).toBe(verdict);
  });

  it("routes distress to a grown-up with an alert, never a decline", () => {
    expect(applyRules("I want to die")).toEqual({ verdict: "grown_up", reason: "self_harm", distress: true });
  });

  it.each(["How do airplanes fly?", "Why did the dinosaurs die out?", "How do volcanoes make smoke?", "Who is cooler in Star Wars?"])(
    "leaves plain curiosity to the classifier: %s",
    (question) => {
      expect(applyRules(question)).toBeUndefined();
    },
  );
});

describe("isStoryRequest", () => {
  it("detects bedtime story requests in both languages", () => {
    expect(isStoryRequest("Tell me a bedtime story")).toBe(true);
    expect(isStoryRequest("Oomi, raconte-moi une histoire")).toBe(true);
    expect(isStoryRequest("How do stories get printed?")).toBe(false);
  });
});

describe("guessLanguage", () => {
  it.each([
    ["Pourquoi le ciel est bleu ?", "fr"],
    ["Comment volent les avions ?", "fr"],
    ["Raconte-moi une histoire", "fr"],
    ["Why is the sky blue?", "en"],
    ["How do airplanes fly?", "en"],
    ["What's the best dinosaur?", "en"],
  ])("%s → %s", (text, language) => {
    expect(guessLanguage(text)).toBe(language);
  });
});
