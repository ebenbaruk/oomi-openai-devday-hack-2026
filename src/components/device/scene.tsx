"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import type { Face } from "@/lib/contracts";

const INK = "#1b1f3b";

/** Peach studio backdrop with dotted paper, soft blobs and a few doodles. Turns dusky when Oomi sleeps. */
export function Backdrop({ night }: { night: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_35%_40%,#ffe9dc_0%,#ffd9c4_55%,#fcc8ae_100%)]" />
      <div className="bg-dots absolute inset-0" />
      <div className="absolute -top-40 -left-40 h-[34rem] w-[34rem] rounded-full bg-coral-200/60 blur-3xl" />
      <div className="absolute top-1/3 -right-32 h-[30rem] w-[30rem] rounded-full bg-mint-200/50 blur-3xl" />
      <div className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-sun-200/50 blur-3xl" />
      <svg className="absolute top-[14%] left-[3%] w-28 opacity-60" viewBox="0 0 120 40" fill="none">
        <path d="M4 20 Q 19 4 34 20 T 64 20 T 94 20 T 116 18" stroke="#f26a4b" strokeWidth={5} strokeLinecap="round" />
      </svg>
      <svg className="absolute right-[5%] bottom-[10%] w-24 opacity-50" viewBox="0 0 100 100" fill="none">
        <circle cx={50} cy={50} r={34} stroke="#5bb5f0" strokeWidth={5} strokeDasharray="2 12" strokeLinecap="round" />
      </svg>
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(120%_90%_at_40%_30%,#c3adf8_0%,#7f75b8_100%)] mix-blend-multiply"
        initial={false}
        animate={{ opacity: night ? 0.45 : 0 }}
        transition={{ duration: 1.6, ease: "easeInOut" }}
      />
    </div>
  );
}

// ---------- Stickers that react to Oomi's face ----------

type Glyph = "question" | "exclaim" | "z" | "sparkle" | "star" | "heart" | "note" | "bulb" | "moon" | "plane" | "planet" | "dots";

const GLYPH_BG: Record<Glyph, string> = {
  question: "bg-sky-200",
  exclaim: "bg-sun-300",
  z: "bg-grape-200",
  sparkle: "bg-sun-200",
  star: "bg-sun-300",
  heart: "bg-bubble-200",
  note: "bg-sky-200",
  bulb: "bg-sun-200",
  moon: "bg-grape-300",
  plane: "bg-white",
  planet: "bg-grape-200",
  dots: "bg-white",
};

function GlyphArt({ glyph }: { glyph: Glyph }): ReactNode {
  const text = (value: string) => (
    <text x={32} y={45} textAnchor="middle" fontFamily="var(--font-fredoka), sans-serif" fontWeight={700} fontSize={38} fill={INK}>
      {value}
    </text>
  );
  switch (glyph) {
    case "question":
      return text("?");
    case "exclaim":
      return text("!");
    case "z":
      return text("z");
    case "sparkle":
      return <path d="M32 8 C34 24 40 30 56 32 C40 34 34 40 32 56 C30 40 24 34 8 32 C24 30 30 24 32 8 Z" fill="#ffc53d" stroke={INK} strokeWidth={3} strokeLinejoin="round" />;
    case "star":
      return (
        <path
          d="M32 9 L38.5 23.5 L54 25 L42.2 35.5 L45.8 51 L32 43 L18.2 51 L21.8 35.5 L10 25 L25.5 23.5 Z"
          fill="#ffd866"
          stroke={INK}
          strokeWidth={3}
          strokeLinejoin="round"
        />
      );
    case "heart":
      return (
        <path
          d="M32 52 C14 40 10 30 12 23 C14 15 25 12 32 21 C39 12 50 15 52 23 C54 30 50 40 32 52 Z"
          fill="#ff7aa8"
          stroke={INK}
          strokeWidth={3}
          strokeLinejoin="round"
        />
      );
    case "note":
      return (
        <g stroke={INK} strokeWidth={3} strokeLinejoin="round">
          <path d="M26 44 V16 L48 11 V39" fill="none" strokeLinecap="round" />
          <ellipse cx={21} cy={45} rx={7} ry={5.5} fill="#5bb5f0" />
          <ellipse cx={43} cy={40} rx={7} ry={5.5} fill="#5bb5f0" />
        </g>
      );
    case "bulb":
      return (
        <g stroke={INK} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
          <path d="M32 10 C22 10 16 18 16 26 C16 33 21 36 24 41 H40 C43 36 48 33 48 26 C48 18 42 10 32 10 Z" fill="#ffd866" />
          <path d="M25 47 H39 M27 53 H37" fill="none" />
        </g>
      );
    case "moon":
      return <path d="M40 10 C26 12 18 24 20 36 C22 48 34 56 48 52 C36 50 28 40 30 28 C31 20 35 14 40 10 Z" fill="#fff4cc" stroke={INK} strokeWidth={3} strokeLinejoin="round" />;
    case "plane":
      return (
        <g stroke={INK} strokeWidth={3} strokeLinejoin="round">
          <path d="M8 30 L56 12 L42 52 L32 38 Z" fill="#ffffff" />
          <path d="M32 38 L56 12" fill="none" />
          <path d="M32 38 L30 50 L37 44" fill="#e3f3fe" />
        </g>
      );
    case "planet":
      return (
        <g stroke={INK} strokeWidth={3}>
          <circle cx={32} cy={32} r={13} fill="#a585ef" />
          <ellipse cx={32} cy={33} rx={24} ry={8} fill="none" transform="rotate(-18 32 33)" />
        </g>
      );
    case "dots":
      return (
        <g fill={INK}>
          <circle cx={20} cy={33} r={4.5} />
          <circle cx={32} cy={33} r={4.5} />
          <circle cx={44} cy={33} r={4.5} />
        </g>
      );
  }
}

/** Slots around the necklace (percent of the stage), chosen to avoid the pebble and the cord. */
const SLOTS = [
  { left: "2%", top: "16%", rotate: -12, size: 1 },
  { left: "-4%", top: "54%", rotate: 8, size: 0.8 },
  { left: "14%", top: "84%", rotate: -6, size: 0.7 },
  { left: "22%", top: "0%", rotate: 10, size: 0.75 },
  { left: "84%", top: "76%", rotate: 12, size: 0.95 },
  { left: "66%", top: "90%", rotate: -10, size: 0.65 },
] as const;

const FACE_GLYPHS: Record<Face, Glyph[]> = {
  sleep: ["moon", "z", "star", "z", "star", "z"],
  idle: ["plane", "star", "planet"],
  listening: ["question", "question", "question", "sparkle"],
  thinking: ["bulb", "dots", "question"],
  speaking: ["note", "sparkle", "note", "star"],
  happy: ["sparkle", "star", "heart", "sparkle", "star", "sparkle"],
  curious: ["exclaim", "question", "sparkle", "planet"],
  grown_up: ["heart", "heart", "star", "heart"],
};

export function FaceStickers({ face }: { face: Face }) {
  const glyphs = FACE_GLYPHS[face];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <AnimatePresence>
        {glyphs.map((glyph, index) => {
          const slot = SLOTS[index % SLOTS.length];
          return (
            <motion.div
              key={`${face}-${index}`}
              className="absolute"
              style={{ left: slot.left, top: slot.top, width: `calc(clamp(40px, 5.5vw, 68px) * ${slot.size})` }}
              initial={{ opacity: 0, scale: 0.3, rotate: slot.rotate - 30 }}
              animate={{ opacity: 1, scale: 1, rotate: slot.rotate }}
              exit={{ opacity: 0, scale: 0.4, transition: { duration: 0.18 } }}
              transition={{ type: "spring", stiffness: 420, damping: 16, delay: index * 0.06 }}
            >
              <motion.div
                className={`aspect-square rounded-[30%] border-[2.5px] border-navy-900 shadow-sticker-sm ${GLYPH_BG[glyph]}`}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3 + (index % 3), repeat: Infinity, ease: "easeInOut", delay: index * 0.3 }}
              >
                <svg viewBox="0 0 64 64" className="h-full w-full">
                  <GlyphArt glyph={glyph} />
                </svg>
              </motion.div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
