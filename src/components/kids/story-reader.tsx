"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { StoryCard } from "@/lib/contracts";
import { ArrowIcon, MoonShape, PauseIcon, PlayIcon } from "./icons";
import { OomiBuddy } from "./oomi-buddy";
import { CloseButton, KidImage, RoundButton, Twinkles } from "./ui";
import { readingTimeMs, useVoice } from "./use-voice";

type Props = { story: StoryCard; childName: string; onClose: () => void };
type Phase = "cover" | "reading" | "goodnight";

/** The first play of a story streams fresh TTS, which can take a while to start. */
const FIRST_PLAY_STALL_MS = 25_000;
const TURN = { duration: 0.75, ease: [0.45, 0, 0.25, 1] } as const;

// Pages flip around their left edge like a picture book: forward lifts the old page away,
// backward lays the previous page back down on top.
const FLIP = {
  enter: (direction: number) => (direction > 0 ? { rotateY: 0, zIndex: 1 } : { rotateY: -110, zIndex: 2 }),
  center: (direction: number) => ({ rotateY: 0, zIndex: direction > 0 ? 1 : 2, transition: TURN }),
  exit: (direction: number) =>
    direction > 0 ? { rotateY: -110, zIndex: 2, transition: TURN } : { zIndex: 1, filter: "brightness(0.85)", transition: TURN },
};

/** Where each page starts in the narration, by share of text: the single audio track has no page marks. */
function pageStarts(story: StoryCard): number[] {
  const lengths = story.pages.map((page) => page.text.length);
  const total = lengths.reduce((sum, length) => sum + length, 0) || 1;
  let acc = 0;
  return lengths.map((length) => {
    const start = acc / total;
    acc += length;
    return start;
  });
}

function pageAt(starts: number[], progress: number): number {
  return Math.max(0, starts.findLastIndex((start) => progress >= start));
}

export function StoryReader({ story, childName, onClose }: Props) {
  const voice = useVoice();
  const [phase, setPhase] = useState<Phase>("cover");
  const [turn, setTurn] = useState({ page: 0, direction: 1 });
  const [paused, setPaused] = useState(false);
  const starts = useMemo(() => pageStarts(story), [story]);
  const lastAutoPage = useRef(0);
  const pageCount = story.pages.length;

  useEffect(() => {
    if (phase !== "reading") return;
    const fallbackMs = story.pages.reduce((sum, page) => sum + readingTimeMs(page.text), 0);
    voice.play(story.audioUrl || null, fallbackMs, () => setPhase("goodnight"), FIRST_PLAY_STALL_MS);
  }, [phase, story, voice]);

  // Turn the page by itself when the narration crosses into the next page's share of the track.
  useEffect(() => {
    if (phase !== "reading") return;
    const interval = setInterval(() => {
      const target = pageAt(starts, voice.progress());
      if (target > lastAutoPage.current) {
        lastAutoPage.current = target;
        setTurn({ page: target, direction: 1 });
      }
    }, 300);
    return () => clearInterval(interval);
  }, [phase, starts, voice]);

  const goTo = useCallback(
    (page: number) => {
      if (page >= pageCount) {
        voice.stop();
        setPhase("goodnight");
        return;
      }
      const next = Math.max(0, page);
      setTurn((current) => ({ page: next, direction: next >= current.page ? 1 : -1 }));
      // Keep the voice in step with the page when the track can be seeked; otherwise only
      // auto-turn again once the narration reaches a page the child hasn't seen yet.
      const audio = voice.element();
      if (audio && Number.isFinite(audio.duration) && audio.duration > 0) {
        audio.currentTime = starts[next] * audio.duration;
        lastAutoPage.current = next;
      } else {
        lastAutoPage.current = Math.max(next, pageAt(starts, voice.progress()));
      }
    },
    [pageCount, starts, voice],
  );

  const start = () => {
    voice.unlock();
    setPhase("reading");
  };

  const togglePause = () => {
    if (paused) voice.resume();
    else voice.pause();
    setPaused(!paused);
  };

  const close = () => {
    voice.stop();
    onClose();
  };

  const page = story.pages[turn.page];

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-hidden bg-gradient-to-b from-navy-900 via-navy-800 to-grape-500"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Twinkles />
      <MoonShape className="absolute top-6 right-8 size-14 text-sun-200 sm:size-20" />
      <div className="absolute top-4 left-4 z-30 sm:top-6 sm:left-6">
        <CloseButton onClick={close} />
      </div>

      <AnimatePresence mode="wait">
        {phase === "cover" && (
          <motion.button
            key="cover"
            type="button"
            onClick={start}
            aria-label={`Read: ${story.title}`}
            className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-6 text-cream-50"
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <motion.div
              initial={{ y: 30, opacity: 0, rotate: -4 }}
              animate={{ y: 0, opacity: 1, rotate: -2 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
              className="relative w-[min(70vw,22rem)] overflow-hidden rounded-r-3xl rounded-l-lg border-[3px] border-navy-900 bg-grape-300 p-4 pl-7 text-navy-900 shadow-[0_8px_0_0_var(--color-navy-950)]"
            >
              <span className="absolute inset-y-0 left-0 w-4 border-r-[3px] border-navy-900 bg-navy-900/25" aria-hidden />
              <KidImage
                src={story.pages[0]?.imageUrl ?? null}
                className="aspect-[4/3] w-full rounded-2xl border-[2.5px] border-navy-900 bg-cream-50"
                fallback={<MoonShape className="size-16 text-sun-300" />}
              />
              <p className="mt-3 text-center font-display text-2xl leading-tight font-bold">{story.title}</p>
            </motion.div>
            <span className="flex items-center gap-4">
              <motion.span
                className="sticker-lg grid size-24 place-items-center rounded-full bg-sun-300 text-navy-900"
                animate={{ scale: [1, 1.07, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <PlayIcon className="size-12 translate-x-1" />
              </motion.span>
              <span className="font-display text-2xl font-semibold sm:text-3xl">Story time!</span>
            </span>
          </motion.button>
        )}

        {phase === "reading" && page && (
          <motion.div
            key="reading"
            className="absolute inset-0 flex items-center justify-center px-4 pt-20 pb-32 sm:px-24 sm:pb-28"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="relative h-full max-h-[34rem] w-full max-w-5xl [perspective:2400px]">
              <AnimatePresence initial={false} custom={turn.direction}>
                <motion.article
                  key={turn.page}
                  custom={turn.direction}
                  variants={FLIP}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  style={{ transformOrigin: "left center", backfaceVisibility: "hidden" }}
                  className="absolute inset-0 flex flex-col overflow-hidden rounded-[2rem] border-[3px] border-navy-900 bg-cream-50 shadow-[0_8px_0_0_var(--color-navy-950)] landscape:flex-row"
                >
                  <KidImage
                    src={page.imageUrl}
                    className="min-h-0 w-full flex-1 bg-grape-100 landscape:h-full landscape:w-1/2 landscape:flex-none"
                    fallback={<MoonShape className="size-20 text-grape-300" />}
                  />
                  <div className="flex flex-col justify-center gap-4 p-5 sm:p-8 landscape:w-1/2 landscape:p-10">
                    <p className="font-display text-[clamp(1.25rem,2.6vw,2rem)] leading-snug font-medium text-navy-900">{page.text}</p>
                    <p className="font-display text-sm font-semibold text-navy-400">
                      {turn.page + 1} / {pageCount}
                    </p>
                  </div>
                </motion.article>
              </AnimatePresence>
            </div>

            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-6 p-5 sm:p-7">
              <RoundButton label="Previous page" onClick={() => goTo(turn.page - 1)} disabled={turn.page === 0} className="size-16 bg-cream-50">
                <ArrowIcon direction="left" className="size-8" />
              </RoundButton>
              <RoundButton label={paused ? "Play" : "Pause"} onClick={togglePause} className="size-20 bg-sun-300">
                {paused ? <PlayIcon className="size-10 translate-x-0.5" /> : <PauseIcon className="size-10" />}
              </RoundButton>
              <RoundButton label="Next page" onClick={() => goTo(turn.page + 1)} className="size-16 bg-cream-50">
                <ArrowIcon className="size-8" />
              </RoundButton>
            </div>
          </motion.div>
        )}

        {phase === "goodnight" && (
          <motion.div
            key="goodnight"
            className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 text-center text-cream-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <motion.div initial={{ y: 40 }} animate={{ y: 0 }} transition={{ duration: 1.4, ease: "easeOut" }}>
              <OomiBuddy face="sleep" className="size-40 sm:size-52" />
            </motion.div>
            <h2 className="font-display text-5xl font-bold tracking-tight sm:text-7xl">Goodnight, {childName}</h2>
            <p className="font-display text-xl text-cream-200/80 sm:text-2xl">Sweet dreams, little explorer.</p>
            <button
              type="button"
              onClick={close}
              className="btn-chunky mt-4 flex items-center gap-3 rounded-full bg-grape-300 py-4 pr-9 pl-6 font-display text-2xl font-bold text-navy-900"
            >
              <MoonShape className="size-8" />
              The end
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
