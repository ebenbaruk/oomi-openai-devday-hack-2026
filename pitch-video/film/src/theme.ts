import { loadFont } from "@remotion/google-fonts/Caveat";

export const { fontFamily: HAND } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });

export { FPS, H, W } from "./constants";
import { FPS } from "./constants";

export const C = {
  paper: "#fffdf6",
  line: "#c9dcf2",
  margin: "#f2a3a3",
  ink: "#1d2340",
  coral: "#f26a4b",
  coralLight: "#ff9c80",
  coralDeep: "#d9502f",
  cream: "#fff8ee",
  mint: "#8fdcbb",
  sun: "#f5a912",
  sky: "#5bb5f0",
  postit: "#ffe58a",
  red: "#d9502f",
  white: "#ffffff",
} as const;

export const sec = (s: number) => Math.round(s * FPS);
