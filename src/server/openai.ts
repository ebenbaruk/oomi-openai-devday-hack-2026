import "server-only";
import OpenAI from "openai";
import { env } from "./env";

const globalForClient = globalThis as unknown as { oomiOpenAI?: OpenAI };

export function openai(): OpenAI {
  globalForClient.oomiOpenAI ??= new OpenAI({ apiKey: env().OPENAI_API_KEY, maxRetries: 1 });
  return globalForClient.oomiOpenAI;
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
