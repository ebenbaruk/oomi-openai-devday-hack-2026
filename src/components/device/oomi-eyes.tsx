"use client";

import { AnimatePresence, motion, useAnimationFrame, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useState } from "react";
import type { Face } from "@/lib/contracts";

// Pure SVG on a 200×200 round screen, so the same drawing can be ported to the necklace's display.

type OpenEye = { kind: "open"; rx: number; ry: number; px: number; py: number; pr: number };
type ArcEye = { kind: "arc"; dir: "up" | "down" };
type Eye = OpenEye | ArcEye;
type Look = { left: Eye; right: Eye; tilt: number; blush: boolean };

const open = (rx: number, ry: number, px = 0, py = 0, pr = 11): OpenEye => ({ kind: "open", rx, ry, px, py, pr });

const LOOKS: Record<Face, Look> = {
  idle: { left: open(25, 29), right: open(25, 29), tilt: 0, blush: false },
  listening: { left: open(30, 35, 0, 0, 13), right: open(30, 35, 0, 0, 13), tilt: 0, blush: false },
  thinking: { left: open(25, 27, 7, -12, 10), right: open(25, 27, 7, -12, 10), tilt: 0, blush: false },
  speaking: { left: open(26, 30, 0, 2), right: open(26, 30, 0, 2), tilt: 0, blush: true },
  happy: { left: { kind: "arc", dir: "up" }, right: { kind: "arc", dir: "up" }, tilt: 0, blush: true },
  curious: { left: open(31, 36, 4, -2, 13), right: open(21, 23, 6, -4, 9), tilt: -9, blush: false },
  grown_up: { left: open(24, 27, 2, 3, 10), right: { kind: "arc", dir: "up" }, tilt: 4, blush: true },
  sleep: { left: { kind: "arc", dir: "down" }, right: { kind: "arc", dir: "down" }, tilt: 0, blush: false },
};

const SPRING = { type: "spring", stiffness: 260, damping: 20 } as const;
const CREAM = "#fdf3e1";
const PUPIL = "#141a33";

function EyeShape({ eye, cx, wander, blinking }: { eye: Eye; cx: number; wander: { x: number; y: number }; blinking: boolean }) {
  return (
    <g transform={`translate(${cx} 100)`}>
      <AnimatePresence initial={false} mode="popLayout">
        {eye.kind === "open" ? (
          <motion.g
            key="open"
            initial={{ opacity: 0, scaleY: 0.2 }}
            animate={{ opacity: 1, scaleY: blinking ? 0.08 : 1 }}
            exit={{ opacity: 0, scaleY: 0.2 }}
            transition={{ duration: blinking ? 0.08 : 0.22 }}
          >
            <motion.ellipse cx={0} cy={0} fill={CREAM} animate={{ rx: eye.rx, ry: eye.ry }} transition={SPRING} />
            <motion.circle
              fill={PUPIL}
              animate={{ cx: eye.px + wander.x, cy: eye.py + wander.y, r: eye.pr }}
              transition={SPRING}
            />
            <motion.circle
              fill={CREAM}
              r={3.4}
              animate={{ cx: eye.px + wander.x + eye.pr * 0.38, cy: eye.py + wander.y - eye.pr * 0.42 }}
              transition={SPRING}
            />
          </motion.g>
        ) : (
          <motion.path
            key={`arc-${eye.dir}`}
            d={eye.dir === "up" ? "M -22 8 Q 0 -24 22 8" : "M -21 -4 Q 0 16 21 -4"}
            fill="none"
            stroke={CREAM}
            strokeWidth={11}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
          />
        )}
      </AnimatePresence>
    </g>
  );
}

function ThinkingDots() {
  return (
    <g transform="translate(100 152)">
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
          x={132 + index * 13}
          y={72 - index * 14}
          fontSize={12 + index * 5}
          animate={{ opacity: [0, 1, 0], y: [74 - index * 14, 60 - index * 14] }}
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
  const breathing = face === "listening" ? { scale: [1, 1.05, 1] } : { scale: 1 };

  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label={`Oomi looks ${face.replace("_", " ")}`}>
      <defs>
        <radialGradient id="screen-glow" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#26305c" />
          <stop offset="100%" stopColor="#0d1124" />
        </radialGradient>
      </defs>
      <circle cx={100} cy={100} r={100} fill="url(#screen-glow)" />
      <motion.g
        style={{ y: bounceY, scaleY: squash, originX: "100px", originY: "100px" }}
        animate={{ rotate: look.tilt, ...breathing }}
        transition={face === "listening" ? { duration: 1.2, repeat: Infinity } : SPRING}
      >
        <EyeShape eye={look.left} cx={66} wander={gaze} blinking={blinking && look.left.kind === "open"} />
        <EyeShape eye={look.right} cx={134} wander={gaze} blinking={blinking && look.right.kind === "open"} />
        <AnimatePresence>
          {look.blush && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 0.55 }} exit={{ opacity: 0 }}>
              <ellipse cx={46} cy={138} rx={13} ry={7} fill="#f08a67" />
              <ellipse cx={154} cy={138} rx={13} ry={7} fill="#f08a67" />
            </motion.g>
          )}
        </AnimatePresence>
      </motion.g>
      {face === "thinking" && <ThinkingDots />}
      {face === "sleep" && <Zzz />}
      {/* Glass reflection on the round display */}
      <path d="M 40 52 Q 70 22 112 20" stroke="white" strokeOpacity={0.09} strokeWidth={10} fill="none" strokeLinecap="round" />
    </svg>
  );
}
