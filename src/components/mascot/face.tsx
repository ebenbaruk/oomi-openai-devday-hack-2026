"use client";

import { motion, type MotionValue } from "motion/react";
import type { MascotConfig } from "@/lib/contracts";
import type { Anchors } from "./species";

/** How each eye looks right now: its own style, a happy arch, or closed. */
export type EyeState = "open" | "happy" | "closed";

export type FacePose = {
  left: EyeState;
  right: EyeState;
  leftScale: number;
  rightScale: number;
  gaze: { x: number; y: number };
  blinking: boolean;
  /** Forces a smile (happy faces) whatever mouth was picked. */
  smile: boolean;
  /** 0–1 mouth opening while speaking, or null when not speaking. */
  talk: MotionValue<number> | null;
  blush: boolean;
};

export const RESTING_POSE: FacePose = {
  left: "open",
  right: "open",
  leftScale: 1,
  rightScale: 1,
  gaze: { x: 0, y: 0 },
  blinking: false,
  smile: false,
  talk: null,
  blush: false,
};

const SPRING = { type: "spring", stiffness: 320, damping: 22 } as const;

type Look = Pick<MascotConfig, "eyes" | "mouth" | "cheeks">;

function OpenEye({ style, r, ink, light }: { style: MascotConfig["eyes"]; r: number; ink: string; light: string }) {
  switch (style) {
    case "round":
      return <circle r={r} fill={ink} />;
    case "dots":
      return <circle r={r * 0.6} fill={ink} />;
    case "ovals":
      return <ellipse rx={r * 0.72} ry={r * 1.15} fill={ink} />;
    case "sleepy":
      return <path d={`M${-r} ${-r * 0.1} A${r} ${r} 0 0 0 ${r} ${-r * 0.1} Z`} fill={ink} transform={`translate(0 ${r * 0.2})`} />;
    case "sparkle":
      return (
        <>
          <circle r={r * 1.1} fill={ink} />
          <circle cx={r * 0.38} cy={-r * 0.4} r={r * 0.36} fill={light} />
          <circle cx={-r * 0.36} cy={r * 0.42} r={r * 0.16} fill={light} />
        </>
      );
  }
}

function Eye({
  state,
  style,
  cx,
  cy,
  r,
  scale,
  blinking,
  ink,
  light,
}: {
  state: EyeState;
  style: MascotConfig["eyes"];
  cx: number;
  cy: number;
  r: number;
  scale: number;
  blinking: boolean;
  ink: string;
  light: string;
}) {
  const arch = state === "happy" ? `M${-r} ${r * 0.25} Q0 ${-r * 1.35} ${r} ${r * 0.25}` : `M${-r} ${-r * 0.2} Q0 ${r * 1.1} ${r} ${-r * 0.2}`;
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <motion.g initial={false} animate={{ scale, scaleY: blinking ? 0.1 : 1 }} transition={blinking ? { duration: 0.07 } : SPRING}>
        {state === "open" ? (
          <OpenEye style={style} r={r} ink={ink} light={light} />
        ) : (
          <path d={arch} fill="none" stroke={ink} strokeWidth={r * 0.62} strokeLinecap="round" />
        )}
      </motion.g>
    </g>
  );
}

function Mouth({ look, pose, x, y, r, ink }: { look: Look; pose: FacePose; x: number; y: number; r: number; ink: string }) {
  const s = r / 12;
  if (pose.talk) {
    return (
      <g transform={`translate(${x} ${y + 2 * s})`}>
        <motion.ellipse rx={7 * s} ry={6 * s} fill={ink} style={{ scaleY: pose.talk }} />
      </g>
    );
  }
  const mouth = pose.smile && look.mouth !== "open" ? "smile" : look.mouth;
  const stroke = { fill: "none", stroke: ink, strokeWidth: 4.5 * s, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {mouth === "smile" && <path d="M-7 -1 Q0 7 7 -1" {...stroke} />}
      {mouth === "cat" && <path d="M-9 -2 Q-4.5 6 0 -0.5 Q4.5 6 9 -2" {...stroke} />}
      {mouth === "open" && <path d="M-7.5 -2.5 Q0 -3.5 7.5 -2.5 Q7 9 0 9 Q-7 9 -7.5 -2.5 Z" fill={ink} stroke={ink} strokeWidth={1.5} strokeLinejoin="round" />}
    </g>
  );
}

/** Two simple eyes, an optional tiny mouth and soft cheeks: the whole face, ip-as-logo style. */
export function MascotFace({
  look,
  anchors,
  pose,
  ink,
  light,
  blush,
}: {
  look: Look;
  anchors: Anchors;
  pose: FacePose;
  ink: string;
  light: string;
  blush: string;
}) {
  const { face } = anchors;
  const gx = pose.gaze.x;
  const gy = pose.gaze.y;
  const showCheeks = look.cheeks || pose.blush;
  return (
    <g>
      {showCheeks && (
        <g fill={blush} opacity={face.surface === "screen" ? 0.55 : 0.75}>
          <ellipse cx={face.x - face.cheekDx} cy={face.cheekY} rx={face.eyeR * 0.95} ry={face.eyeR * 0.55} />
          <ellipse cx={face.x + face.cheekDx} cy={face.cheekY} rx={face.eyeR * 0.95} ry={face.eyeR * 0.55} />
        </g>
      )}
      <Eye
        state={pose.left}
        style={look.eyes}
        cx={face.x - face.eyeDx + gx}
        cy={face.eyeY + gy}
        r={face.eyeR}
        scale={pose.leftScale}
        blinking={pose.blinking && pose.left === "open"}
        ink={ink}
        light={light}
      />
      <Eye
        state={pose.right}
        style={look.eyes}
        cx={face.x + face.eyeDx + gx}
        cy={face.eyeY + gy}
        r={face.eyeR}
        scale={pose.rightScale}
        blinking={pose.blinking && pose.right === "open"}
        ink={ink}
        light={light}
      />
      <Mouth look={look} pose={pose} x={face.x + gx * 0.5} y={face.mouthY + gy * 0.5} r={face.eyeR} ink={ink} />
    </g>
  );
}
