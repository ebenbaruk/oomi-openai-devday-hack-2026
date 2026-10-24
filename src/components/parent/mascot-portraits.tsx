"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MascotArt } from "@/components/mascot/mascot-art";
import type { MascotConfig, MascotPortrait } from "@/lib/contracts";
import { TimeLabel } from "./ui";

const PAINT_SECONDS = 25;
const STEPS = ["Picking the colors…", "Sketching the big round shapes…", "Simplifying, simplifying…", "Adding the eyes…", "Almost dry…"];

type Props = {
  draft: MascotConfig;
  portraits: MascotPortrait[];
  avatarId: string | null;
  onPaint: () => Promise<void>;
  onUse: (portrait: MascotPortrait | null) => Promise<void>;
  onDelete: (portrait: MascotPortrait) => Promise<void>;
};

/** Paints an illustrated portrait of the mascot with GPT Image, on demand only (each painting costs credits). */
export function PortraitStudio({ draft, portraits, avatarId, onPaint, onUse, onDelete }: Props) {
  const [painting, setPainting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const paint = async () => {
    setError(null);
    setPainting(true);
    try {
      await onPaint();
    } catch {
      setError("The painting didn't work this time. Please try again.");
    } finally {
      setPainting(false);
    }
  };

  const act = async (id: string, action: () => Promise<void>) => {
    setBusyId(id);
    setError(null);
    try {
      await action();
    } catch {
      setError("That didn't go through. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-3xl bg-grape-100/70 p-4 ring-1 ring-grape-200 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-semibold text-navy-900">A painted portrait of {draft.name.trim() || "Oomi"}</p>
          <p className="mt-1 text-sm leading-relaxed text-navy-700">
            GPT Image paints your current design with the <em>ip-as-logo</em> method: one cute, ultra-simple character, three colors,
            peeking from a corner. Credits are used only when you press the button.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void paint()}
          disabled={painting}
          className="shrink-0 rounded-full bg-grape-500 px-6 py-3 font-display text-lg font-semibold text-white shadow-soft transition-colors hover:bg-grape-400 disabled:opacity-60"
        >
          {painting ? "Painting…" : "Paint a portrait"}
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-2xl bg-coral-50 px-4 py-2.5 text-sm font-semibold text-coral-700 ring-1 ring-coral-200">
          {error}
        </p>
      )}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <AnimatePresence initial={false}>
          {painting && (
            <motion.li key="painting" layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <PaintingCard draft={draft} />
            </motion.li>
          )}
          {portraits.map((portrait) => {
            const inUse = portrait.id === avatarId;
            const busy = busyId === portrait.id;
            return (
              <motion.li
                key={portrait.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`overflow-hidden rounded-3xl bg-white shadow-card ${inUse ? "ring-3 ring-coral-500" : "ring-1 ring-cream-200"}`}
              >
                <div className="relative">
                  {/* Portraits are served from the database behind the access cookie, so next/image can't optimize them. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={portrait.imageUrl} alt={`Painted portrait of a ${portrait.species}`} loading="lazy" className="aspect-square w-full object-cover" />
                  {inUse && (
                    <span className="absolute top-2 left-2 rounded-full bg-coral-500 px-2.5 py-1 text-xs font-extrabold text-white shadow">Avatar</span>
                  )}
                </div>
                <div className="space-y-2 p-2.5">
                  <p className="px-1 text-xs font-semibold text-navy-500">
                    <span className="capitalize">{portrait.species}</span> · <TimeLabel iso={portrait.createdAt} />
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void act(portrait.id, () => onUse(inUse ? null : portrait))}
                      className={`flex-1 rounded-full px-3 py-2 text-xs font-bold transition-colors disabled:opacity-60 ${
                        inUse ? "bg-cream-100 text-navy-700 hover:bg-cream-200" : "bg-navy-900 text-white hover:bg-navy-800"
                      }`}
                    >
                      {inUse ? "Stop using" : "Use as avatar"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      aria-label="Delete this portrait"
                      onClick={() => void act(portrait.id, () => onDelete(portrait))}
                      className="grid size-8 shrink-0 place-items-center rounded-full bg-cream-100 text-navy-600 transition-colors hover:bg-coral-100 hover:text-coral-700 disabled:opacity-60"
                    >
                      <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
                        <path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
      {portraits.length === 0 && !painting && (
        <p className="rounded-2xl border-2 border-dashed border-cream-200 px-4 py-5 text-center text-sm text-navy-500">
          No portraits yet. Your paintings will be kept here.
        </p>
      )}
    </div>
  );
}

/** The ~25 s wait, made fun: the code-drawn mascot "sits" for its portrait while a brush works. */
function PaintingCard({ draft }: { draft: MascotConfig }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(() => setElapsed((Date.now() - started) / 1000), 250);
    return () => clearInterval(timer);
  }, []);
  // Eases toward 95% so a slow painting never looks finished before it is.
  const progress = Math.min(0.95, 1 - Math.exp(-elapsed / (PAINT_SECONDS / 2.2)));
  const step = STEPS[Math.min(STEPS.length - 1, Math.floor((elapsed / PAINT_SECONDS) * STEPS.length))];
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-card ring-2 ring-grape-300">
      <div className="relative aspect-square">
        <MascotArt config={draft} face="thinking" className="size-full opacity-90" />
        <motion.div
          aria-hidden
          className="absolute inset-0 bg-white/55"
          style={{ clipPath: `inset(${progress * 100}% 0 0 0)` }}
        />
        <motion.span
          aria-hidden
          className="absolute right-3 text-3xl drop-shadow"
          style={{ top: `${Math.max(4, progress * 100 - 10)}%` }}
          animate={{ rotate: [-12, 14, -12], x: [-30, 0, -30] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          🖌️
        </motion.span>
      </div>
      <div className="space-y-2 p-3">
        <p aria-live="polite" className="text-xs font-bold text-grape-500">
          {step}
        </p>
        <div className="h-2 overflow-hidden rounded-full bg-grape-100">
          <motion.div className="h-full rounded-full bg-grape-400" animate={{ width: `${progress * 100}%` }} transition={{ ease: "linear" }} />
        </div>
      </div>
    </div>
  );
}
