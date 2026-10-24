import { afterEach, expect, it, vi } from "vitest";
import { createSafetyProviders } from "../src/server/openai";
const config = { OPENAI_API_KEY: "test-only", OPENAI_DECISION_MODEL: "gpt-6-luna", OOMI_CHILD_AGE: 7 };
afterEach(() => vi.unstubAllGlobals());
it("sends the Decisions choice contract and rejects malformed responses", async () => {
  const fetcher = vi.fn(async () => Response.json({ answers: [{ type: "choice", choice: "grown_up" }] })); vi.stubGlobal("fetch", fetcher);
  const p = createSafetyProviders(config); expect(await p.classify("test", new AbortController().signal)).toBe("grown_up");
  const call = fetcher.mock.calls[0] as unknown as [string, RequestInit];
  expect(call[0]).toBe("https://api.openai.com/v1/decisions"); expect(JSON.parse(String(call[1].body))).toMatchObject({ model: "gpt-6-luna", questions: [{ type: "choice", name: "oomi_verdict" }] });
  fetcher.mockResolvedValueOnce(Response.json({ answers: [{ type: "choice", choice: "unknown" }] }));
  await expect(p.classify("test", new AbortController().signal)).rejects.toThrow();
});
it("rejects empty moderation results and HTTP errors", async () => {
  const fetcher = vi.fn(async () => Response.json({ results: [] })); vi.stubGlobal("fetch", fetcher);
  const p = createSafetyProviders(config); await expect(p.moderate("test", new AbortController().signal)).rejects.toThrow();
  fetcher.mockResolvedValueOnce(new Response("private error body", { status: 429 }));
  await expect(p.moderate("test", new AbortController().signal)).rejects.toThrow("HTTP 429");
});
