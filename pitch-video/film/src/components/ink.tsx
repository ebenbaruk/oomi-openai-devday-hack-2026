import React, { useId } from "react";
import { AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, H, HAND, W } from "../theme";

const DRAW_EASE = Easing.bezier(0.5, 0.1, 0.3, 1);

/** 0→1 progress of an action starting at `at` and lasting `dur` frames. */
export function useProgress(at: number, dur: number, easing = DRAW_EASE) {
  const frame = useCurrentFrame();
  return interpolate(frame, [at, at + Math.max(1, dur)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });
}

/** Three turbulence filters swapped in steps: hand-drawn "boiling" lines. */
export const BoilDefs: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
    <defs>
      {[1, 7, 13].map((seed, i) => (
        <filter key={seed} id={`boil${i}`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={2} seed={seed} />
          <feDisplacementMap in="SourceGraphic" scale={5} />
        </filter>
      ))}
    </defs>
  </svg>
);

export function useBoilFilter() {
  const frame = useCurrentFrame();
  // 3 changes every 0.36 s at 30 fps ≈ one change every 4 frames.
  return `url(#boil${Math.floor(frame / 4) % 3})`;
}

export const Boil: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => {
  const filter = useBoilFilter();
  return <AbsoluteFill style={{ filter, ...style }}>{children}</AbsoluteFill>;
};

export const Paper: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundColor: C.paper,
      backgroundImage: `linear-gradient(90deg, transparent 165px, ${C.margin} 165px, ${C.margin} 169px, transparent 169px), repeating-linear-gradient(180deg, transparent 0 64px, ${C.line} 64px 66px)`,
      backgroundPosition: "0 0, 0 22px",
    }}
  />
);

/** Full-frame boiling SVG layer in 1920×1080 coordinates. */
export const Sheet: React.FC<{ children: React.ReactNode; boil?: boolean; style?: React.CSSProperties }> = ({
  children,
  boil = true,
  style,
}) => {
  const filter = useBoilFilter();
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      style={{ position: "absolute", inset: 0, overflow: "visible", filter: boil ? filter : undefined, ...style }}
    >
      {children}
    </svg>
  );
};

type InkProps = {
  d: string;
  at: number;
  dur?: number;
  color?: string;
  width?: number;
  dashed?: string;
  opacity?: number;
  /** Fade the stroke out (erase) starting at this frame. */
  outAt?: number;
};

/** A felt-pen stroke that draws itself. */
export const Ink: React.FC<InkProps> = ({ d, at, dur = 20, color = C.ink, width = 6, dashed, opacity = 1, outAt }) => {
  const p = useProgress(at, dur);
  const out = useProgress(outAt ?? 1e9, 8);
  const maskId = useId().replace(/[^a-zA-Z0-9]/g, "");
  if (p <= 0) return null;
  const common = {
    fill: "none",
    stroke: color,
    strokeWidth: width,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    opacity: opacity * (1 - out),
  };
  if (dashed) {
    return (
      <g>
        <mask id={maskId} maskUnits="userSpaceOnUse" x={-200} y={-200} width={W + 400} height={H + 400}>
          <path d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} stroke="#fff" strokeWidth={width * 6} fill="none" strokeLinecap="round" />
        </mask>
        <path d={d} {...common} strokeDasharray={dashed} mask={`url(#${maskId})`} />
      </g>
    );
  }
  return <path d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} {...common} />;
};

/** Colouring that lands after the outline, slightly off-register. */
export const Wash: React.FC<{ d: string; at: number; color: string; dx?: number; dy?: number; opacity?: number }> = ({
  d,
  at,
  color,
  dx = 7,
  dy = 5,
  opacity = 1,
}) => {
  const p = useProgress(at, 8, Easing.out(Easing.quad));
  if (p <= 0) return null;
  return <path d={d} fill={color} opacity={p * opacity} transform={`translate(${dx * (1 - p * 0.4)} ${dy})`} />;
};

/** Handwritten text that writes itself left to right. */
export const Hand: React.FC<{
  children: React.ReactNode;
  at: number;
  dur?: number;
  x: number;
  y: number;
  size?: number;
  width?: number;
  color?: string;
  align?: "left" | "center" | "right";
  rotate?: number;
  boil?: boolean;
  outAt?: number;
}> = ({ children, at, dur = 24, x, y, size = 64, width, color = C.ink, align = "left", rotate = 0, boil = true, outAt }) => {
  const filter = useBoilFilter();
  const p = useProgress(at, dur, Easing.linear);
  const out = useProgress(outAt ?? 1e9, 8);
  if (p <= 0) return null;
  const steps = 18;
  const reveal = Math.ceil(p * steps) / steps;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        fontFamily: HAND,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1.02,
        color,
        textAlign: align,
        transform: `rotate(${rotate}deg)`,
        // Caveat glyphs overhang their advance box, so the reveal mask reaches past both edges.
        clipPath: reveal >= 1 ? undefined : `inset(-30% calc(${(1 - reveal) * 100}% - 40px) -30% -40px)`,
        filter: boil ? filter : undefined,
        opacity: 1 - out,
        whiteSpace: width ? "normal" : "nowrap",
      }}
    >
      {children}
    </div>
  );
};

/** Springy "stuck on the page" entrance for HTML elements. */
export function usePop(at: number, damping = 11) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - at, fps, config: { damping, stiffness: 170, mass: 0.7 } });
}

export const PostIt: React.FC<{
  at: number;
  x: number;
  y: number;
  w?: number;
  rotate?: number;
  color?: string;
  children: React.ReactNode;
  outAt?: number;
}> = ({ at, x, y, w = 420, rotate = -4, color = C.postit, children, outAt }) => {
  const s = usePop(at);
  const out = useProgress(outAt ?? 1e9, 10);
  if (s <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        padding: "34px 34px 30px",
        background: color,
        transform: `rotate(${rotate}deg) scale(${s * (1 - out)})`,
        boxShadow: "10px 14px 0 rgba(29,35,64,.14)",
        fontFamily: HAND,
        fontWeight: 700,
        color: C.ink,
        fontSize: 52,
        lineHeight: 1.02,
      }}
    >
      <Tape style={{ top: -22, left: "34%" }} />
      {children}
    </div>
  );
};

export const Tape: React.FC<{ style?: React.CSSProperties; rotate?: number; w?: number; h?: number }> = ({ style, rotate = 3, w = 150, h = 44 }) => (
  <div
    style={{
      position: "absolute",
      width: w,
      height: h,
      background: "rgba(143,220,187,.72)",
      transform: `rotate(${rotate}deg)`,
      boxShadow: "0 1px 0 rgba(29,35,64,.06)",
      zIndex: 2,
      ...style,
    }}
  />
);

/** A real product capture taped into the notebook. */
export const TapedPhoto: React.FC<{
  src: string;
  at: number;
  x: number;
  y: number;
  w: number;
  h?: number;
  rotate?: number;
  border?: number;
  fit?: "cover" | "contain";
  objectPosition?: string;
  outAt?: number;
  caption?: string;
  radius?: number;
  bg?: string;
  /** Slow scroll inside the frame: [startPct, endPct] of objectPosition Y. */
  pan?: [number, number, number, number];
  /** For .mp4 sources: seconds skipped at the start of the recording. */
  videoFrom?: number;
  children?: React.ReactNode;
}> = ({ src, at, x, y, w, h, rotate = -2, border = 16, fit = "cover", objectPosition, outAt, caption, radius = 6, bg = "#fff", pan, videoFrom = 0, children }) => {
  const frame = useCurrentFrame();
  const s = usePop(at, 12);
  const out = useProgress(outAt ?? 1e9, 10);
  if (s <= 0.001) return null;
  const tapeScale = Math.min(1, w / 520);
  const panPos = pan
    ? `50% ${interpolate(frame, [pan[2], pan[3]], [pan[0], pan[1]], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) })}%`
    : objectPosition;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        padding: border,
        paddingBottom: caption ? border + 64 : border,
        background: bg,
        transform: `rotate(${rotate}deg) scale(${(0.6 + 0.4 * s) * (1 - out)})`,
        opacity: Math.min(1, s * 2) * (1 - out),
        boxShadow: "0 18px 40px rgba(29,35,64,.18), 0 3px 8px rgba(29,35,64,.12)",
        borderRadius: 4,
      }}
    >
      <Tape style={{ top: -20 * tapeScale, left: -30 * tapeScale }} rotate={-32} w={150 * tapeScale} h={44 * tapeScale} />
      <Tape style={{ top: -20 * tapeScale, right: -30 * tapeScale }} rotate={30} w={150 * tapeScale} h={44 * tapeScale} />
      {src.endsWith(".mp4") ? (
        <Sequence from={at} layout="none">
          <OffthreadVideo src={src} muted trimBefore={Math.round(videoFrom * 30)} style={{ display: "block", width: "100%", height: h, objectFit: fit, borderRadius: radius }} />
        </Sequence>
      ) : (
        <Img src={src} style={{ display: "block", width: "100%", height: h, objectFit: fit, objectPosition: panPos, borderRadius: radius }} />
      )}
      {caption && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 14, textAlign: "center", fontFamily: HAND, fontWeight: 700, fontSize: 46, color: C.ink }}>
          {caption}
        </div>
      )}
      {children}
    </div>
  );
};
