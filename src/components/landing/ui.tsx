import type { ReactNode } from "react";

/** One color family per topic, spelled out so Tailwind can see every class. */
export const ACCENTS = {
  coral: { solid: "bg-coral-300", soft: "bg-coral-100", ink: "text-coral-600", ring: "border-coral-300" },
  sun: { solid: "bg-sun-300", soft: "bg-sun-100", ink: "text-sun-500", ring: "border-sun-300" },
  mint: { solid: "bg-mint-300", soft: "bg-mint-100", ink: "text-mint-600", ring: "border-mint-300" },
  sky: { solid: "bg-sky-300", soft: "bg-sky-100", ink: "text-sky-500", ring: "border-sky-300" },
  grape: { solid: "bg-grape-300", soft: "bg-grape-100", ink: "text-grape-500", ring: "border-grape-300" },
  bubble: { solid: "bg-bubble-300", soft: "bg-bubble-100", ink: "text-bubble-400", ring: "border-bubble-300" },
} as const;
export type Accent = keyof typeof ACCENTS;

export function Eyebrow({ children, accent = "coral", tilt = -2 }: { children: ReactNode; accent?: Accent; tilt?: number }) {
  return (
    <span
      className={`sticker inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-display text-sm font-semibold tracking-wide text-navy-900 uppercase ${ACCENTS[accent].solid}`}
      style={{ rotate: `${tilt}deg` }}
    >
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  accent,
  title,
  intro,
  align = "center",
  invert = false,
}: {
  eyebrow: string;
  accent?: Accent;
  title: ReactNode;
  intro?: ReactNode;
  align?: "center" | "left";
  invert?: boolean;
}) {
  const centered = align === "center";
  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-2xl"}>
      <Eyebrow accent={accent}>{eyebrow}</Eyebrow>
      <h2
        className={`mt-5 font-display text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl ${invert ? "text-cream-50" : "text-navy-900"}`}
      >
        {title}
      </h2>
      {intro && (
        <p className={`mt-4 text-lg text-pretty sm:text-xl ${centered ? "mx-auto max-w-2xl" : ""} ${invert ? "text-navy-300" : "text-navy-600"}`}>
          {intro}
        </p>
      )}
    </div>
  );
}

export function Section({ id, className = "", children }: { id?: string; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={`relative scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28 ${className}`}>
      <div className="relative mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

/* Doodles: tiny inline SVGs used as stickers and UI chrome. */

export function Star({ className = "", fill = "var(--color-sun-300)" }: { className?: string; fill?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <path
        d="M20 3 L24.6 14.2 L36.6 15.1 L27.4 22.9 L30.3 34.6 L20 28.3 L9.7 34.6 L12.6 22.9 L3.4 15.1 L15.4 14.2 Z"
        fill={fill}
        stroke="var(--color-navy-900)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Sparkle({ className = "", fill = "var(--color-mint-300)" }: { className?: string; fill?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <path
        d="M20 2 C21.5 13 27 18.5 38 20 C27 21.5 21.5 27 20 38 C18.5 27 13 21.5 2 20 C13 18.5 18.5 13 20 2 Z"
        fill={fill}
        stroke="var(--color-navy-900)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Squiggle({ className = "", stroke = "var(--color-coral-400)" }: { className?: string; stroke?: string }) {
  return (
    <svg viewBox="0 0 120 20" className={className} aria-hidden preserveAspectRatio="none">
      <path d="M3 12 Q 13 2 23 12 T 43 12 T 63 12 T 83 12 T 103 12 T 117 10" fill="none" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function Check({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function Cross({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
