"use client";

import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Face } from "@/lib/contracts";
import { Pebble } from "./pebble";

type Beat = { face: Face; who?: "kid" | "oomi"; line?: string; ms: number };

// The hero plays the airplane adventure on a loop, so the product explains itself before anyone scrolls.
const SCRIPT: Beat[] = [
  { face: "idle", ms: 1600 },
  { face: "listening", who: "kid", line: "How do airplanes fly?", ms: 2200 },
  { face: "thinking", ms: 1200 },
  { face: "speaking", who: "oomi", line: "The wings push air down, and the air pushes the plane up!", ms: 3200 },
  { face: "curious", who: "oomi", line: "Want to test it? Fold two paper planes and see which flies farther!", ms: 3600 },
  { face: "happy", who: "kid", line: "Let's go!", ms: 2200 },
];

const HELLO: Beat = { face: "happy", who: "oomi", line: "Hi! I'm Oomi. Ask me anything!", ms: 0 };

// A fake voice envelope so the eyes bounce like they do when Oomi really talks.
function fakeLevel() {
  const t = performance.now();
  return Math.max(0, 0.45 * Math.sin(t / 95) * Math.sin(t / 41) + 0.2);
}

export function LiveOomi() {
  const [step, setStep] = useState(0);
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (hovered) return;
    const timer = setTimeout(() => setStep((current) => (current + 1) % SCRIPT.length), SCRIPT[step].ms);
    return () => clearTimeout(timer);
  }, [step, hovered]);

  // Eyes (and a hint of the whole pebble) follow the cursor around the page.
  const gazeX = useMotionValue(0);
  const gazeY = useMotionValue(0);
  const x = useSpring(gazeX, { stiffness: 140, damping: 16 });
  const y = useSpring(gazeY, { stiffness: 140, damping: 16 });
  const rotate = useTransform(x, (value) => value * 0.35);

  useEffect(() => {
    if (reduce) return;
    const onMove = (event: PointerEvent) => {
      const box = ref.current?.getBoundingClientRect();
      if (!box) return;
      const dx = event.clientX - (box.left + box.width / 2);
      const dy = event.clientY - (box.top + box.height * 0.4);
      const distance = Math.hypot(dx, dy) || 1;
      const pull = Math.min(1, distance / 420);
      gazeX.set((dx / distance) * pull * 11);
      gazeY.set((dy / distance) * pull * 8);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduce, gazeX, gazeY]);

  const beat = hovered ? HELLO : SCRIPT[step];
  const bubbleKey = hovered ? "hello" : `${step}`;

  return (
    <div className="relative mx-auto flex w-full max-w-[26rem] flex-col items-center">
      <div className="flex h-28 w-full items-end sm:h-32" aria-live="polite">
        <AnimatePresence mode="wait">
          {beat.line && (
            <motion.p
              key={bubbleKey}
              initial={{ opacity: 0, y: 12, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
              className={`sticker relative max-w-[17rem] rounded-[22px] px-4 py-3 font-display text-base leading-snug font-medium sm:text-lg ${
                beat.who === "kid"
                  ? "mr-auto origin-bottom-left rounded-bl-md bg-sky-200 text-navy-900"
                  : "ml-auto origin-bottom-right rounded-br-md bg-white text-navy-900"
              }`}
            >
              <span className="mb-0.5 block text-xs font-semibold tracking-wide text-navy-500 uppercase">
                {beat.who === "kid" ? "Maya, 7" : "Oomi"}
              </span>
              {beat.line}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* The float lives on a wrapper: a CSS animation would override the motion transform. */}
      <div className="mt-4 w-[min(64vw,17rem)] animate-float sm:w-[18rem]">
        <motion.div
          ref={ref}
          style={{ rotate }}
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
          onTap={() => setStep(1)}
          className="cursor-pointer"
        >
          <Pebble
            face={beat.face}
            level={beat.face === "speaking" ? fakeLevel : undefined}
            micOn={beat.face === "listening"}
            pressed={beat.face === "listening"}
            gazeX={x}
            gazeY={y}
          />
        </motion.div>
      </div>
      <div aria-hidden className="mt-3 h-4 w-40 rounded-[50%] bg-coral-700/15 blur-md" />
    </div>
  );
}
