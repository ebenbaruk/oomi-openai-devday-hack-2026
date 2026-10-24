"use client";

import { motion, useAnimate, type AnimationPlaybackControls } from "motion/react";
import { useEffect, useRef } from "react";
import type { ExplainerScene } from "@/lib/contracts";
import { SWATCHES } from "./palette";
import { KidImage } from "./ui";

type Props = { scene: ExplainerScene; fallbackEmoji: string; paused: boolean };

const POP = { type: "spring", stiffness: 380, damping: 16 } as const;

/** One beat of the explainer: picture in a sticker frame, kinetic caption, floating emoji stickers. */
export function SceneStage({ scene, fallbackEmoji, paused }: Props) {
  const swatch = SWATCHES[scene.color];
  return (
    <div className={`absolute inset-0 overflow-hidden ${swatch.bg}`}>
      <Backdrop fill={swatch.fill} />
      <div className="bg-dots absolute inset-0" aria-hidden />

      <div className="relative mx-auto flex h-full max-w-6xl flex-col items-center justify-center gap-6 px-6 pt-20 pb-36 landscape:flex-row landscape:gap-12 landscape:px-12 landscape:pt-16 landscape:pb-32">
        <motion.div
          className="relative w-full max-w-md shrink landscape:w-[46%] landscape:max-w-none"
          initial={{ scale: 0.6, rotate: -10, opacity: 0 }}
          animate={{ scale: 1, rotate: -2.5, opacity: 1 }}
          transition={{ ...POP, delay: 0.25 }}
        >
          <KenBurnsFrame src={scene.imageUrl} emoji={scene.emojis[0] ?? fallbackEmoji} paused={paused} softBg={swatch.soft} />
          <EmojiStickers emojis={scene.emojis} />
        </motion.div>

        <KineticCaption text={scene.caption} accent={swatch.strong} />
      </div>
    </div>
  );
}

/** Slow pan and zoom, paused together with the narration. */
function KenBurnsFrame({ src, emoji, paused, softBg }: { src: string | null; emoji: string; paused: boolean; softBg: string }) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const controls = useRef<AnimationPlaybackControls | null>(null);

  useEffect(() => {
    controls.current = animate(
      scope.current,
      { scale: [1.04, 1.18], x: ["0%", "-3%"], y: ["0%", "2%"] },
      { duration: 14, ease: "linear" },
    );
    return () => controls.current?.stop();
  }, [animate, scope]);

  useEffect(() => {
    if (paused) controls.current?.pause();
    else controls.current?.play();
  }, [paused]);

  return (
    <div className="sticker-lg aspect-[4/3] overflow-hidden rounded-[2rem] bg-cream-50 p-2.5 sm:rounded-[2.5rem] sm:p-3.5">
      <div className="size-full overflow-hidden rounded-[1.4rem] border-[2.5px] border-navy-900 sm:rounded-[1.8rem]">
        <div ref={scope} className="size-full will-change-transform">
          <KidImage src={src} className={`size-full ${softBg}`} fallback={<span className="text-8xl sm:text-9xl">{emoji}</span>} />
        </div>
      </div>
    </div>
  );
}

const STICKER_SPOTS = [
  { className: "-top-7 -right-6", rotate: 12 },
  { className: "-bottom-8 -left-6", rotate: -14 },
  { className: "-top-8 -left-8", rotate: -8 },
  { className: "-right-8 -bottom-6", rotate: 16 },
];

function EmojiStickers({ emojis }: { emojis: string[] }) {
  return (
    <>
      {emojis.slice(0, STICKER_SPOTS.length).map((emoji, index) => {
        const spot = STICKER_SPOTS[index];
        return (
          <motion.span
            key={`${emoji}-${index}`}
            className={`absolute ${spot.className}`}
            initial={{ scale: 0, rotate: spot.rotate - 40 }}
            animate={{ scale: 1, rotate: spot.rotate }}
            transition={{ ...POP, delay: 0.6 + index * 0.35 }}
          >
            <motion.span
              className="sticker grid size-16 place-items-center rounded-full bg-cream-50 text-4xl sm:size-24 sm:text-6xl"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2.4 + index * 0.4, repeat: Infinity, ease: "easeInOut", delay: index * 0.3 }}
            >
              {emoji}
            </motion.span>
          </motion.span>
        );
      })}
    </>
  );
}

/** Word-by-word pop, like a motion-design title card. The last word gets a marker highlight. */
function KineticCaption({ text, accent }: { text: string; accent: string }) {
  const words = text.trim().split(/\s+/);
  return (
    <h2
      className="w-full text-center font-display text-[clamp(2.4rem,7vw,3.4rem)] leading-[1.08] font-bold tracking-tight text-navy-900 landscape:flex-1 landscape:text-left landscape:text-[clamp(2.6rem,5.4vw,5rem)]"
      aria-label={text}
    >
      {words.map((word, index) => {
        const last = index === words.length - 1;
        return (
          <motion.span
            key={`${word}-${index}`}
            aria-hidden
            className="relative isolate mr-[0.25em] inline-block"
            initial={{ y: 50, scale: 0.3, rotate: index % 2 ? 10 : -10, opacity: 0 }}
            animate={{ y: 0, scale: 1, rotate: 0, opacity: 1 }}
            transition={{ ...POP, delay: 0.45 + index * 0.14 }}
          >
            {last && (
              <motion.span
                className={`absolute inset-x-[-0.12em] bottom-[0.06em] -z-10 h-[0.42em] origin-left -rotate-1 rounded-full ${accent}`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: 0.75 + index * 0.14 }}
              />
            )}
            {word}
          </motion.span>
        );
      })}
    </h2>
  );
}

/** Big soft blobs drifting behind the scene. */
function Backdrop({ fill }: { fill: string }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <motion.svg
        viewBox="0 0 200 200"
        className={`absolute -top-[30%] -left-[15%] w-[70vmax] opacity-70 ${fill}`}
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        <path d="M44 -2c32-12 78 2 104 26s48 68 30 104-62 68-104 58S4 140 0 98 12 10 44-2Z" />
      </motion.svg>
      <motion.svg
        viewBox="0 0 200 200"
        className={`absolute -right-[18%] -bottom-[35%] w-[60vmax] opacity-60 ${fill}`}
        animate={{ rotate: -360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
      >
        <path d="M60 10c40-20 100 0 124 40s10 96-30 120-104 30-136-6S-8 92 10 60 20 30 60 10Z" />
      </motion.svg>
    </div>
  );
}
