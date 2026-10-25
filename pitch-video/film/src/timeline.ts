import vo from "./vo.json";
import { FPS } from "./constants";

export type VoId = keyof typeof vo;

/**
 * The film is paced by its voice-over: each step waits `gap` seconds after the previous one ends.
 * Marks are zero-length steps used as scene boundaries. Change a line, re-run process-vo, and
 * everything downstream re-times itself.
 */
const STEPS: ({ vo: VoId; gap: number } | { mark: string; gap: number })[] = [
  { mark: "hook", gap: 0 },
  { vo: "leo01", gap: 0.5 },
  { vo: "n01", gap: 1.3 },
  { mark: "problem", gap: 0.4 },
  { vo: "n02", gap: 0.4 },
  { vo: "n03", gap: 0.7 },
  { mark: "reveal", gap: 0.8 },
  { vo: "n04", gap: 0.5 },
  { vo: "n05", gap: 0.5 },
  { vo: "n06", gap: 0.6 },
  { mark: "demo", gap: 0.8 },
  { vo: "leo02", gap: 0.9 },
  { vo: "oomi01", gap: 0.9 },
  { mark: "race", gap: 0.3 },
  { vo: "leo03", gap: 2.7 },
  { vo: "oomi02", gap: 0.3 },
  { vo: "n07", gap: 0.3 },
  { mark: "parents", gap: 0.5 },
  { vo: "n08", gap: 0.6 },
  { vo: "n09", gap: 0.4 },
  { vo: "n10", gap: 0.6 },
  { vo: "n11", gap: 0.4 },
  { mark: "trust", gap: 0.8 },
  { vo: "n12", gap: 0.5 },
  { vo: "n13", gap: 0.3 },
  { vo: "n14", gap: 1.2 },
  { mark: "weekend", gap: 0.8 },
  { vo: "n15", gap: 0.5 },
  { vo: "n15b", gap: 0.2 },
  { mark: "team", gap: 0.5 },
  { vo: "n16", gap: 0.3 },
  { vo: "n16b", gap: 0.5 },
  { mark: "close", gap: 1.1 },
  { vo: "n17", gap: 0.5 },
  { mark: "end", gap: 3.9 },
];

const at: Record<string, number> = {};
const end: Record<string, number> = {};
let cursor = 0;
for (const step of STEPS) {
  cursor += step.gap;
  if ("vo" in step) {
    at[step.vo] = cursor;
    cursor += vo[step.vo];
    end[step.vo] = cursor;
  } else {
    at[step.mark] = cursor;
    end[step.mark] = cursor;
  }
}

export const f = (s: number) => Math.round(s * FPS);
/** Start frame of a voice line or mark, plus an optional offset in seconds. */
export const T = (id: string, plus = 0) => f(at[id] + plus);
/** End frame of a voice line, plus an optional offset in seconds. */
export const E = (id: string, plus = 0) => f(end[id] + plus);
export const VO_LINES = STEPS.filter((s): s is { vo: VoId; gap: number } => "vo" in s).map((s) => s.vo);
export const TOTAL = T("end");
