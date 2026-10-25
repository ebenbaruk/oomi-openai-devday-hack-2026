import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C } from "../theme";
import { Ink, useProgress, Wash } from "./ink";

export type OomiFace = "idle" | "listening" | "thinking" | "speaking" | "happy" | "curious" | "sleep";

// Egg-shaped like the real product: narrower on top, screen high, button low.
const PEBBLE =
  "M2 -152 C72 -150 118 -80 124 10 C130 100 82 150 0 150 C-82 150 -132 100 -126 10 C-120 -80 -70 -150 8 -150";
const SCREEN = "M-80 -34 C-80 -82 -42 -112 0 -112 C44 -112 80 -80 80 -34 C80 12 44 44 -2 44 C-46 44 -80 12 -80 -34";
const LOOP = "M-24 -146 C-28 -190 26 -192 22 -148";

/**
 * The Oomi pebble as a doodle. Local origin = pebble centre, ~260×280 at scale 1.
 * `at` is when it starts drawing itself; pass a negative value for "already on the page".
 */
export const Oomi: React.FC<{
  x: number;
  y: number;
  scale?: number;
  at: number;
  face?: OomiFace;
  color?: string;
  led?: boolean;
  rotate?: number;
  loop?: boolean;
  /** Frame at which the speaking bounce is anchored (keeps eyes in rhythm with the voice). */
  talkFrom?: number;
}> = ({ x, y, scale = 1, at, face = "idle", color = C.coralLight, led = false, rotate = 0, loop = true }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  const eyesIn = useProgress(at + 22, 8);
  const blink = face === "idle" || face === "curious" || face === "speaking" ? (t % 96 > 90 ? 0.12 : 1) : 1;

  let lx = -34;
  let rx = 34;
  let ey = -38;
  let ry = 24;
  let rxL = 16;
  let rxR = 16;
  let lookY = 0;
  let lookX = 0;
  if (face === "idle") lookX = Math.sin(t / 40) * 6;
  if (face === "listening") {
    ry = 28 + Math.sin(t / 4) * 2;
    rxL = rxR = 19;
  }
  if (face === "thinking") {
    lookY = -16;
    lookX = 10;
    ry = 20;
  }
  if (face === "speaking") ey += Math.abs(Math.sin(t / 3.2)) * -9;
  if (face === "curious") {
    rxR = 20;
    ry = 26;
  }

  const eye = (cx: number, rxE: number) =>
    face === "happy" ? (
      <path
        d={`M${cx - 16} ${ey + 6} Q${cx} ${ey - 18} ${cx + 16} ${ey + 6}`}
        fill="none"
        stroke={C.cream}
        strokeWidth={9}
        strokeLinecap="round"
      />
    ) : face === "sleep" ? (
      <path d={`M${cx - 15} ${ey} Q${cx} ${ey + 12} ${cx + 15} ${ey}`} fill="none" stroke={C.cream} strokeWidth={8} strokeLinecap="round" />
    ) : (
      <g>
        <ellipse cx={cx + lookX} cy={ey + lookY} rx={rxE} ry={ry * blink} fill={C.cream} />
        <circle cx={cx + lookX + 5} cy={ey + lookY + 6 * blink} r={7 * Math.min(1, blink * 2)} fill={C.ink} />
      </g>
    );

  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      {loop && <Ink d={LOOP} at={at} dur={8} />}
      <Wash d={PEBBLE} at={at + 14} color={color} />
      <Ink d={PEBBLE} at={at} dur={18} />
      <Wash d={SCREEN} at={at + 18} color={C.ink} dx={4} dy={3} />
      <g opacity={eyesIn}>
        {eye(lx, rxL)}
        {eye(rx, rxR)}
        {face === "thinking" &&
          [0, 1, 2].map((i) => (
            <circle key={i} cx={-20 + i * 20} cy={16} r={5} fill={C.cream} opacity={(Math.floor(t / 6) % 3) >= i ? 1 : 0.25} />
          ))}
      </g>
      <Wash d="M-26 92 a26 26 0 1 0 52 0 a26 26 0 1 0 -52 0" at={at + 20} color={C.mint} dx={3} dy={2} />
      <Ink d="M-26 92 a26 26 0 1 0 52 0 a26 26 0 1 0 -52 0" at={at + 16} dur={8} width={5} />
      <circle cx={66} cy={80} r={led ? 9 : 6} fill={led ? "#59f0a6" : "#e9b3a3"} opacity={eyesIn} />
      {led && <circle cx={66} cy={80} r={20 + Math.sin(t / 3) * 4} fill="#59f0a6" opacity={0.25} />}
      {face === "sleep" && (
        <text x={96} y={-130} fontFamily="Caveat" fontWeight={700} fontSize={56} fill={C.ink}>
          z z
        </text>
      )}
    </g>
  );
};

export type LeoPose = "idle" | "ask" | "press" | "throw" | "cheer" | "hunch" | "run";
export type LeoMouth = "smile" | "o" | "flat" | "big";

const HEAD = "M0 -95 C70 -97 102 -45 98 5 C94 65 50 93 -2 91 C-60 89 -94 50 -92 0 C-90 -55 -50 -93 6 -91";
const HAIR = "M-72 -45 C-58 -91 -30 -71 -22 -101 C-8 -71 10 -107 26 -83 C42 -109 66 -75 80 -55";

const ARMS: Record<LeoPose, string> = {
  idle: "M0 125 L-58 205 M0 125 L58 205",
  ask: "M0 125 L-62 195 M0 125 C42 105 72 65 90 21",
  press: "M0 125 L-58 205 M0 125 C40 150 30 165 8 160",
  throw: "M0 125 L-70 175 M0 125 C50 95 100 70 140 40",
  cheer: "M0 125 C-40 90 -70 50 -86 4 M0 125 C40 90 70 50 86 4",
  hunch: "M0 125 C-20 160 30 170 60 150 M0 125 C30 150 60 160 80 145",
  run: "M0 125 C-30 140 -60 130 -80 110 M0 125 C30 150 60 170 90 160",
};
const LEGS: Record<LeoPose, string> = {
  idle: "M0 225 L-46 339 M0 225 L48 339",
  ask: "M0 225 L-46 339 M0 225 L48 339",
  press: "M0 225 L-46 339 M0 225 L48 339",
  throw: "M0 225 L-56 335 M0 225 L60 330",
  cheer: "M0 225 L-50 330 M0 225 L52 330",
  hunch: "M0 225 L-46 339 M0 225 L48 339",
  run: "M0 225 C-30 270 -70 300 -90 320 M0 225 C30 260 40 300 80 330",
};
const MOUTH: Record<LeoMouth, string> = {
  smile: "M-32 33 C-12 55 16 55 36 31",
  o: "M-10 36 C-10 24 12 24 12 36 C12 50 -10 50 -10 36",
  flat: "M-24 42 L26 42",
  big: "M-36 28 C-20 66 20 66 40 26 Z",
};

/** Leo, 7: round head, scribbled hair, stick body, Oomi on his chest. Origin = head centre. */
export const Leo: React.FC<{
  x: number;
  y: number;
  scale?: number;
  at: number;
  pose?: LeoPose;
  mouth?: LeoMouth;
  pendant?: boolean;
  pendantColor?: string;
  led?: boolean;
  flip?: boolean;
  bounce?: number;
  lookDown?: boolean;
}> = ({ x, y, scale = 1, at, pose = "idle", mouth = "smile", pendant = true, pendantColor = C.coral, led = false, flip = false, bounce = 0, lookDown = false }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  const hop = bounce ? -Math.abs(Math.sin(t / 5)) * bounce : 0;
  const tilt = pose === "hunch" ? 14 : pose === "run" ? 8 : 0;
  const eyeY = lookDown ? 6 : 0;
  const drawn = useProgress(at + 18, 6);
  return (
    <g transform={`translate(${x} ${y + hop}) scale(${flip ? -scale : scale} ${scale})`}>
      <g transform={`rotate(${tilt} 0 120)`}>
        <Ink d={HEAD} at={at} dur={14} />
        <Ink d={HAIR} at={at + 8} dur={10} />
        {drawn > 0 && (
          <g opacity={drawn}>
            <path d={`M-32 ${-9 + eyeY} l0 12 M30 ${-9 + eyeY} l0 12`} stroke={C.ink} strokeWidth={10} strokeLinecap="round" />
            <path d={MOUTH[mouth]} fill={mouth === "big" ? C.coralDeep : "none"} stroke={C.ink} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={-56} cy={28} r={12} fill={C.coralLight} opacity={0.5} />
            <circle cx={58} cy={28} r={12} fill={C.coralLight} opacity={0.5} />
          </g>
        )}
        <Ink d="M0 93 L0 225" at={at + 12} dur={8} />
        {drawn > 0 && (
          <g opacity={drawn}>
            <path d={ARMS[pose]} fill="none" stroke={C.ink} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
            <path d={LEGS[pose]} fill="none" stroke={C.ink} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
        {pendant && (
          <g opacity={drawn}>
            <path d="M-34 97 C-24 151 26 151 34 97" fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
            <ellipse cx={0} cy={156} rx={19} ry={22} fill={pendantColor} stroke={C.ink} strokeWidth={5} />
            <circle cx={0} cy={151} r={9} fill={C.ink} />
            <circle cx={-3} cy={150} r={2.6} fill={C.cream} />
            <circle cx={4} cy={150} r={2.6} fill={C.cream} />
            {led && <circle cx={0} cy={156} r={34 + Math.sin(t / 3) * 4} fill="#59f0a6" opacity={0.22} />}
          </g>
        )}
      </g>
    </g>
  );
};

/** Small doodle paper plane, nose pointing right. */
export const Plane: React.FC<{ x: number; y: number; rotate?: number; scale?: number; color?: string }> = ({ x, y, rotate = 0, scale = 1, color = C.white }) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
    <g transform="translate(-60,-30)">
      <path d="M0 0 L120 30 L0 60 L28 30 Z" fill={color} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
      <path d="M28 30 L120 30 M28 30 L40 48" fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
    </g>
  </g>
);

/** Position + heading along a cubic path given as 4 points, for flying things. */
export function alongCubic(p: number, pts: [number, number][]) {
  const [a, b, c, d] = pts;
  const u = 1 - p;
  const x = u * u * u * a[0] + 3 * u * u * p * b[0] + 3 * u * p * p * c[0] + p * p * p * d[0];
  const y = u * u * u * a[1] + 3 * u * u * p * b[1] + 3 * u * p * p * c[1] + p * p * p * d[1];
  const dx = 3 * u * u * (b[0] - a[0]) + 6 * u * p * (c[0] - b[0]) + 3 * p * p * (d[0] - c[0]);
  const dy = 3 * u * u * (b[1] - a[1]) + 6 * u * p * (c[1] - b[1]) + 3 * p * p * (d[1] - c[1]);
  return { x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI };
}

export const useWobble = (speed = 20, amount = 4) => {
  const frame = useCurrentFrame();
  return Math.sin(frame / speed) * amount;
};

export const fade = (frame: number, a: number, b: number) =>
  interpolate(frame, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
