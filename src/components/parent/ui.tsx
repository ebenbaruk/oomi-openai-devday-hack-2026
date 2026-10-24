"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState, type ReactNode } from "react";
import { OomiEyes } from "@/components/device/oomi-eyes";
import type { Face } from "@/lib/contracts";

// ---------- Topic accents: one color family per card, picked from the topic itself ----------

export type Accent = "coral" | "mint" | "sun" | "sky" | "grape" | "bubble";

type AccentClasses = { soft: string; chip: string; dot: string; ring: string; ink: string; art: string };

// Full class strings so Tailwind can see them at build time.
export const ACCENTS: Record<Accent, AccentClasses> = {
  coral: {
    soft: "bg-coral-50",
    chip: "bg-coral-100 text-coral-700",
    dot: "bg-coral-400",
    ring: "ring-coral-200",
    ink: "text-coral-600",
    art: "from-coral-200 via-coral-100 to-sun-100",
  },
  mint: {
    soft: "bg-mint-50",
    chip: "bg-mint-100 text-mint-700",
    dot: "bg-mint-400",
    ring: "ring-mint-200",
    ink: "text-mint-600",
    art: "from-mint-200 via-mint-100 to-sky-100",
  },
  sun: {
    soft: "bg-sun-100/60",
    chip: "bg-sun-200 text-navy-800",
    dot: "bg-sun-400",
    ring: "ring-sun-200",
    ink: "text-sun-500",
    art: "from-sun-200 via-sun-100 to-coral-100",
  },
  sky: {
    soft: "bg-sky-100/70",
    chip: "bg-sky-100 text-sky-500",
    dot: "bg-sky-400",
    ring: "ring-sky-200",
    ink: "text-sky-500",
    art: "from-sky-200 via-sky-100 to-mint-100",
  },
  grape: {
    soft: "bg-grape-100/70",
    chip: "bg-grape-100 text-grape-500",
    dot: "bg-grape-400",
    ring: "ring-grape-200",
    ink: "text-grape-500",
    art: "from-grape-200 via-grape-100 to-sky-100",
  },
  bubble: {
    soft: "bg-bubble-100/70",
    chip: "bg-bubble-100 text-coral-700",
    dot: "bg-bubble-400",
    ring: "ring-bubble-200",
    ink: "text-bubble-400",
    art: "from-bubble-200 via-bubble-100 to-sun-100",
  },
};

const KEYWORDS: [RegExp, Accent][] = [
  [/moon|star|space|planet|night|rocket|galax|sleep|dream/i, "grape"],
  [/air|plane|fly|ocean|sea|water|rain|cloud|sky|bird|wind|fish|wave|ice|snow/i, "sky"],
  [/plant|tree|leaf|seed|garden|frog|bug|insect|cat|dog|animal|forest|grass/i, "mint"],
  [/sun|light|rainbow|color|bee|honey|gold|shadow/i, "sun"],
  [/volcano|fire|lava|dino|heart|body|blood|earth|rock/i, "coral"],
  [/feel|friend|love|music|sing|dance|family|sad|happy/i, "bubble"],
];
const ORDER: Accent[] = ["coral", "mint", "sky", "grape", "sun", "bubble"];

/** Stable, meaningful color for a topic so the page never reshuffles colors on refresh. */
export function accentFor(text: string | null | undefined): Accent {
  const seed = text ?? "";
  for (const [pattern, accent] of KEYWORDS) if (pattern.test(seed)) return accent;
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return ORDER[Math.abs(hash) % ORDER.length];
}

// ---------- Oomi himself ----------

/** Oomi: the navy screen with animated eyes, set in a coral pebble like the real necklace. */
export function OomiPebble({ face = "idle", className = "size-10" }: { face?: Face; className?: string }) {
  return (
    <span
      aria-hidden
      className={`relative inline-block shrink-0 rounded-[42%] bg-gradient-to-br from-coral-300 to-coral-500 shadow-[inset_-3px_-4px_8px_rgb(176_61_34/0.35),inset_3px_3px_6px_rgb(255_255_255/0.4)] ${className}`}
    >
      <span className="absolute inset-[16%] overflow-hidden rounded-full">
        <OomiEyes face={face} />
      </span>
    </span>
  );
}

// ---------- Layout bits ----------

export function SectionHeader({
  title,
  kicker,
  subtitle,
  action,
  id,
}: {
  title: ReactNode;
  kicker?: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  id?: string;
}) {
  return (
    <header className="mb-4 flex items-end justify-between gap-3">
      <div className="min-w-0">
        {kicker && <p className="mb-1 text-xs font-extrabold tracking-[0.14em] text-coral-600 uppercase">{kicker}</p>}
        <h2 id={id} className="font-display text-2xl leading-tight font-semibold tracking-tight text-navy-900 sm:text-[1.75rem]">
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-[0.95rem] text-navy-600">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function EmptyState({ face = "curious", title, children }: { face?: Face; title: string; children?: ReactNode }) {
  return (
    <div className="flex items-center gap-4 rounded-[1.75rem] border-2 border-dashed border-cream-200 bg-cream-50/70 px-5 py-6">
      <OomiPebble face={face} className="size-14" />
      <div>
        <p className="font-display text-lg font-medium text-navy-900">{title}</p>
        {children && <p className="mt-0.5 text-sm leading-relaxed text-navy-600">{children}</p>}
      </div>
    </div>
  );
}

// ---------- Pictures ----------

/** Generated illustration from the API, or a soft gradient with the topic emoji while it is being painted. */
export function Illustration({
  src,
  alt,
  emoji,
  accent,
  eager = false,
  className = "",
}: {
  src: string | null;
  alt: string;
  emoji: string;
  accent: Accent;
  eager?: boolean;
  className?: string;
}) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const loaded = src !== null && loadedSrc === src;
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${ACCENTS[accent].art} ${className}`}>
      {!loaded && (
        <div aria-hidden className="absolute inset-0 grid place-items-center">
          <span className="animate-float text-6xl drop-shadow-sm">{emoji}</span>
        </div>
      )}
      {src && (
        // Dynamic images are served from the database behind the access cookie, so next/image can't optimize them.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setLoadedSrc(src)}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  );
}

/** "Oomi is drawing…": a pending picture that looks alive rather than broken. */
export function DrawingPlaceholder({ label = "Oomi is drawing…", className = "" }: { label?: string; className?: string }) {
  return (
    <div
      className={`relative grid place-items-center overflow-hidden bg-gradient-to-br from-cream-200 via-cream-50 to-coral-50 ${className}`}
    >
      <Shimmer className="absolute inset-0 rounded-none opacity-70" />
      <DoodleStars />
      <div className="relative flex flex-col items-center gap-3 px-4 text-center">
        <OomiPebble face="thinking" className="size-16" />
        <p className="font-display text-lg font-medium text-navy-700">{label}</p>
      </div>
    </div>
  );
}

function DoodleStars() {
  const reduceMotion = useReducedMotion();
  const stars = [
    { x: "14%", y: "22%", size: 18, delay: 0 },
    { x: "80%", y: "18%", size: 14, delay: 0.6 },
    { x: "72%", y: "74%", size: 20, delay: 1.1 },
    { x: "22%", y: "76%", size: 12, delay: 1.6 },
  ];
  return (
    <>
      {stars.map((star) => (
        <motion.svg
          key={star.x}
          aria-hidden
          viewBox="0 0 24 24"
          width={star.size}
          height={star.size}
          className="absolute text-sun-400"
          style={{ left: star.x, top: star.y }}
          animate={reduceMotion ? undefined : { scale: [0.6, 1.1, 0.6], rotate: [0, 20, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: star.delay }}
        >
          <path fill="currentColor" d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z" />
        </motion.svg>
      ))}
    </>
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

// ---------- Time ----------

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

export function dayKey(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function dayLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

// ---------- Controls ----------

export function Switch({
  checked,
  onChange,
  labelledBy,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  labelledBy: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${checked ? "bg-mint-400" : "bg-navy-300"}`}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`absolute top-1 size-6 rounded-full bg-white shadow ${checked ? "right-1" : "left-1"}`}
      />
    </button>
  );
}

/** A two-step destructive button: no browser dialog, the confirmation unfolds in place. */
export function ConfirmAction({
  label,
  question,
  confirmLabel,
  busyLabel = "Erasing…",
  onConfirm,
  variant = "soft",
}: {
  label: string;
  question: string;
  confirmLabel: string;
  busyLabel?: string;
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
      ? "bg-coral-50 text-coral-700 ring-1 ring-coral-200 hover:bg-coral-100"
      : "bg-white text-navy-700 ring-1 ring-cream-200 hover:text-coral-700 hover:ring-coral-200";

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
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            className="rounded-3xl bg-coral-50 p-4 ring-1 ring-coral-200"
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
                {step === "busy" ? busyLabel : confirmLabel}
              </button>
              <button
                type="button"
                disabled={step === "busy"}
                onClick={() => setStep("idle")}
                className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-navy-700 ring-1 ring-cream-200 transition-colors hover:bg-cream-50"
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

export const cardMotion = {
  layout: "position",
  initial: { opacity: 0, y: 24, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { type: "spring", damping: 22, stiffness: 220 },
} as const;
