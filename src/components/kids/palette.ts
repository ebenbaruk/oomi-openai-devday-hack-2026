import type { SceneColor } from "@/lib/contracts";

/** One crayon family per scene or tile. Full class names so Tailwind can see them. */
export type Swatch = {
  bg: string;
  soft: string;
  strong: string;
  fill: string;
};

export const SWATCHES: Record<SceneColor, Swatch> = {
  coral: { bg: "bg-coral-200", soft: "bg-coral-100", strong: "bg-coral-400", fill: "fill-coral-300" },
  mint: { bg: "bg-mint-200", soft: "bg-mint-100", strong: "bg-mint-400", fill: "fill-mint-300" },
  sun: { bg: "bg-sun-200", soft: "bg-sun-100", strong: "bg-sun-400", fill: "fill-sun-300" },
  sky: { bg: "bg-sky-200", soft: "bg-sky-100", strong: "bg-sky-400", fill: "fill-sky-300" },
  grape: { bg: "bg-grape-200", soft: "bg-grape-100", strong: "bg-grape-400", fill: "fill-grape-300" },
  bubble: { bg: "bg-bubble-200", soft: "bg-bubble-100", strong: "bg-bubble-400", fill: "fill-bubble-300" },
};

const TILE_ORDER: SceneColor[] = ["sky", "sun", "mint", "bubble", "grape", "coral"];

/** Neighbouring tiles never share a color. */
export function tileSwatch(index: number): Swatch {
  return SWATCHES[TILE_ORDER[index % TILE_ORDER.length]];
}
