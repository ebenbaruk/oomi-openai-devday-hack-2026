"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { CloseIcon, StarShape } from "./icons";

type RoundButtonProps = {
  label: string;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
};

/** Big round sticker button: the only kind of control a child needs here. */
export function RoundButton({ label, onClick, children, className = "size-16 bg-cream-50", disabled }: RoundButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`btn-chunky grid shrink-0 place-items-center rounded-full text-navy-900 disabled:pointer-events-none disabled:opacity-35 ${className}`}
    >
      {children}
    </button>
  );
}

export function CloseButton({ onClick, label = "Close" }: { onClick: () => void; label?: string }) {
  return (
    <RoundButton label={label} onClick={onClick} className="size-14 bg-cream-50">
      <CloseIcon className="size-7" />
    </RoundButton>
  );
}

/** Dynamic images come from the DB (`/api/images/...`), so a plain img is the simple choice. */
export function KidImage({ src, className, fallback }: { src: string | null; className?: string; fallback: ReactNode }) {
  if (!src) return <div className={`grid place-items-center ${className ?? ""}`}>{fallback}</div>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" draggable={false} className={`object-cover select-none ${className ?? ""}`} />;
}

const BURST = Array.from({ length: 14 }, (_, index) => {
  const angle = (index / 14) * Math.PI * 2;
  const distance = 150 + (index % 3) * 70;
  return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, rotate: index * 47, size: 22 + (index % 3) * 10 };
});
const BURST_COLORS = ["text-sun-300", "text-bubble-300", "text-sky-300", "text-mint-300", "text-grape-300"];

/** A one-shot burst of stars, for the "you did it" moments. */
export function StarBurst({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 grid place-items-center ${className}`} aria-hidden>
      {BURST.map((star, index) => (
        <motion.span
          key={index}
          className={`absolute ${BURST_COLORS[index % BURST_COLORS.length]}`}
          style={{ width: star.size, height: star.size }}
          initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }}
          animate={{ x: star.x, y: star.y, scale: 1, rotate: star.rotate, opacity: [1, 1, 0] }}
          transition={{ duration: 1.4, ease: [0.2, 0.8, 0.3, 1], delay: 0.15 + (index % 4) * 0.04 }}
        >
          <StarShape className="size-full" />
        </motion.span>
      ))}
    </div>
  );
}

/** Small hand-drawn speech bubble used for Oomi's lines. */
export function SpeechBubble({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`sticker relative rounded-[1.75rem] bg-cream-50 px-6 py-4 ${className}`}>
      {children}
      <svg viewBox="0 0 30 24" className="absolute top-1/2 -left-[22px] w-[26px] -translate-y-1/2" aria-hidden>
        <path d="M30 2 L4 12 L30 22" fill="var(--color-cream-50)" stroke="var(--color-navy-900)" strokeWidth={2.5} strokeLinejoin="round" />
        <rect x="27.5" y="3.5" width="4" height="17" fill="var(--color-cream-50)" />
      </svg>
    </div>
  );
}

const TWINKLES = [
  { left: "8%", top: "18%", size: 14, delay: 0 },
  { left: "22%", top: "70%", size: 10, delay: 0.8 },
  { left: "40%", top: "12%", size: 12, delay: 1.6 },
  { left: "66%", top: "78%", size: 16, delay: 0.4 },
  { left: "86%", top: "52%", size: 10, delay: 1.2 },
  { left: "55%", top: "40%", size: 8, delay: 2 },
];

export function Twinkles() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {TWINKLES.map((star) => (
        <motion.span
          key={`${star.left}-${star.top}`}
          className="absolute text-sun-200"
          style={{ left: star.left, top: star.top, width: star.size, height: star.size }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.15, 0.8] }}
          transition={{ duration: 2.6, repeat: Infinity, delay: star.delay }}
        >
          <StarShape className="size-full [&_path]:stroke-transparent" />
        </motion.span>
      ))}
    </div>
  );
}
