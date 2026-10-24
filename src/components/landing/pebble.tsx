"use client";

import { motion, type MotionValue } from "motion/react";
import { OomiEyes } from "@/components/device/oomi-eyes";
import type { Face } from "@/lib/contracts";

type Props = {
  face: Face;
  className?: string;
  level?: () => number;
  micOn?: boolean;
  pressed?: boolean;
  gazeX?: MotionValue<number>;
  gazeY?: MotionValue<number>;
};

/** Oomi drawn like the product render: coral pebble, round navy screen, mint button, mic LED. */
export function Pebble({ face, className = "", level, micOn = false, pressed = false, gazeX, gazeY }: Props) {
  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      {/* Bail: drawn in SVG so it scales with the pebble at any size. */}
      <svg viewBox="0 0 40 30" className="z-0 -mb-[7%] w-[22%]" aria-hidden>
        <path d="M7 30 V19 a13 13 0 0 1 26 0 V30" fill="none" stroke="var(--color-coral-400)" strokeWidth="8" />
      </svg>
      <div
        className="relative z-10 flex aspect-[5/6.2] w-full flex-col items-center bg-gradient-to-br from-coral-300 via-coral-400 to-coral-500 pt-[12%] shadow-pebble"
        style={{ borderRadius: "50% 50% 47% 47% / 56% 56% 44% 44%" }}
      >
        <div className="aspect-square w-[60%] rounded-full bg-navy-950 p-[3.5%] shadow-[inset_0_6px_14px_rgb(0_0_0/0.55),0_2px_0_rgb(255_255_255/0.35)]">
          <div className="h-full w-full overflow-hidden rounded-full bg-[#0d1124]">
            <motion.div className="h-full w-full" style={{ x: gazeX, y: gazeY }}>
              <OomiEyes face={face} level={level} />
            </motion.div>
          </div>
        </div>
        <div className="mt-[9%] flex w-[60%] items-center justify-between">
          <span className="w-[8%]" />
          <span className="relative aspect-square w-[46%]">
            <span className="absolute inset-0 translate-y-[6%] rounded-full bg-mint-500" />
            <span
              className={`absolute inset-0 rounded-full bg-gradient-to-br from-mint-200 via-mint-300 to-mint-400 shadow-[inset_0_-6px_10px_rgb(47_122_95/0.35),inset_0_6px_8px_rgb(255_255_255/0.6)] transition-transform duration-150 ${pressed ? "translate-y-[5%] scale-[0.97]" : "-translate-y-[2%]"}`}
            />
          </span>
          <span
            className={`aspect-square w-[8%] rounded-full transition-all duration-200 ${micOn ? "bg-[#6dff9e] shadow-[0_0_12px_4px_rgb(109_255_158/0.75)]" : "bg-coral-600/60 shadow-[inset_0_1px_2px_rgb(0_0_0/0.3)]"}`}
          />
        </div>
        <span className="mt-auto mb-[8%] font-display text-[clamp(0.8rem,1.6vw,1.15rem)] font-medium tracking-wide text-coral-600/80 [text-shadow:0_1px_0_rgb(255_255_255/0.35)]">
          oomi
        </span>
      </div>
    </div>
  );
}
