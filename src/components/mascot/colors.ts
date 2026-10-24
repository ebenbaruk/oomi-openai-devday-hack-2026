import { DEFAULT_MASCOT, type MascotConfig } from "@/lib/contracts";

type Rgb = [number, number, number];

const NAVY = "#1b1f3b";
const CREAM = "#fff8ee";

function toRgb(hex: string): Rgb {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function toHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((channel) => Math.round(channel).toString(16).padStart(2, "0")).join("")}`;
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/** Blends `a` toward `b` by `amount` (0 keeps a, 1 gives b). */
export function mix(a: string, b: string, amount: number): string {
  const [from, to] = [toRgb(a), toRgb(b)];
  return toHex(from.map((channel, index) => channel + (to[index] - channel) * amount) as Rgb);
}

/** The dark "screen" color: the background when it is dark enough, else the brand navy. */
export function screenColor(background: string): string {
  return luminance(background) < 0.06 ? background : NAVY;
}

/** Eyes and mouth: dark ink on light surfaces, cream on dark ones, so the face always reads. */
export function inkOn(surface: string, background: string): string {
  return luminance(surface) > 0.18 ? screenColor(background) : CREAM;
}

/** Soft blush that stays in the body's color family instead of adding a new hue. */
export function blushOn(surface: string): string {
  return luminance(surface) > 0.3 ? mix(surface, "#ff4f7b", 0.42) : mix(surface, "#ff9db5", 0.55);
}

/** Below this the character melts into its tile. */
export const MIN_BODY_CONTRAST = 1.6;

export type Palette = { id: string; name: string; body: string; accent: string; background: string };

export const PALETTES: Palette[] = [
  { id: "classic", name: "Classic Oomi", body: DEFAULT_MASCOT.bodyColor, accent: DEFAULT_MASCOT.accentColor, background: DEFAULT_MASCOT.backgroundColor },
  { id: "lemon", name: "Lemon sun", body: "#ffd23f", accent: "#4cc3ff", background: "#2b2d6e" },
  { id: "lagoon", name: "Lagoon", body: "#1fc8b4", accent: "#ffc93c", background: "#16224a" },
  { id: "blueberry", name: "Blueberry", body: "#8b6cff", accent: "#ffd447", background: "#24164a" },
  { id: "tomato", name: "Tomato pop", body: "#ff5a3c", accent: "#3d7bff", background: "#1c2340" },
  { id: "bubblegum", name: "Bubblegum", body: "#ff8fb8", accent: "#ffe066", background: "#3a1f4d" },
  { id: "matcha", name: "Matcha", body: "#7fd36b", accent: "#ff8a5c", background: "#163a35" },
  { id: "sky", name: "Sky day", body: "#5ab8ff", accent: "#ffffff", background: "#ffe8a3" },
  { id: "peach", name: "Peach milk", body: "#ffb38a", accent: "#fff3e0", background: "#5b6cff" },
  { id: "mint", name: "Mint ice", body: "#9be8cf", accent: "#ff6f91", background: "#2e3a8c" },
  { id: "marshmallow", name: "Marshmallow", body: "#fff4e6", accent: "#ff7a59", background: "#ff9f7a" },
  { id: "night", name: "Night owl", body: "#2f3a7a", accent: "#ffd166", background: "#9fd7ff" },
];

export function paletteOf(config: Pick<MascotConfig, "bodyColor" | "accentColor" | "backgroundColor">): Palette | undefined {
  return PALETTES.find(
    (palette) =>
      palette.body.toLowerCase() === config.bodyColor.toLowerCase() &&
      palette.accent.toLowerCase() === config.accentColor.toLowerCase() &&
      palette.background.toLowerCase() === config.backgroundColor.toLowerCase(),
  );
}
