import { expect, it } from "vitest";
import { AudioGate } from "../src/lib/audio-gate";
it.each([false, true])("requires approval AND delivery in either order (%s)", firstApproval => {
  const gate = new AudioGate(); gate.prepare("turn-1");
  expect(gate.accept(firstApproval ? "approved" : "drained", "turn-1")).toBe(false);
  expect(gate.accept(firstApproval ? "drained" : "approved", "turn-1")).toBe(true);
  expect(gate.accept("approved", "turn-1")).toBe(false);
});
it("cannot replay or unlock a cancelled or different turn", () => {
  const gate = new AudioGate(); gate.prepare("old"); gate.accept("approved", "old"); gate.discard();
  expect(gate.accept("drained", "old")).toBe(false); gate.prepare("new");
  expect(gate.accept("approved", "old")).toBe(false); expect(gate.accept("drained", "new")).toBe(false);
});
