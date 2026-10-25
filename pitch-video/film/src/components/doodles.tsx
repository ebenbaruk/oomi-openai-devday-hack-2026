import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { C, H, W } from "../theme";
import { Ink, Sheet, useProgress, Wash } from "./ink";

/** Hand-drawn speech bubble outline whose ends overlap a little, like a real pen. */
export function bubblePath(x: number, y: number, w: number, h: number, tail: [number, number], tailSide: "left" | "right" = "left") {
  const b = y + h;
  const tb = tailSide === "left" ? x + w * 0.22 : x + w * 0.7;
  return [
    `M${x + 26} ${y + 2}`,
    `C${x + w * 0.4} ${y - 12} ${x + w * 0.78} ${y - 8} ${x + w - 12} ${y + 6}`,
    `C${x + w + 14} ${y + h * 0.3} ${x + w + 12} ${y + h * 0.78} ${x + w - 18} ${b}`,
    `L${tb + 44} ${b + 3} L${tail[0]} ${tail[1]} L${tb} ${b + 1}`,
    `C${x + w * 0.12} ${b + 6} ${x + 6} ${b - 2} ${x - 6} ${b - 18}`,
    `C${x - 16} ${y + h * 0.6} ${x - 10} ${y + h * 0.15} ${x + 40} ${y - 2}`,
  ].join(" ");
}

export const Bubble: React.FC<{ x: number; y: number; w: number; h: number; tail: [number, number]; at: number; side?: "left" | "right"; fill?: string; color?: string; outAt?: number }> = ({
  x,
  y,
  w,
  h,
  tail,
  at,
  side = "left",
  fill,
  color = C.ink,
  outAt,
}) => {
  const d = bubblePath(x, y, w, h, tail, side);
  const out = useProgress(outAt ?? 1e9, 8);
  return (
    <g opacity={1 - out}>
      {fill && <Wash d={d} at={at + 10} color={fill} />}
      <Ink d={d} at={at} dur={14} color={color} />
    </g>
  );
};

export const starPath = (cx: number, cy: number, r: number) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`);
  }
  return `M${pts.join(" L")} Z`;
};

export const Star: React.FC<{ x: number; y: number; r?: number; at: number; color?: string }> = ({ x, y, r = 30, at, color = C.sun }) => (
  <Ink d={starPath(x, y, r)} at={at} dur={10} color={color} width={5} />
);

export const Sun: React.FC<{ x: number; y: number; r?: number; at: number; outAt?: number }> = ({ x, y, r = 48, at, outAt }) => {
  const frame = useCurrentFrame();
  const spin = (frame - at) * 0.4;
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    return `M${x + Math.cos(a) * (r + 16)} ${y + Math.sin(a) * (r + 16)} L${x + Math.cos(a) * (r + 40)} ${y + Math.sin(a) * (r + 40)}`;
  }).join(" ");
  const circle = `M${x + r} ${y} C${x + r} ${y + r * 0.6} ${x + r * 0.5} ${y + r} ${x} ${y + r} C${x - r * 0.6} ${y + r} ${x - r} ${y + r * 0.5} ${x - r} ${y} C${x - r} ${y - r * 0.6} ${x - r * 0.5} ${y - r} ${x + 4} ${y - r - 2} C${x + r * 0.6} ${y - r} ${x + r + 6} ${y - r * 0.4} ${x + r + 2} ${y + 8}`;
  return (
    <g>
      <Wash d={circle} at={at + 10} color={C.sun} opacity={0.35} />
      <Ink d={circle} at={at} dur={14} color={C.sun} outAt={outAt} />
      <g transform={`rotate(${spin} ${x} ${y})`}>
        <Ink d={rays} at={at + 8} dur={12} color={C.sun} width={5} outAt={outAt} />
      </g>
    </g>
  );
};

/** A violent felt-pen scribble that crosses something out. */
export const ScribbleOut: React.FC<{ x: number; y: number; w: number; h: number; at: number; color?: string; dur?: number }> = ({ x, y, w, h, at, color = C.ink, dur = 14 }) => {
  const n = 7;
  const pts: string[] = [`M${x} ${y + h * 0.2}`];
  for (let i = 0; i < n; i++) {
    const yy = y + (h * (i + 0.5)) / n;
    pts.push(`L${i % 2 === 0 ? x + w : x} ${yy + (i % 3) * 6}`);
  }
  return <Ink d={pts.join(" ")} at={at} dur={dur} color={color} width={9} />;
};

export const Check: React.FC<{ x: number; y: number; s?: number; at: number; color?: string }> = ({ x, y, s = 1, at, color = "#2f9d6b" }) => (
  <Ink d={`M${x - 26 * s} ${y} L${x - 6 * s} ${y + 22 * s} L${x + 34 * s} ${y - 30 * s}`} at={at} dur={8} color={color} width={9} />
);

export const Cross: React.FC<{ x: number; y: number; s?: number; at: number; color?: string }> = ({ x, y, s = 1, at, color = C.red }) => (
  <Ink d={`M${x - 24 * s} ${y - 24 * s} L${x + 24 * s} ${y + 24 * s} M${x + 24 * s} ${y - 24 * s} L${x - 22 * s} ${y + 26 * s}`} at={at} dur={8} color={color} width={9} />
);

export const heartPath = (x: number, y: number, s = 1) =>
  `M${x} ${y + 26 * s} C${x - 46 * s} ${y - 6 * s} ${x - 30 * s} ${y - 40 * s} ${x} ${y - 18 * s} C${x + 30 * s} ${y - 42 * s} ${x + 48 * s} ${y - 6 * s} ${x + 2 * s} ${y + 28 * s}`;

/** Red dotted zoom circle + arrow: "look here". */
export const ZoomCircle: React.FC<{ cx: number; cy: number; rx: number; ry: number; at: number; color?: string; width?: number }> = ({ cx, cy, rx, ry, at, color = C.red, width = 5 }) => {
  const d = `M${cx + rx} ${cy} C${cx + rx} ${cy + ry * 0.6} ${cx + rx * 0.5} ${cy + ry} ${cx} ${cy + ry} C${cx - rx * 0.6} ${cy + ry} ${cx - rx} ${cy + ry * 0.5} ${cx - rx} ${cy} C${cx - rx} ${cy - ry * 0.6} ${cx - rx * 0.5} ${cy - ry} ${cx + 6} ${cy - ry - 4} C${cx + rx * 0.7} ${cy - ry} ${cx + rx + 12} ${cy - ry * 0.4} ${cx + rx + 6} ${cy + 14}`;
  return <Ink d={d} at={at} dur={14} color={color} width={width} dashed="2 16" />;
};

export const Arrow: React.FC<{ d: string; head: [number, number, number]; at: number; color?: string; dur?: number; dashed?: string; width?: number }> = ({
  d,
  head,
  at,
  color = C.red,
  dur = 14,
  dashed,
  width = 5,
}) => {
  const [hx, hy, angle] = head;
  const a = (angle * Math.PI) / 180;
  const l = 26;
  const p1 = [hx - Math.cos(a - 0.5) * l, hy - Math.sin(a - 0.5) * l];
  const p2 = [hx - Math.cos(a + 0.5) * l, hy - Math.sin(a + 0.5) * l];
  return (
    <g>
      <Ink d={d} at={at} dur={dur} color={color} width={width} dashed={dashed} />
      <Ink d={`M${p1[0]} ${p1[1]} L${hx} ${hy} L${p2[0]} ${p2[1]}`} at={at + dur - 2} dur={5} color={color} width={width} />
    </g>
  );
};

/** Page turn: the outgoing scene peels away to the left, revealing the next one underneath. */
export const PageTurn: React.FC<{ at: number; dur?: number; children: React.ReactNode }> = ({ at, dur = 22, children }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  if (p >= 1) return null;
  return (
    <AbsoluteFill style={{ perspective: 2600, pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          transformOrigin: "0% 50%",
          transform: `rotateY(${-p * 115}deg) skewY(${-p * 4}deg)`,
          filter: `brightness(${1 - p * 0.35})`,
          boxShadow: p > 0 ? `${-30 * p}px 0 60px rgba(29,35,64,${0.25 * p})` : undefined,
          backfaceVisibility: "hidden",
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** A thick marker scribble that fills the screen, then pulls away to reveal the next page. */
export const ScribbleWipe: React.FC<{ at: number; color?: string; dur?: number }> = ({ at, color = C.coral, dur = 26 }) => {
  const frame = useCurrentFrame();
  const half = dur / 2;
  const pIn = interpolate(frame, [at, at + half], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.quad) });
  const pOut = interpolate(frame, [at + half, at + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
  if (frame < at || frame > at + dur) return null;
  const rows = 6;
  const pts: string[] = [`M-200 -60`];
  for (let i = 0; i <= rows; i++) {
    const y = (H / rows) * i + (i % 2 ? 40 : -20);
    pts.push(`L${i % 2 === 0 ? W + 200 : -200} ${y + 90}`);
  }
  const d = pts.join(" ");
  return (
    <Sheet>
      <path
        d={d}
        pathLength={1}
        fill="none"
        stroke={color}
        strokeWidth={330}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="1 1"
        strokeDashoffset={pOut > 0 ? -pOut : 1 - pIn}
      />
    </Sheet>
  );
};

/** Blue doodle tablet with glow lines. */
export const Tablet: React.FC<{ x: number; y: number; at: number; s?: number }> = ({ x, y, at, s = 1 }) => {
  const frame = useCurrentFrame();
  const glow = 0.5 + Math.sin((frame - at) / 5) * 0.2;
  const body = `M${x} ${y} L${x + 230 * s} ${y - 6 * s} L${x + 236 * s} ${y + 160 * s} L${x + 4 * s} ${y + 166 * s} Z`;
  return (
    <g>
      <Wash d={body} at={at + 10} color={C.sky} opacity={0.85} dx={4} dy={3} />
      <Ink d={body} at={at} dur={12} />
      <g opacity={useProgress(at + 14, 6) * glow}>
        <Ink d={`M${x - 30 * s} ${y - 40 * s} l-40 -40 M${x + 115 * s} ${y - 40 * s} l0 -56 M${x + 260 * s} ${y - 40 * s} l40 -40`} at={at + 14} dur={8} color={C.sky} width={6} />
      </g>
    </g>
  );
};
