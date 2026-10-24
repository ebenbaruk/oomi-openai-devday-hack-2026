// Chunky inline icons: thick strokes and rounded joins read well at kid sizes.

type IconProps = { className?: string };

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 3.2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function PlayIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2Z" fill="currentColor" />
    </svg>
  );
}

export function PauseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="5.5" y="4.5" width="4.6" height="15" rx="1.8" fill="currentColor" />
      <rect x="13.9" y="4.5" width="4.6" height="15" rx="1.8" fill="currentColor" />
    </svg>
  );
}

export function ArrowIcon({ className, direction = "right" }: IconProps & { direction?: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden style={direction === "left" ? { transform: "scaleX(-1)" } : undefined}>
      <path d="M5 12h13M12.5 5.5 19 12l-6.5 6.5" {...STROKE} />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" {...STROKE} />
    </svg>
  );
}

export function HomeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M4 11.2 12 4.5l8 6.7M6.5 9.5V19h11V9.5" {...STROKE} strokeWidth={2.4} />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M5 12.5 10 17.5 19.5 7" {...STROKE} strokeWidth={3.6} />
    </svg>
  );
}

export function StarShape({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M12 2.8l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7Z"
        fill="currentColor"
        stroke="var(--color-navy-900)"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MoonShape({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M19.5 14.8A8 8 0 0 1 9.2 4.5a8 8 0 1 0 10.3 10.3Z" fill="currentColor" />
    </svg>
  );
}

export function Squiggle({ className }: IconProps) {
  return (
    <svg viewBox="0 0 120 20" className={className} aria-hidden preserveAspectRatio="none">
      <path d="M3 10c10-10 16 10 26 0s16-10 26 0 16 10 26 0 16-10 26 0 9 6 10 4" {...STROKE} strokeWidth={4.5} />
    </svg>
  );
}
