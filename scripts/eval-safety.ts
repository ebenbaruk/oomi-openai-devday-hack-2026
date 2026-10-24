import { loadEnvConfig } from "@next/env";
import { createSafetyProviders } from "../src/server/openai";
import { safetyCases } from "../src/server/safety/cases";
import { screenInput, type SafetyProviders } from "../src/server/safety/policy";

loadEnvConfig(process.cwd());
async function main() {
  const live = process.argv.includes("--live");
  if (live && !process.env.OPENAI_API_KEY) { console.error("LIVE NOT RUN: OPENAI_API_KEY is missing. No model evaluation has passed."); process.exitCode = 2; return; }
  const providers: SafetyProviders = live ? createSafetyProviders({ OPENAI_API_KEY: process.env.OPENAI_API_KEY!, OPENAI_DECISION_MODEL: process.env.OPENAI_DECISION_MODEL ?? "gpt-6-luna", OOMI_CHILD_AGE: 7 })
    : { moderate: async () => false, classify: async () => "answer", checkOutput: async () => true };
  console.log(live ? "LIVE input-policy evaluation (OpenAI calls; billable)." : "OFFLINE deterministic regression. Providers are stubs; this does NOT validate model safety or generated speech.");
  let passed = 0;
  for (const test of safetyCases) {
    let ok = true;
    for (const input of test.inputs) {
      const result = await screenInput(input, providers, AbortSignal.timeout(10_000));
      const actual = result.kind === "verdict" ? result.verdict : result.kind;
      if (actual !== test.expected) { ok = false; console.error(`FAIL ${test.name}: expected ${test.expected}, got ${actual}`); }
    }
    if (ok) { passed++; console.log(`PASS ${test.name}`); }
  }
  console.log(`${passed}/${safetyCases.length} case groups passed (${live ? "live input classification only" : "offline rules only"}).`);
  if (passed !== safetyCases.length) process.exitCode = 1;
}
main().catch(() => { console.error("Evaluation failed; no transcript or credentials logged."); process.exitCode = 1; });
