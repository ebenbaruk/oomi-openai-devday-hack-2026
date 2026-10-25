import { FPS } from "./constants";
import { MILESTONES, milestoneAt } from "./scenes/Ending";
import { E, T, TOTAL, VO_LINES } from "./timeline";

/** One sound placed on the film timeline. `gain` is in dB. */
export type Cue = { src: string; frame: number; gain?: number; duration?: number };

const BAR = (60 / 136) * 4;

/**
 * Music: the track plays from its start, then jumps a whole number of bars ahead so its
 * ending lands on the end card without breaking the rhythm.
 */
export const MUSIC = {
  src: "music/happy-kids-playing.wav",
  cutAt: E("n17", 0.4) / FPS,
  jumpBars: 3,
  barSeconds: BAR,
  total: TOTAL / FPS,
};

export const VOICE: Cue[] = VO_LINES.map((id) => ({ src: `vo/${id}.wav`, frame: T(id) }));

const sfx = (name: string, frame: number, gain = -10, duration?: number): Cue => ({ src: `sfx/${name}.wav`, frame, gain, duration });

export const SFX: Cue[] = [
  // 1 · hook: pen on paper, bubbles popping
  sfx("scribble-marker-loop-6s", 2, -20, 2.2),
  ...[0, 50, 64, 78, 90].map((d) => sfx("pop-light-explainer-mixkit", T("leo01") + d, -16)),
  sfx("scribble-short-mixkit", T("leo01", 0.1), -16),
  // wipes and turns
  sfx("paper-rustle-6s-mixkit", T("problem", -0.5), -14, 1.2),
  sfx("page-turn-big-mixkit", T("reveal"), -8),
  sfx("paper-rustle-6s-mixkit", T("demo", -0.5), -14, 1.2),
  sfx("page-turn-big-mixkit", T("parents"), -8),
  sfx("page-turn-single-mixkit", T("trust"), -8),
  sfx("paper-rustle-6s-mixkit", T("weekend", -0.5), -14, 1.2),
  sfx("page-turn-big-mixkit", T("close"), -8),
  // 2 · problem: the world gets scribbled out
  sfx("scribble-marker-loop-6s", T("n03", 1.2), -14, 1.6),
  // 3 · reveal
  sfx("scribble-marker-loop-6s", T("reveal", 0.2), -20, 2.4),
  sfx("chime-magic-sparkle-touch-mixkit", T("n05", 0.2), -12),
  sfx("scribble-marker-loop-6s", T("n05"), -18, 1.2),
  sfx("pop-sticker-synth", T("n06", 0.5), -8),
  // 4 · demo
  sfx("click-switch-tap-mixkit", T("leo02", -0.5), -6),
  sfx("boop-wake-synth", T("leo02", -0.4), -12),
  sfx("pop-sticker-synth", T("oomi01", 4.3), -8),
  sfx("pop-sticker-synth", T("oomi01", 7.2), -8),
  sfx("whoosh-air-mixkit", T("race", 0.3), -8),
  sfx("whoosh-arrow-mixkit", T("race", 0.7), -14),
  sfx("chime-fairy-sparkle-mixkit", T("race", 3.2), -14),
  sfx("scribble-short-mixkit", T("n07", 0.1), -14),
  sfx("pop-sticker-synth", T("n07", 2.0), -8),
  // 5 · parents
  sfx("pop-sticker-synth", T("n08", 0.1), -8),
  sfx("scribble-short-mixkit", T("n08", 1.8), -14),
  sfx("pop-sticker-synth", T("n09", -0.2), -8),
  sfx("pop-sticker-synth", T("n09", 3.0), -10),
  sfx("pop-sticker-synth", T("n10", -0.2), -8),
  ...[0, 6, 12, 18].map((d) => sfx("pop-light-explainer-mixkit", T("n11", -0.3) + d + 20, -14)),
  // 6 · trust
  sfx("click-soft-synth", T("n12", 0.1), -8),
  sfx("scribble-short-mixkit", T("n12", 2.6), -14),
  sfx("scribble-short-mixkit", T("n14", 0.5), -12),
  sfx("whoosh-air-mixkit", T("n14", 1.2), -8),
  // 7 · weekend
  ...MILESTONES.map((_, i) => sfx("pop-light-explainer-mixkit", milestoneAt(i), -16)),
  sfx("page-turn-single-mixkit", T("team", -0.2), -14),
  ...[0, 1, 2].map((i) => sfx("pop-sticker-synth", T("n16", 1.4) + i * 7, -12)),
  sfx("pop-sticker-synth", T("n16b", -0.1), -8),
  // 8 · close
  sfx("whoosh-air-mixkit", T("close", 0.4), -14),
  sfx("chime-magic-sparkle-touch-mixkit", E("n17", 0.5), -10),
];
