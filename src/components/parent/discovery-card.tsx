"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useState } from "react";
import type { Activity, DiscoveryCard } from "@/lib/contracts";
import { CheckIcon, ChevronIcon, SparkleIcon, TvIcon } from "./icons";
import { ACCENTS, accentFor, DrawingPlaceholder, Illustration, Shimmer, TimeLabel, type Accent } from "./ui";

export type DiscoveryActions = {
  onToggleDone: (card: DiscoveryCard, done: boolean) => void;
  onMakeVideo: (card: DiscoveryCard) => void;
};

export function DiscoveryCardView({
  card,
  childName,
  videosEnabled,
  actions,
  fresh = false,
  eager = false,
  openActivity = false,
}: {
  card: DiscoveryCard;
  childName: string;
  videosEnabled: boolean;
  actions: DiscoveryActions;
  /** Arrived live while the page was open: gets a little "New" sticker. */
  fresh?: boolean;
  eager?: boolean;
  openActivity?: boolean;
}) {
  if (card.status === "pending") return <PendingDiscovery card={card} />;

  const accent = accentFor(card.topic ?? card.question);
  const emoji = card.emoji ?? "✨";
  const isReport = card.intent === "challenge_report";

  return (
    <article
      className={`relative overflow-hidden rounded-[2rem] bg-white shadow-card ring-1 sm:grid sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] ${
        fresh ? "ring-2 ring-coral-300" : "ring-cream-200"
      }`}
    >
      <div className="relative sm:p-4 sm:pr-0">
        <Illustration
          src={card.imageUrl}
          alt={card.topic ? `Illustration about ${card.topic}` : "Illustration of the discovery"}
          emoji={emoji}
          accent={accent}
          eager={eager}
          className="aspect-[16/10] sm:aspect-square sm:rounded-[1.5rem]"
        />
        {fresh && (
          <span className="absolute top-3 left-3 -rotate-6 rounded-full bg-coral-500 px-3 py-1 font-display text-sm font-semibold text-white shadow-sticker-sm sm:top-6 sm:left-6">
            New!
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${ACCENTS[accent].chip}`}>
            <span aria-hidden>{emoji}</span>
            {card.topic ?? "A new discovery"}
          </span>
          <span className="text-xs font-semibold text-navy-500">
            <TimeLabel iso={card.createdAt} />
          </span>
        </div>

        <div>
          <p className="text-xs font-extrabold tracking-[0.12em] text-navy-400 uppercase">
            {isReport ? `${childName} reported back` : `${childName} asked`}
          </p>
          <h3 className="mt-1 font-display text-2xl leading-snug font-semibold tracking-tight text-balance text-navy-900">
            “{card.question}”
          </h3>
          {card.summary && <p className="mt-2 leading-relaxed text-navy-700">{card.summary}</p>}
        </div>

        {card.activity && <ActivityBlock activity={card.activity} accent={accent} defaultOpen={openActivity} />}

        {(card.activity || videosEnabled) && (
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
            {card.activity && <DoneButton card={card} onToggle={actions.onToggleDone} />}
            {videosEnabled && <VideoAction card={card} onMake={actions.onMakeVideo} />}
          </div>
        )}
      </div>
    </article>
  );
}

function ActivityBlock({ activity, accent, defaultOpen }: { activity: Activity; accent: Accent; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  return (
    <div className={`rounded-3xl ${ACCENTS[accent].soft} ring-1 ${ACCENTS[accent].ring}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 rounded-3xl p-4 text-left"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white shadow-sm">
          <SparkleIcon className={ACCENTS[accent].ink} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-extrabold tracking-[0.12em] text-navy-500 uppercase">Try it together</span>
          <span className="block font-display text-lg leading-tight font-semibold text-navy-900">{activity.title}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-navy-600">
          <span className="hidden sm:inline">{open ? "Hide" : `${activity.steps.length} steps`}</span>
          <ChevronIcon size={18} className={`transition-transform ${open ? "rotate-90" : ""}`} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <ol className="space-y-2">
                {activity.steps.map((step, index) => (
                  <li key={index} className="flex gap-3 leading-snug text-navy-800">
                    <span
                      aria-hidden
                      className="grid size-6 shrink-0 place-items-center rounded-full bg-white font-display text-sm font-semibold text-navy-700 shadow-sm"
                    >
                      {index + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
              {activity.parentTip && (
                <p className="mt-3 rounded-2xl bg-white/85 px-4 py-3 text-sm leading-relaxed text-navy-700">
                  <strong className="font-bold text-navy-900">Parent tip · </strong>
                  {activity.parentTip}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DoneButton({ card, onToggle }: { card: DiscoveryCard; onToggle: DiscoveryActions["onToggleDone"] }) {
  const done = card.doneAt !== null;
  const [burst, setBurst] = useState(0);
  const reduceMotion = useReducedMotion();

  const toggle = () => {
    if (!done) setBurst((count) => count + 1);
    onToggle(card, !done);
  };

  return (
    <motion.button
      type="button"
      aria-pressed={done}
      onClick={toggle}
      whileTap={{ scale: 0.94 }}
      className={`relative inline-flex items-center gap-2 rounded-full px-4 py-2.5 font-display text-base font-semibold transition-colors ${
        done ? "bg-mint-400 text-white shadow-soft" : "bg-white text-navy-800 ring-2 ring-mint-300 hover:bg-mint-50"
      }`}
    >
      <span
        className={`grid size-6 place-items-center rounded-full transition-colors ${done ? "bg-white text-mint-600" : "border-2 border-dashed border-mint-400"}`}
      >
        <AnimatePresence initial={false}>
          {done && (
            <motion.span initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
              <CheckIcon size={16} strokeWidth={3} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      {done ? "We did it!" : "We did it together"}
      {!reduceMotion && burst > 0 && <Confetti key={burst} />}
    </motion.button>
  );
}

const CONFETTI = ["#f26a4b", "#36ad7f", "#ffc53d", "#5bb5f0", "#a585ef", "#ff7aa8", "#f26a4b", "#36ad7f"];

function Confetti() {
  return (
    <span aria-hidden className="pointer-events-none absolute top-1/2 left-6">
      {CONFETTI.map((color, index) => {
        const angle = (index / CONFETTI.length) * Math.PI * 2;
        return (
          <motion.span
            key={index}
            className="absolute size-2 rounded-full"
            style={{ backgroundColor: color }}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{ x: Math.cos(angle) * 46, y: Math.sin(angle) * 34 - 10, scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.75, ease: "easeOut" }}
          />
        );
      })}
    </span>
  );
}

function VideoAction({ card, onMake }: { card: DiscoveryCard; onMake: DiscoveryActions["onMakeVideo"] }) {
  if (card.video.status === "ready") {
    return (
      <Link
        href="/kids"
        className="inline-flex items-center gap-2 rounded-full bg-grape-100 px-4 py-2.5 text-sm font-bold text-grape-500 transition-colors hover:bg-grape-200"
      >
        <TvIcon size={18} />
        On Oomi TV
      </Link>
    );
  }
  if (card.video.status === "pending") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-grape-100/70 px-4 py-2.5 text-sm font-bold text-grape-500">
        <motion.span animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}>
          <TvIcon size={18} />
        </motion.span>
        Making the video…
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onMake(card)}
      className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold text-navy-600 ring-1 ring-cream-200 transition-colors hover:bg-grape-100 hover:text-grape-500 hover:ring-grape-200"
    >
      <TvIcon size={18} />
      Make a video
    </button>
  );
}

function PendingDiscovery({ card }: { card: DiscoveryCard }) {
  return (
    <article
      aria-busy="true"
      className="overflow-hidden rounded-[2rem] bg-white/90 shadow-card ring-1 ring-cream-200 sm:grid sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]"
    >
      <div className="sm:p-4 sm:pr-0">
        <DrawingPlaceholder className="aspect-[16/10] sm:aspect-square sm:rounded-[1.5rem]" />
      </div>
      <div className="space-y-4 p-5 sm:p-6">
        <Shimmer className="h-7 w-32" />
        <h3 className="font-display text-2xl leading-snug font-semibold tracking-tight text-navy-900">“{card.question}”</h3>
        <div className="space-y-2.5">
          <Shimmer className="h-4 w-11/12" />
          <Shimmer className="h-4 w-8/12" />
        </div>
        <Shimmer className="h-16 w-full rounded-3xl" />
      </div>
    </article>
  );
}

/** One line in the history list; opens into the full card. */
export function DiscoveryRow({
  card,
  childName,
  videosEnabled,
  actions,
}: {
  card: DiscoveryCard;
  childName: string;
  videosEnabled: boolean;
  actions: DiscoveryActions;
}) {
  const [open, setOpen] = useState(false);
  const accent = accentFor(card.topic ?? card.question);

  if (open) {
    return (
      <div className="relative">
        <DiscoveryCardView card={card} childName={childName} videosEnabled={videosEnabled} actions={actions} openActivity />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mx-auto mt-2 block rounded-full px-4 py-1.5 text-sm font-bold text-navy-500 hover:text-navy-800"
        >
          Show less
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="flex w-full items-center gap-3 rounded-3xl bg-white p-2.5 pr-4 text-left shadow-card ring-1 ring-cream-200 transition-transform hover:-translate-y-0.5"
    >
      <Illustration
        src={card.imageUrl}
        alt=""
        emoji={card.emoji ?? "✨"}
        accent={accent}
        className="size-16 shrink-0 rounded-2xl [&_span]:text-3xl"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-navy-500">
          {card.emoji} {card.topic ?? "Discovery"}
        </span>
        <span className="block truncate font-display text-lg font-medium text-navy-900">“{card.question}”</span>
      </span>
      {card.doneAt && (
        <span className="hidden shrink-0 items-center gap-1 rounded-full bg-mint-100 px-2.5 py-1 text-xs font-bold text-mint-700 sm:inline-flex">
          <CheckIcon size={14} strokeWidth={3} /> Done
        </span>
      )}
      {card.video.status === "ready" && (
        <span className="hidden shrink-0 rounded-full bg-grape-100 p-1.5 text-grape-500 sm:inline-flex" title="On Oomi TV">
          <TvIcon size={14} />
        </span>
      )}
      <ChevronIcon size={18} className="shrink-0 text-navy-400" />
    </button>
  );
}
