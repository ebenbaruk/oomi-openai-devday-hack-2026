"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState, type ReactNode } from "react";

export function Section({
  id,
  emoji,
  title,
  subtitle,
  children,
  action,
}: {
  id: string;
  emoji: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
      <header className="mb-4 flex items-end justify-between gap-3 px-1">
        <div>
          <h2 id={`${id}-title`} className="font-display text-2xl font-semibold text-navy-900 sm:text-[1.7rem]">
            <span aria-hidden className="mr-2">
              {emoji}
            </span>
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-[0.95rem] text-navy-700/75">{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

export function EmptyState({ emoji, children }: { emoji: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border-2 border-dashed border-cream-200 bg-cream-50/70 px-5 py-6 text-navy-700/80">
      <span aria-hidden className="text-3xl">
        {emoji}
      </span>
      <p className="text-[0.95rem] leading-relaxed">{children}</p>
    </div>
  );
}

const TINTS = [
  "from-coral-100 via-coral-50 to-sun-300/50",
  "from-mint-200 via-mint-100 to-sky-300/40",
  "from-sun-300/70 via-cream-100 to-coral-100",
  "from-sky-300/50 via-cream-50 to-lilac-300/60",
  "from-lilac-300/60 via-coral-50 to-mint-100",
];

/** Stable soft gradient per card so the page doesn't reshuffle colors on every refresh. */
export function tintFor(seed: string): string {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return TINTS[Math.abs(hash) % TINTS.length];
}

/** Generated illustration, or a soft emoji placeholder while the picture is still being painted. */
export function Illustration({
  src,
  alt,
  seed,
  emoji,
  sizes,
  tint,
  eager = false,
  className = "",
}: {
  src: string | null;
  alt: string;
  seed: string;
  emoji: string;
  sizes: string;
  /** Overrides the per-seed gradient, e.g. a night sky for bedtime stories. */
  tint?: string;
  eager?: boolean;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${tint ?? tintFor(seed)} ${className}`}>
      <div aria-hidden className="absolute inset-0 grid place-items-center">
        <span className="animate-float text-6xl drop-shadow-sm">{emoji}</span>
      </div>
      {src && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          // Images sit behind the access cookie, so the optimizer could not fetch them.
          unoptimized
          loading={eager ? "eager" : "lazy"}
          onLoad={() => setLoaded(true)}
          className={`object-cover transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  );
}

export function Shimmer({ className = "" }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      aria-hidden
      className={`rounded-full bg-[linear-gradient(90deg,var(--color-cream-200)_0%,var(--color-cream-50)_50%,var(--color-cream-200)_100%)] bg-[length:200%_100%] ${className}`}
      animate={reduceMotion ? undefined : { backgroundPosition: ["100% 0%", "-100% 0%"] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
    />
  );
}

export function TimeLabel({ iso, withDay = true }: { iso: string; withDay?: boolean }) {
  const date = new Date(iso);
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const label = withDay ? `${dayLabel(date)} · ${time}` : time;
  return (
    // Server and browser may sit in different timezones; the browser's label wins.
    <time dateTime={iso} suppressHydrationWarning>
      {label}
    </time>
  );
}

function dayLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/** A two-step destructive button: no browser dialog, the confirmation unfolds in place. */
export function ConfirmAction({
  label,
  question,
  confirmLabel,
  onConfirm,
  variant = "soft",
}: {
  label: string;
  question: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
  variant?: "soft" | "danger";
}) {
  const [step, setStep] = useState<"idle" | "confirm" | "busy" | "error">("idle");

  const confirm = async () => {
    setStep("busy");
    try {
      await onConfirm();
      setStep("idle");
    } catch {
      setStep("error");
    }
  };

  const trigger =
    variant === "danger"
      ? "border-2 border-coral-300 bg-white text-coral-700 hover:bg-coral-50"
      : "border-2 border-cream-200 bg-cream-50 text-navy-700 hover:border-coral-200 hover:text-coral-700";

  return (
    <div aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        {step === "idle" ? (
          <motion.button
            key="idle"
            type="button"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            onClick={() => setStep("confirm")}
            className={`rounded-full px-5 py-2.5 text-sm font-bold transition-colors ${trigger}`}
          >
            {label}
          </motion.button>
        ) : (
          <motion.div
            key="confirm"
            role="group"
            aria-label={question}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="rounded-3xl border-2 border-coral-200 bg-coral-50 p-4"
          >
            <p className="font-semibold text-navy-900">{question}</p>
            {step === "error" && <p className="mt-1 text-sm text-coral-700">That didn&apos;t work. Please try again.</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={step === "busy"}
                onClick={confirm}
                className="rounded-full bg-coral-600 px-5 py-2.5 text-sm font-bold text-white shadow-soft transition-colors hover:bg-coral-700 disabled:opacity-60"
              >
                {step === "busy" ? "Erasing…" : confirmLabel}
              </button>
              <button
                type="button"
                disabled={step === "busy"}
                onClick={() => setStep("idle")}
                className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-navy-700 ring-2 ring-cream-200 transition-colors hover:bg-cream-50"
              >
                Keep it
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
