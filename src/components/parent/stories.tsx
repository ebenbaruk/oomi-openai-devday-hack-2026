"use client";

import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { StoryCard } from "@/lib/contracts";
import { Illustration, TimeLabel } from "./ui";

const SPEECH_MAX_CHARS = 4000;
const SWIPE_THRESHOLD_PX = 60;
const NIGHT_SKY = "from-navy-700 via-lilac-300/70 to-coral-200";

export function StoryShelf({ stories }: { stories: StoryCard[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openStory = stories.find((story) => story.id === openId) ?? null;

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2">
        {stories.map((story) => (
          <li key={story.id}>
            <button
              type="button"
              onClick={() => setOpenId(story.id)}
              className="group block w-full overflow-hidden rounded-[2rem] bg-navy-800 text-left shadow-card transition-transform hover:-translate-y-1"
            >
              <Illustration
                src={story.pages[0]?.imageUrl ?? null}
                alt=""
                seed={story.id}
                emoji="🌙"
                tint={NIGHT_SKY}
                sizes="(min-width: 640px) 360px, 100vw"
                className="aspect-[4/3]"
              />
              <div className="flex items-center justify-between gap-3 p-5">
                <div>
                  <p className="font-display text-lg leading-tight font-semibold text-cream-50">{story.title}</p>
                  <p className="mt-1 text-xs font-semibold text-cream-200/70">
                    <TimeLabel iso={story.createdAt} /> · {story.pages.length} pages
                  </p>
                </div>
                <span
                  aria-hidden
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-sun-300 text-lg text-navy-900 transition-transform group-hover:scale-110"
                >
                  📖
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
      <AnimatePresence>
        {openStory && <StoryReader key={openStory.id} story={openStory} onClose={() => setOpenId(null)} />}
      </AnimatePresence>
    </>
  );
}

function StoryReader({ story, onClose }: { story: StoryCard; onClose: () => void }) {
  const [pageIndex, setPageIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const closeButton = useRef<HTMLButtonElement>(null);
  const lastPage = story.pages.length - 1;
  const page = story.pages[Math.min(pageIndex, lastPage)];

  const goTo = useCallback(
    (next: number) => {
      if (next < 0 || next > lastPage) return;
      setDirection(next > pageIndex ? 1 : -1);
      setPageIndex(next);
    },
    [lastPage, pageIndex],
  );

  useEffect(() => {
    closeButton.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") goTo(pageIndex + 1);
      if (event.key === "ArrowLeft") goTo(pageIndex - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, onClose, pageIndex]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD_PX) goTo(pageIndex + 1);
    if (info.offset.x > SWIPE_THRESHOLD_PX) goTo(pageIndex - 1);
  };

  if (!page) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/70 backdrop-blur-sm sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="story-reader-title"
        className="relative flex max-h-[100dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-[2rem] bg-navy-900 text-cream-50 shadow-2xl sm:rounded-[2rem]"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 260 }}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
          <div className="min-w-0">
            <p className="text-xs font-extrabold tracking-[0.14em] text-sun-300 uppercase">Bedtime story</p>
            <h3 id="story-reader-title" className="truncate font-display text-xl font-semibold">
              {story.title}
            </h3>
          </div>
          <button
            ref={closeButton}
            type="button"
            onClick={onClose}
            aria-label="Close the story"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-xl transition-colors hover:bg-white/20"
          >
            ×
          </button>
        </header>

        <div className="relative min-h-0 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={pageIndex}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.28 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.25}
              onDragEnd={onDragEnd}
              className="cursor-grab px-5 active:cursor-grabbing"
            >
              <Illustration
                src={page.imageUrl}
                alt={`Illustration for page ${pageIndex + 1}`}
                seed={`${story.id}-${pageIndex}`}
                emoji={["🌙", "⭐", "🌟", "💤"][pageIndex % 4]}
                tint={NIGHT_SKY}
                sizes="(min-width: 640px) 560px, 100vw"
                className="pointer-events-none aspect-square w-full rounded-3xl sm:aspect-[4/3]"
              />
              <p className="py-5 font-display text-lg leading-relaxed text-cream-100 sm:text-xl">{page.text}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={() => goTo(pageIndex - 1)}
            disabled={pageIndex === 0}
            aria-label="Previous page"
            className="grid size-11 place-items-center rounded-full bg-white/10 text-lg transition-colors hover:bg-white/20 disabled:opacity-30"
          >
            ←
          </button>
          <div className="flex flex-col items-center gap-2">
            <ListenButton story={story} />
            <div className="flex gap-1.5" aria-label={`Page ${pageIndex + 1} of ${story.pages.length}`} role="status">
              {story.pages.map((_, index) => (
                <span
                  key={index}
                  aria-hidden
                  className={`h-1.5 rounded-full transition-all ${index === pageIndex ? "w-5 bg-sun-300" : "w-1.5 bg-white/30"}`}
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => goTo(pageIndex + 1)}
            disabled={pageIndex === lastPage}
            aria-label="Next page"
            className="grid size-11 place-items-center rounded-full bg-sun-300 text-lg text-navy-900 transition-colors hover:bg-sun-400 disabled:bg-white/10 disabled:text-cream-50 disabled:opacity-30"
          >
            →
          </button>
        </footer>
      </motion.div>
    </motion.div>
  );
}

type ListenState = "idle" | "loading" | "playing" | "error";

/** Narrates the whole story with the bedtime voice. Only on explicit click: speech costs credits. */
function ListenButton({ story }: { story: StoryCard }) {
  const [state, setState] = useState<ListenState>("idle");
  const audio = useRef<HTMLAudioElement | null>(null);
  const audioUrl = useRef<string | null>(null);

  useEffect(
    () => () => {
      audio.current?.pause();
      if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
    },
    [],
  );

  const play = async () => {
    if (state === "playing") {
      audio.current?.pause();
      setState("idle");
      return;
    }
    try {
      if (!audio.current) {
        setState("loading");
        const text = story.pages.map((page) => page.text).join("\n\n").slice(0, SPEECH_MAX_CHARS);
        const response = await fetch("/api/speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, style: "bedtime" }),
        });
        if (!response.ok) throw new Error(`Speech failed (${response.status})`);
        audioUrl.current = URL.createObjectURL(await response.blob());
        audio.current = new Audio(audioUrl.current);
        audio.current.addEventListener("ended", () => setState("idle"));
      }
      await audio.current.play();
      setState("playing");
    } catch {
      setState("error");
    }
  };

  const label = { idle: "Listen", loading: "Warming up…", playing: "Pause", error: "Try again" }[state];
  const icon = { idle: "🎧", loading: "⏳", playing: "⏸", error: "↻" }[state];

  return (
    <button
      type="button"
      onClick={play}
      disabled={state === "loading"}
      className="flex items-center gap-2 rounded-full bg-mint-300 px-5 py-2 text-sm font-bold text-navy-900 shadow-soft transition-colors hover:bg-mint-400 disabled:opacity-70"
    >
      <span aria-hidden>{icon}</span>
      {label}
    </button>
  );
}
