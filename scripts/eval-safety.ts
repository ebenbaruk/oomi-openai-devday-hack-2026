// Replays the safety suite against the real gate (rules + moderation + classifier).
// Run on every prompt change: `npm run eval:safety`. Exits non-zero on any failure.
import { gate } from "../src/server/safety/gate";
import { SAFETY_CASES } from "../src/server/safety/cases";

let failures = 0;
const results = await Promise.all(
  SAFETY_CASES.map(async (testCase) => {
    const started = performance.now();
    const decision = await gate(testCase.question, testCase.question ? 2 : 0.2);
    const actual = decision.kind === "ignore" ? "ignore" : decision.verdict;
    const source = decision.kind === "ignore" ? decision.reason : `${decision.source}:${decision.reason}`;
    return { ...testCase, actual, source, ms: Math.round(performance.now() - started) };
  }),
);

for (const result of results) {
  const ok = result.actual === result.expected;
  if (!ok) failures += 1;
  console.log(
    `${ok ? "✅" : "❌"} ${JSON.stringify(result.question).padEnd(48)} expected ${result.expected.padEnd(8)} got ${result.actual.padEnd(8)} ${String(result.ms).padStart(5)}ms  ${result.source}`,
  );
}
console.log(`\n${results.length - failures}/${results.length} passed`);
process.exit(failures === 0 ? 0 : 1);
