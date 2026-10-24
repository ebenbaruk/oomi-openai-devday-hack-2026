"use client";

import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Language, StoryCard } from "@/lib/contracts";
import { BookIcon, ChevronIcon, CloseIcon, MoonIcon, PauseIcon, PenIcon, PlayIcon } from "./icons";
import { DrawingPlaceholder, Illustration, TimeLabel } from "./ui";
import { callApi } from "./use-journal";

const SWIPE_THRESHOLD_PX = 60;
// Illustrations are painted in the background after the text: a recent story without pictures is still being drawn.
const DRAWING_WINDOW_MS = 10 * 60 * 1000;

function isBeingDrawn(story: StoryCard, imageUrl: string | null): boolean {
  return imageUrl === null && Date.now() - new Date(story.createdAt).getTime() < DRAWING_WINDOW_MS;
}

function StoryPicture({ story, index, className }: { story: StoryCard; index: number; className: string }) {
  const imageUrl = story.pages[index]?.imageUrl ?? null;
  if (isBeingDrawn(story, imageUrl)) return <DrawingPlaceholder className={className} />;
  return (
    <Illustration
      src={imageUrl}
      alt={index === 0 ? `Cover of ${story.title}` : `Illustration for page ${index + 1}`}
      emoji={["🌙", "⭐", "🌟", "💤"][index % 4]}
      accent="grape"
      className={className}
    />
  );
}

// ---------- Tonight (Today view) ----------

export function TonightStory({
  story,
  childName,
  language,
  enabled,
  onWritten,
}: {
  story: StoryCard | null;
  childName: string;
  language: Language;
  enabled: boolean;
  onWritten: () => Promise<void>;
}) {
  const [reading, setReading] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-navy-900 text-cream-50 shadow-card">
      <NightSky />
      {story ? (
        <>
          <button type="button" onClick={() => setReading(true)} className="group relative block w-full text-left">
            <StoryPicture story={story} index={0} className="aspect-[16/10] w-full" />
            <span className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-navy-900 to-transparent" />
            <span className="absolute right-4 bottom-4 inline-flex items-center gap-2 rounded-full bg-sun-300 px-4 py-2 text-sm font-bold text-navy-900 shadow-soft transition-transform group-hover:scale-105">
              <BookIcon size={18} /> Read together
            </span>
          </button>
          <div className="relative space-y-4 p-5 sm:p-6">
            <div>
              <p className="text-xs font-extrabold tracking-[0.14em] text-sun-300 uppercase">
                Starring {childName} · <TimeLabel iso={story.createdAt} />
              </p>
              <h3 className="mt-1 font-display text-2xl leading-tight font-semibold">{story.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-cream-200/80">{story.pages[0]?.text}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ListenButton src={story.audioUrl} />
              {enabled && <WriteStoryButton language={language} onWritten={onWritten} variant="ghost" />}
            </div>
          </div>
          <AnimatePresence>{reading && <StoryReader story={story} onClose={() => setReading(false)} />}</AnimatePresence>
        </>
      ) : (
        <div className="relative space-y-4 p-6">
          <MoonIcon size={36} className="text-sun-300" />
          <div>
            <h3 className="font-display text-2xl leading-tight font-semibold">A story made from today</h3>
            <p className="mt-1 text-sm leading-relaxed text-cream-200/80">
              {enabled
                ? `Oomi turns ${childName}'s discoveries into an illustrated bedtime story, with ${childName} as the hero.`
                : "Bedtime stories are turned off. You can switch them on in Settings."}
            </p>
          </div>
          {enabled && <WriteStoryButton language={language} onWritten={onWritten} variant="solid" />}
        </div>
      )}
    </div>
  );
}

function NightSky() {
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 size-full text-cream-50/50" preserveAspectRatio="none">
      {[
        [8, 70],
        [22, 88],
        [64, 80],
        [86, 64],
        [92, 92],
        [44, 95],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={`${x}%`} cy={`${y}%`} r={1.4} fill="currentColor" />
      ))}
    </svg>
  );
}

type WriteState = "idle" | "writing" | "error";

/** Writing a story costs credits and takes ~15 s, so it's an explicit, patient action. */
function WriteStoryButton({
  language,
  onWritten,
  variant,
}: {
  language: Language;
  onWritten: () => Promise<void>;
  variant: "solid" | "ghost";
}) {
  const [state, setState] = useState<WriteState>("idle");

  const write = async () => {
    setState("writing");
    try {
      await callApi("/api/story", { method: "POST", body: JSON.stringify({ language }) });
      await onWritten();
      setState("idle");
    } catch {
      setState("error");
    }
  };

  if (state === "writing") {
    return (
      <div role="status" className="flex min-w-56 flex-1 flex-col gap-2 rounded-2xl bg-white/10 px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-bold">
          <motion.span animate={{ rotate: [-8, 8, -8] }} transition={{ duration: 0.8, repeat: Infinity }}>
            <PenIcon size={18} />
          </motion.span>
          Oomi is writing tonight&apos;s story…
        </span>
        <span className="h-1.5 overflow-hidden rounded-full bg-white/15">
          <motion.span
            className="block h-full rounded-full bg-sun-300"
            initial={{ width: "4%" }}
            animate={{ width: "92%" }}
            transition={{ duration: 16, ease: "easeOut" }}
          />
        </span>
      </div>
    );
  }

  const style =
    variant === "solid"
      ? "bg-sun-300 text-navy-900 hover:bg-sun-400"
      : "bg-white/10 text-cream-50 hover:bg-white/20";
  return (
    <button
      type="button"
      onClick={write}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-colors ${style}`}
    >
      <PenIcon size={18} />
      {state === "error" ? "Try again" : "Write tonight's story"}
    </button>
  );
}

// ---------- Listen ----------

/** Streams the bedtime narration only when asked: generating speech costs credits. */
function ListenButton({ src }: { src: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [state, setState] = useState<"idle" | "loading" | "playing" | "error">("idle");

  useEffect(() => {
    const element = audio.current;
    return () => element?.pause();
  }, []);

  if (!src) return null;

  const toggle = async () => {
    const element = audio.current;
    if (!element) return;
    if (!element.paused) {
      element.pause();
      return;
    }
    setState("loading");
    try {
      await element.play();
    } catch {
      setState("error");
    }
  };

  const label = { idle: "Listen", loading: "Warming up…", playing: "Pause", error: "Try again" }[state];

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        className="inline-flex items-center gap-2 rounded-full bg-mint-300 px-4 py-2.5 text-sm font-bold text-navy-900 transition-colors hover:bg-mint-400"
      >
        {state === "playing" ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
        {label}
      </button>
      <audio
        ref={audio}
        src={src}
        preload="none"
        onPlaying={() => setState("playing")}
        onPause={() => setState("idle")}
        onEnded={() => setState("idle")}
        onError={() => setState("error")}
      />
    </>
  );
}

// ---------- Library (child view) ----------

export function StoryLibrary({ stories }: { stories: StoryCard[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openStory = stories.find((story) => story.id === openId) ?? null;

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {stories.map((story) => (
          <li key={story.id}>
            <button
              type="button"
              onClick={() => setOpenId(story.id)}
              className="group block w-full overflow-hidden rounded-[1.5rem] bg-navy-900 text-left shadow-card transition-transform hover:-translate-y-1"
            >
              <StoryPicture story={story} index={0} className="aspect-[4/3] w-full" />
              <div className="p-3.5">
                <p className="line-clamp-2 font-display text-base leading-tight font-semibold text-cream-50">{story.title}</p>
                <p className="mt-1 text-xs font-semibold text-cream-200/70">
                  <TimeLabel iso={story.createdAt} /> · {story.pages.length} pages
                </p>
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

// ---------- Reader ----------

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
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/75 backdrop-blur-sm sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="story-reader-title"
        className="relative flex max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[2rem] bg-navy-900 text-cream-50 shadow-2xl sm:rounded-[2rem]"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
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
          <div className="flex shrink-0 items-center gap-2">
            <ListenButton src={story.audioUrl} />
            <button
              ref={closeButton}
              type="button"
              onClick={onClose}
              aria-label="Close the story"
              className="grid size-10 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
            >
              <CloseIcon size={18} />
            </button>
          </div>
        </header>

        <div className="relative min-h-0 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={pageIndex}
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
              <StoryPicture
                story={story}
                index={pageIndex}
                className="pointer-events-none aspect-square w-full rounded-3xl sm:aspect-[16/10]"
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
            className="grid size-11 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20 disabled:opacity-30"
          >
            <ChevronIcon className="rotate-180" />
          </button>
          <div className="flex gap-1.5" aria-label={`Page ${pageIndex + 1} of ${story.pages.length}`} role="status">
            {story.pages.map((_, index) => (
              <span
                key={index}
                aria-hidden
                className={`h-1.5 rounded-full transition-all ${index === pageIndex ? "w-5 bg-sun-300" : "w-1.5 bg-white/30"}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => goTo(pageIndex + 1)}
            disabled={pageIndex === lastPage}
            aria-label="Next page"
            className="grid size-11 place-items-center rounded-full bg-sun-300 text-navy-900 transition-colors hover:bg-sun-400 disabled:bg-white/10 disabled:text-cream-50 disabled:opacity-30"
          >
            <ChevronIcon />
          </button>
        </footer>
      </motion.div>
    </motion.div>
  );
}
