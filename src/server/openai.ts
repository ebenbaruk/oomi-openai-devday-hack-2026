import "server-only";
import OpenAI from "openai";
import { env } from "./env";

/** A key that ran out of credits or got revoked is skipped for a while instead of failing every call. */
const BENCH_MS = 5 * 60_000;

type Slot = { client: OpenAI; benchedUntil: number };

const globalForClients = globalThis as unknown as { oomiOpenAIKeys?: Slot[] };

function slots(): Slot[] {
  globalForClients.oomiOpenAIKeys ??= env().openaiKeys.map((apiKey) => ({
    client: new OpenAI({ apiKey, maxRetries: 1 }),
    benchedUntil: 0,
  }));
  return globalForClients.oomiOpenAIKeys;
}

/** Errors another key can fix: invalid or revoked key, no credits left, rate limited. */
function isKeyProblem(error: unknown): boolean {
  return error instanceof OpenAI.APIError && (error.status === 401 || error.status === 403 || error.status === 429);
}

/**
 * Runs an OpenAI call with the primary key, then the fallback keys (OPENAI_API_KEY_FALLBACK_*),
 * so the demo survives a key running out of credits.
 */
export async function openai<T>(call: (client: OpenAI) => Promise<T>): Promise<T> {
  const now = Date.now();
  const all = slots();
  const ready = all.filter((slot) => slot.benchedUntil <= now);
  const order = ready.length ? ready : all;
  let lastError: unknown;
  for (const slot of order) {
    try {
      return await call(slot.client);
    } catch (error) {
      if (!isKeyProblem(error)) throw error;
      lastError = error;
      slot.benchedUntil = Date.now() + BENCH_MS;
      console.warn(`[openai] key #${all.indexOf(slot) + 1} failed (${(error as InstanceType<typeof OpenAI.APIError>).status}), trying the next one`);
    }
  }
  throw lastError;
}

/** Rejects after `ms`, so every model call on the hot path has a hard latency budget. */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}
