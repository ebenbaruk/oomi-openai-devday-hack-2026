"use client";

import { AnimatePresence, motion, useAnimationFrame, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useId, useState } from "react";
import type { Face } from "@/lib/contracts";

// Pure SVG on a 200×200 round screen, so the same drawing can be ported to the necklace's display.
// Shapes follow the expression sheet in public/brand/oomi-expressions.png.

/** rx/ry: eye size, cy: vertical offset, px/py: pupil offset, pr: pupil radius, lid: share of the eye hidden by the top lid. */
type OpenEye = { kind: "open"; rx: number; ry: number; cy: number; px: number; py: number; pr: number; lid: number };
type CrescentEye = { kind: "crescent"; dir: "up" | "down" };
type Eye = OpenEye | CrescentEye;
type Look = { left: Eye; right: Eye; tilt: number; blush: boolean };

const open = (rx: number, ry: number, { cy = 0, px = 0, py = 0, pr = 12, lid = 0 } = {}): OpenEye => ({
  kind: "open",
  rx,
  ry,
  cy,
  px,
  py,
  pr,
  lid,
});
const crescent = (dir: "up" | "down"): CrescentEye => ({ kind: "crescent", dir });

const LOOKS: Record<Face, Look> = {
  idle: { left: open(24, 28, { px: 2, py: 2 }), right: open(24, 28, { px: 2, py: 2 }), tilt: 0, blush: false },
  listening: { left: open(28, 34, { pr: 13 }), right: open(28, 34, { pr: 13 }), tilt: 0, blush: false },
  thinking: {
    left: open(27, 28, { cy: 6, px: 6, py: -11, pr: 11, lid: 0.22 }),
    right: open(27, 28, { cy: 6, px: 6, py: -11, pr: 11, lid: 0.22 }),
    tilt: 0,
    blush: false,
  },
  speaking: {
    left: open(24, 26, { cy: 12, px: 1, py: 4, pr: 11 }),
    right: open(25, 27, { cy: -10, px: 1, py: -2, pr: 11 }),
    tilt: 0,
    blush: true,
  },
  happy: { left: crescent("up"), right: crescent("up"), tilt: 0, blush: true },
  curious: {
    left: open(31, 33, { px: 6, py: -2, pr: 13 }),
    right: open(22, 23, { cy: 4, px: 9, py: -4, pr: 10 }),
    tilt: -6,
    blush: false,
  },
  grown_up: { left: open(24, 28, { px: 2, py: 2, pr: 11 }), right: crescent("up"), tilt: 3, blush: true },
  sleep: { left: crescent("down"), right: crescent("down"), tilt: 0, blush: false },
};

const SPRING = { type: "spring", stiffness: 260, damping: 20 } as const;
const CREAM = "#fdf3e1";
const PUPIL = "#141a33";

// Filled crescents taper at both ends, like the arches on the expression sheet.
const CRESCENT_PATH = {
  up: "M -25 9 Q 0 -30 25 9 Q 25 13 20 11 Q 0 -10 -20 11 Q -25 13 -25 9 Z",
  down: "M -25 -6 Q 0 28 25 -6 Q 25 -10 20 -8 Q 0 10 -20 -8 Q -25 -10 -25 -6 Z",
};

function EyeShape({
  eye,
  cx,
  wander,
  blinking,
  clipId,
}: {
  eye: Eye;
  cx: number;
  wander: { x: number; y: number };
  blinking: boolean;
  clipId: string;
}) {
  return (
    <g transform={`translate(${cx} 100)`}>
      <AnimatePresence initial={false} mode="popLayout">
        {eye.kind === "open" ? (
          <motion.g
            key="open"
            initial={{ opacity: 0, scaleY: 0.2 }}
            animate={{ opacity: 1, scaleY: blinking ? 0.08 : 1, y: eye.cy }}
            exit={{ opacity: 0, scaleY: 0.2 }}
            transition={blinking ? { duration: 0.08 } : SPRING}
          >
            <clipPath id={clipId}>
              {/* The top lid slides down by hiding the upper part of the eye. */}
              <motion.rect
                x={-40}
                width={80}
                height={90}
                animate={{ y: -eye.ry + eye.lid * eye.ry * 2 }}
                transition={SPRING}
              />
            </clipPath>
            <g clipPath={`url(#${clipId})`}>
              <motion.ellipse cx={0} cy={0} fill={CREAM} animate={{ rx: eye.rx, ry: eye.ry }} transition={SPRING} />
              <motion.circle
                fill={PUPIL}
                animate={{ cx: eye.px + wander.x, cy: eye.py + wander.y, r: eye.pr }}
                transition={SPRING}
              />
              <motion.circle
                fill="#ffffff"
                r={3.2}
                animate={{ cx: eye.px + wander.x + eye.pr * 0.4, cy: eye.py + wander.y - eye.pr * 0.42 }}
                transition={SPRING}
              />
            </g>
            {eye.lid > 0 && (
              <motion.line
                x1={-eye.rx * 0.92}
                x2={eye.rx * 0.92}
                stroke="#2a3366"
                strokeWidth={3}
                strokeLinecap="round"
                animate={{ y1: -eye.ry + eye.lid * eye.ry * 2, y2: -eye.ry + eye.lid * eye.ry * 2 }}
                transition={SPRING}
              />
            )}
          </motion.g>
        ) : (
          <motion.path
            key={`crescent-${eye.dir}`}
            d={CRESCENT_PATH[eye.dir]}
            fill={CREAM}
            stroke={CREAM}
            strokeWidth={2}
            strokeLinejoin="round"
            initial={{ opacity: 0, scaleY: 0.3 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0.3 }}
            transition={SPRING}
          />
        )}
      </AnimatePresence>
    </g>
  );
}

function ThinkingDots() {
  return (
    <g transform="translate(100 156)">
      {[-16, 0, 16].map((x, index) => (
        <motion.circle
          key={x}
          cx={x}
          r={4.5}
          fill={CREAM}
          animate={{ cy: [0, -7, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: index * 0.15 }}
        />
      ))}
    </g>
  );
}

function Zzz() {
  return (
    <g fontFamily="var(--font-fredoka), sans-serif" fontWeight={600} fill={CREAM}>
      {[0, 1, 2].map((index) => (
        <motion.text
          key={index}
          x={130 + index * 13}
          y={70 - index * 14}
          fontSize={12 + index * 5}
          animate={{ opacity: [0, 1, 0], y: [72 - index * 14, 58 - index * 14] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: index * 0.6 }}
        >
          z
        </motion.text>
      ))}
    </g>
  );
}

export function OomiEyes({ face, level }: { face: Face; level?: () => number }) {
  const look = LOOKS[face];
  const uid = useId().replace(/:/g, "");
  const [wander, setWander] = useState({ x: 0, y: 0 });
  const [blinking, setBlinking] = useState(false);

  // Idle life: eyes wander around and blink from time to time.
  useEffect(() => {
    if (face !== "idle") return;
    const interval = setInterval(() => {
      setWander({ x: Math.round((Math.random() - 0.5) * 18), y: Math.round((Math.random() - 0.5) * 12) });
    }, 2200);
    return () => clearInterval(interval);
  }, [face]);

  useEffect(() => {
    if (face === "sleep" || face === "happy") return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        setBlinking(true);
        setTimeout(() => setBlinking(false), 130);
        schedule();
      }, 2500 + Math.random() * 3000);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [face]);

  // While speaking, the eyes bounce with the loudness of Oomi's voice.
  const loudness = useMotionValue(0);
  const smooth = useSpring(loudness, { stiffness: 400, damping: 18 });
  const bounceY = useTransform(smooth, (value) => -value * 12);
  const squash = useTransform(smooth, (value) => 1 + value * 0.12);
  useAnimationFrame(() => {
    loudness.set(face === "speaking" && level ? level() : 0);
  });

  const gaze = face === "idle" ? wander : { x: 0, y: 0 };
  const breathing = face === "listening" ? { scale: [1, 1.05, 1] } : face === "sleep" ? { scale: [1, 0.97, 1] } : { scale: 1 };
  const breathingLoop = face === "listening" ? { duration: 1.2, repeat: Infinity } : { duration: 3.6, repeat: Infinity };

  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label={`Oomi looks ${face.replace("_", " ")}`}>
      <defs>
        <radialGradient id={`${uid}-glow`} cx="50%" cy="38%" r="68%">
          <stop offset="0%" stopColor="#25305e" />
          <stop offset="70%" stopColor="#131938" />
          <stop offset="100%" stopColor="#0b0e22" />
        </radialGradient>
      </defs>
      <circle cx={100} cy={100} r={100} fill={`url(#${uid}-glow)`} />
      <motion.g
        style={{ y: bounceY, scaleY: squash, originX: "100px", originY: "100px" }}
        animate={{ rotate: look.tilt, ...breathing }}
        transition={face === "listening" || face === "sleep" ? breathingLoop : SPRING}
      >
        <EyeShape eye={look.left} cx={64} wander={gaze} blinking={blinking && look.left.kind === "open"} clipId={`${uid}-l`} />
        <EyeShape eye={look.right} cx={136} wander={gaze} blinking={blinking && look.right.kind === "open"} clipId={`${uid}-r`} />
        <AnimatePresence>
          {look.blush && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 0.45 }} exit={{ opacity: 0 }}>
              <ellipse cx={42} cy={140} rx={12} ry={6.5} fill="#f08a67" />
              <ellipse cx={158} cy={140} rx={12} ry={6.5} fill="#f08a67" />
            </motion.g>
          )}
        </AnimatePresence>
      </motion.g>
      {face === "thinking" && <ThinkingDots />}
      {face === "sleep" && <Zzz />}
      {/* Glass reflection on the round display */}
      <path d="M 40 52 Q 70 22 112 20" stroke="white" strokeOpacity={0.08} strokeWidth={10} fill="none" strokeLinecap="round" />
    </svg>
  );
}
