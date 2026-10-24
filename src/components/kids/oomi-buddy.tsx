"use client";

import { motion } from "motion/react";
import type { Face } from "@/lib/contracts";
import { OomiEyes } from "@/components/device/oomi-eyes";
import { MascotArt } from "@/components/mascot/mascot-art";
import { isClassicLook, useMascot } from "@/components/mascot/mascot-context";

type Props = {
  face: Face;
  level?: () => number;
  className?: string;
  /** Gentle floating idle motion. */
  float?: boolean;
};

/** Oomi as a little character: the family's own mascot, or the classic coral pebble with its round navy screen. */
export function OomiBuddy({ face, level, className = "size-24", float = true }: Props) {
  const mascot = useMascot();
  if (mascot && !isClassicLook(mascot.config)) {
    return (
      <motion.div
        className={`relative shrink-0 ${className}`}
        animate={float ? { y: [0, -6, 0], rotate: [-2, 2, -2] } : undefined}
        transition={float ? { duration: 4.5, repeat: Infinity, ease: "easeInOut" } : undefined}
      >
        <MascotArt config={mascot.config} face={face} level={level} bare className="size-full drop-shadow-[0_5px_0_var(--color-navy-900)]" label={mascot.config.name} />
      </motion.div>
    );
  }
  return (
    <motion.div
      className={`relative shrink-0 ${className}`}
      animate={float ? { y: [0, -6, 0], rotate: [-2, 2, -2] } : undefined}
      transition={float ? { duration: 4.5, repeat: Infinity, ease: "easeInOut" } : undefined}
    >
      <div
        className="absolute inset-0 border-[3px] border-navy-900 bg-gradient-to-br from-coral-300 via-coral-400 to-coral-500 shadow-[inset_-8px_-10px_16px_rgb(176_61_34/0.35),inset_6px_8px_12px_rgb(255_255_255/0.35),0_5px_0_0_var(--color-navy-900)]"
        style={{ borderRadius: "50% 50% 46% 46% / 54% 54% 46% 46%" }}
      />
      <div className="absolute inset-[16%] rounded-full bg-navy-950 p-[4%] shadow-[inset_0_4px_10px_rgb(0_0_0/0.55)]">
        <div className="h-full w-full overflow-hidden rounded-full">
          <OomiEyes face={face} level={level} />
        </div>
      </div>
    </motion.div>
  );
}
