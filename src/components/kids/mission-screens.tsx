"use client";

import { motion } from "motion/react";
import type { Activity } from "@/lib/contracts";
import { CheckIcon, HomeIcon, StarShape, Squiggle } from "./icons";
import { OomiBuddy } from "./oomi-buddy";
import { StarBurst } from "./ui";

const STEP_COLORS = ["bg-sky-200", "bg-sun-200", "bg-mint-200", "bg-bubble-200", "bg-grape-200", "bg-coral-200"];
const STEP_TILT = [-2, 1.5, -1, 2, -1.5, 1];
const POP = { type: "spring", stiffness: 320, damping: 18 } as const;

type MissionProps = { mission: Activity; level: () => number; speaking: boolean; onReady: () => void };

/** The real-world challenge: every video ends by sending the child back to the real world. */
export function MissionScreen({ mission, level, speaking, onReady }: MissionProps) {
  return (
    <div className="bg-dots absolute inset-0 overflow-y-auto bg-sun-100">
      <div className="mx-auto flex min-h-full max-w-6xl flex-col items-center justify-center px-5 pt-24 pb-12 sm:px-10">
        <motion.div
          className="flex items-center gap-4"
          initial={{ scale: 0.4, opacity: 0, rotate: -8 }}
          animate={{ scale: 1, opacity: 1, rotate: -3 }}
          transition={POP}
        >
          <span className="sticker rounded-full bg-coral-400 px-5 py-2 font-display text-xl font-bold tracking-wide text-cream-50 uppercase sm:text-2xl">
            Your mission
          </span>
        </motion.div>
        <motion.h2
          className="mt-4 text-center font-display text-[clamp(2.2rem,6vw,4.4rem)] leading-[1.05] font-bold tracking-tight"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...POP, delay: 0.15 }}
        >
          {mission.title}
        </motion.h2>
        <Squiggle className="mt-2 h-4 w-40 text-coral-400" />

        <ol className="mt-8 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:flex lg:justify-center">
          {mission.steps.map((step, index) => (
            <motion.li
              key={step}
              className={`sticker relative flex items-center gap-4 rounded-[1.75rem] p-4 lg:w-56 lg:flex-col lg:items-start lg:p-5 ${STEP_COLORS[index % STEP_COLORS.length]}`}
              initial={{ y: 40, scale: 0.7, opacity: 0, rotate: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1, rotate: STEP_TILT[index % STEP_TILT.length] }}
              transition={{ ...POP, delay: 0.4 + index * 0.18 }}
            >
              <span className="sticker grid size-14 shrink-0 place-items-center rounded-2xl bg-cream-50 font-display text-3xl font-bold">
                {index + 1}
              </span>
              <p className="font-display text-xl leading-snug font-semibold sm:text-2xl">{step}</p>
            </motion.li>
          ))}
        </ol>

        <div className="mt-10 flex w-full flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3">
            <OomiBuddy face={speaking ? "speaking" : "happy"} level={level} className="size-20 sm:size-24" />
            <p className="max-w-xs text-sm font-semibold text-navy-600">
              <span className="font-bold text-navy-800">For grown-ups:</span> {mission.parentTip}
            </p>
          </div>
          <button
            type="button"
            onClick={onReady}
            className="btn-chunky flex items-center gap-3 rounded-full bg-mint-300 py-4 pr-8 pl-5 font-display text-2xl font-bold sm:text-3xl"
          >
            <span className="grid size-11 place-items-center rounded-full bg-cream-50 sm:size-12">
              <CheckIcon className="size-7" />
            </span>
            I&apos;m ready!
          </button>
        </div>
      </div>
    </div>
  );
}

type OutroProps = { name: string; level: () => number; speaking: boolean; onDone: () => void };

/** Oomi cheers the child on, then the only way forward is back home: nothing plays next. */
export function OutroScreen({ name, level, speaking, onDone }: OutroProps) {
  return (
    <div className="bg-dots absolute inset-0 grid place-items-center overflow-hidden bg-mint-200 px-6">
      <StarBurst />
      <div className="relative flex flex-col items-center text-center">
        <motion.div initial={{ scale: 0.3, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ ...POP, stiffness: 240 }}>
          <OomiBuddy face={speaking ? "speaking" : "happy"} level={level} className="size-40 sm:size-56" />
        </motion.div>
        <motion.h2
          className="mt-8 font-display text-[clamp(2.4rem,7vw,5rem)] leading-[1.02] font-bold tracking-tight"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...POP, delay: 0.3 }}
        >
          Now go try it
          <br />
          <span className="relative inline-block">
            for real, {name}!
            <StarShape className="absolute -top-6 -right-10 size-10 rotate-12 text-sun-300 sm:size-14" />
          </span>
        </motion.h2>
        <motion.button
          type="button"
          onClick={onDone}
          className="btn-chunky mt-10 flex items-center gap-3 rounded-full bg-sun-300 py-4 pr-10 pl-6 font-display text-3xl font-bold"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...POP, delay: 0.7 }}
        >
          <span className="grid size-12 place-items-center rounded-full bg-cream-50">
            <HomeIcon className="size-7" />
          </span>
          Done
        </motion.button>
      </div>
    </div>
  );
}
