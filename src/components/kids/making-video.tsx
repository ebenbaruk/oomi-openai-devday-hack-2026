"use client";

import { motion } from "motion/react";
import { OomiBuddy } from "./oomi-buddy";

const FRAMES = ["bg-sky-300", "bg-sun-300", "bg-mint-300", "bg-bubble-300", "bg-grape-300", "bg-coral-300"];
const SPARKS = ["✏️", "🎨", "✨", "🖍️", "⭐"];

/** Shown while the explainer is generated (~30 s): a film strip rolls and Oomi thinks hard. */
export function MakingVideo({ title, emoji }: { title: string; emoji: string }) {
  return (
    <div className="bg-dots absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-grape-100 px-6">
      <FilmStrip />

      <div className="relative">
        {SPARKS.map((spark, index) => {
          const angle = (index / SPARKS.length) * Math.PI * 2;
          return (
            <motion.span
              key={spark}
              className="absolute top-1/2 left-1/2 text-3xl sm:text-4xl"
              animate={{
                x: [Math.cos(angle) * 110 - 18, Math.cos(angle + 0.6) * 130 - 18],
                y: [Math.sin(angle) * 110 - 18, Math.sin(angle + 0.6) * 130 - 18],
                rotate: [-15, 15],
                scale: [0.85, 1.1],
              }}
              transition={{ duration: 1.6, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: index * 0.2 }}
              aria-hidden
            >
              {spark}
            </motion.span>
          );
        })}
        <OomiBuddy face="thinking" className="size-36 sm:size-44" />
      </div>

      <h2 className="relative mt-14 text-center font-display text-3xl font-bold tracking-tight sm:text-5xl">
        Oomi is making your video
        <LoadingDots />
      </h2>
      <p className="relative mt-3 flex items-center gap-2 font-display text-xl font-medium text-navy-600 sm:text-2xl">
        <span className="text-3xl">{emoji}</span> {title}
      </p>
      <FakeProgress />
    </div>
  );
}

function LoadingDots() {
  return (
    <span aria-hidden>
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="inline-block"
          animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: index * 0.15 }}
        >
          .
        </motion.span>
      ))}
    </span>
  );
}

function FilmStrip() {
  const frames = [...FRAMES, ...FRAMES];
  return (
    <div className="absolute inset-x-0 top-[8%] -rotate-3 opacity-80" aria-hidden>
      <motion.div
        className="flex w-max gap-3 border-y-[3px] border-navy-900 bg-navy-900 px-3 py-3"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
      >
        {[...frames, ...frames].map((color, index) => (
          <span key={index} className={`h-16 w-24 rounded-lg sm:h-20 sm:w-32 ${color}`} />
        ))}
      </motion.div>
    </div>
  );
}

/** Generation time is fairly stable, so a bar that eases towards 95% over ~40 s feels honest enough. */
function FakeProgress() {
  return (
    <div className="sticker relative mt-8 h-6 w-[min(80vw,26rem)] overflow-hidden rounded-full bg-cream-50">
      <motion.div
        className="h-full rounded-full bg-[repeating-linear-gradient(135deg,var(--color-mint-300)_0_14px,var(--color-mint-400)_14px_28px)]"
        initial={{ width: "4%" }}
        animate={{ width: "95%" }}
        transition={{ duration: 40, ease: [0.1, 0.6, 0.3, 1] }}
      />
    </div>
  );
}
