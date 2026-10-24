"use client";

import { motion } from "motion/react";
import type { Face } from "@/lib/contracts";
import { OomiEyes } from "./oomi-eyes";

type Props = {
  face: Face;
  micOpen: boolean;
  pressed: boolean;
  micEnabled: boolean;
  level?: () => number;
  onPress: () => void;
  onRelease: () => void;
  onToggleMic: () => void;
};

/** The necklace, drawn like the concept render: coral pebble, round navy screen, big mint button. */
export function Necklace({ face, micOpen, pressed, micEnabled, level, onPress, onRelease, onToggleMic }: Props) {
  return (
    <div className="relative flex flex-col items-center select-none">
      {/* Breakaway cord */}
      <svg viewBox="0 0 320 170" className="pointer-events-none -mb-10 w-[min(78vw,300px)]" aria-hidden>
        <defs>
          <pattern id="rope" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <rect width="14" height="14" fill="#f7c9b5" />
            <rect width="7" height="14" fill="#f3a78b" />
            <rect y="0" width="3" height="14" fill="#a9dcc6" />
          </pattern>
        </defs>
        <path d="M 40 0 C 30 90, 120 150, 160 160 C 200 150, 290 90, 280 0" stroke="url(#rope)" strokeWidth="13" fill="none" strokeLinecap="round" />
        <rect x="262" y="40" width="30" height="40" rx="12" fill="#9fd8c0" transform="rotate(-12 277 60)" />
        <line x1="264" y1="60" x2="292" y2="56" stroke="#7cc6a8" strokeWidth="2" />
      </svg>

      <motion.div
        className="relative flex w-[min(78vw,300px)] flex-col items-center"
        animate={face === "listening" ? { rotate: 0, y: 0 } : { rotate: [-1.2, 1.2, -1.2], y: [0, -6, 0] }}
        transition={face === "listening" ? { duration: 0.2 } : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Bail */}
        <div className="z-0 -mb-6 h-14 w-16 rounded-t-[28px] border-[11px] border-b-0 border-coral-400 shadow-[inset_0_4px_0_rgb(255_255_255/0.25)]" />

        {/* Shell */}
        <div
          className="relative z-10 flex aspect-[5/6.2] w-full flex-col items-center bg-gradient-to-br from-coral-300 via-coral-400 to-coral-500 pt-[12%] shadow-pebble"
          style={{ borderRadius: "50% 50% 47% 47% / 56% 56% 44% 44%" }}
        >
          {/* Screen bezel */}
          <div className="aspect-square w-[60%] rounded-full bg-navy-950 p-[3.5%] shadow-[inset_0_6px_14px_rgb(0_0_0/0.55),0_2px_0_rgb(255_255_255/0.35)]">
            <div className="h-full w-full overflow-hidden rounded-full">
              <OomiEyes face={face} level={level} />
            </div>
          </div>

          <div className="mt-[9%] flex w-[60%] items-center justify-between">
            <span className="w-4" />
            {/* Push-to-talk button */}
            <button
              type="button"
              aria-label="Hold to talk to Oomi"
              aria-pressed={pressed}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                onPress();
              }}
              onPointerUp={onRelease}
              onPointerCancel={onRelease}
              onContextMenu={(event) => event.preventDefault()}
              className="relative aspect-square w-[46%] touch-none rounded-full outline-offset-4"
            >
              <span
                className={`absolute inset-0 rounded-full bg-mint-500 transition-transform duration-100 ${pressed ? "translate-y-0" : "translate-y-[6%]"}`}
              />
              <span
                className={`absolute inset-0 rounded-full bg-gradient-to-br from-mint-200 via-mint-300 to-mint-400 shadow-[inset_0_-6px_10px_rgb(47_122_95/0.35),inset_0_6px_8px_rgb(255_255_255/0.6)] transition-transform duration-100 ${pressed ? "translate-y-[5%] scale-[0.97]" : "-translate-y-[2%]"}`}
              />
            </button>
            {/* Mic LED: on only while Oomi is listening */}
            <span
              aria-label={micOpen ? "Microphone on" : "Microphone off"}
              className={`h-3 w-3 rounded-full transition-all duration-150 ${micOpen ? "bg-[#6dff9e] shadow-[0_0_12px_4px_rgb(109_255_158/0.75)]" : "bg-coral-600/60 shadow-[inset_0_1px_2px_rgb(0_0_0/0.3)]"}`}
            />
          </div>

          <span className="mt-auto mb-[9%] font-display text-lg font-medium tracking-wide text-coral-600/80 [text-shadow:0_1px_0_rgb(255_255_255/0.35)]">
            oomi
          </span>

          {/* Physical mic kill switch on the side */}
          <button
            type="button"
            onClick={onToggleMic}
            aria-label={micEnabled ? "Turn microphone off" : "Turn microphone on"}
            className="absolute top-[46%] -right-3 flex h-14 w-5 items-start justify-center rounded-full bg-coral-500 p-1 shadow-[inset_-2px_0_4px_rgb(0_0_0/0.2)]"
          >
            <span className={`h-5 w-3 rounded-full transition-transform ${micEnabled ? "bg-mint-300" : "translate-y-6 bg-navy-800"}`} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
