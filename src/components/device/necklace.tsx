"use client";

import { AnimatePresence, motion } from "motion/react";
import type { CSSProperties } from "react";
import type { Face } from "@/lib/contracts";
import { OomiEyes } from "./oomi-eyes";

type Props = {
  face: Face;
  micOpen: boolean;
  pressed: boolean;
  micEnabled: boolean;
  level?: () => number;
  onPress: () => void;
  onRelease: () => void;
  onToggleMic: () => void;
};

// Everything is laid out on a 600×560 canvas so the SVG body and the HTML parts (screen, button, LED)
// stay aligned at any size.
const W = 600;
const H = 560;
const PEBBLE = "M 230 146 C 320 146 380 236 386 342 C 392 448 322 514 230 514 C 138 514 68 448 74 342 C 80 236 140 146 230 146 Z";
const CORD_OUT = "M 230 120 C 234 58 300 16 384 18 C 474 20 544 72 550 160 C 554 222 538 276 516 314";
const CORD_BACK = "M 492 362 C 450 430 424 262 384 168 C 352 96 276 96 234 122";

/** Positions an HTML element on the 600×560 canvas, by its center and diameter. */
function at(cx: number, cy: number, size: number, height = size): CSSProperties {
  return {
    left: `${((cx - size / 2) / W) * 100}%`,
    top: `${((cy - height / 2) / H) * 100}%`,
    width: `${(size / W) * 100}%`,
    height: `${(height / H) * 100}%`,
  };
}

/** Braided cord: a pale base with coral and mint flecks, like the render's climbing-rope lanyard. */
function Rope({ d }: { d: string }) {
  return (
    <g fill="none">
      <path d={d} stroke="#d9a58e" strokeWidth={24} strokeLinecap="round" />
      <path d={d} stroke="#f7ddcf" strokeWidth={20} strokeLinecap="round" />
      {/* Two offset rows of short dashes read as a braid of coral and mint strands. */}
      <path d={d} stroke="#f39478" strokeWidth={10} strokeDasharray="6 4" transform="translate(-3 -2)" />
      <path d={d} stroke="#f7a68c" strokeWidth={10} strokeDasharray="6 4" strokeDashoffset={5} transform="translate(3 2)" />
      <path d={d} stroke="#9ed6c0" strokeWidth={8} strokeDasharray="5 25" strokeDashoffset={2} transform="translate(-3 -2)" />
      <path d={d} stroke="#9ed6c0" strokeWidth={8} strokeDasharray="5 35" strokeDashoffset={17} transform="translate(3 2)" />
      <path d={d} stroke="#ffffff" strokeWidth={3} strokeOpacity={0.4} transform="translate(-2 -4)" />
    </g>
  );
}

function Body() {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
      <defs>
        <radialGradient id="pebble-fill" cx="36%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#ffb59a" />
          <stop offset="45%" stopColor="#f78d6e" />
          <stop offset="82%" stopColor="#e9724f" />
          <stop offset="100%" stopColor="#d75f3e" />
        </radialGradient>
        <linearGradient id="clasp-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bde8d5" />
          <stop offset="100%" stopColor="#7cc4a6" />
        </linearGradient>
        <filter id="soft-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <clipPath id="pebble-clip">
          <path d={PEBBLE} />
        </clipPath>
      </defs>

      <Rope d={CORD_BACK} />
      <Rope d={CORD_OUT} />
      {/* Mint breakaway clasp: snaps open if the cord gets caught. */}
      <g transform="translate(504 338) rotate(117)">
        <rect x={-44} y={-16} width={42} height={32} rx={14} fill="url(#clasp-fill)" stroke="#5fa98a" strokeWidth={1.5} />
        <rect x={2} y={-16} width={42} height={32} rx={14} fill="url(#clasp-fill)" stroke="#5fa98a" strokeWidth={1.5} />
        <rect x={-36} y={-11} width={26} height={6} rx={3} fill="#ffffff" opacity={0.45} />
        <rect x={10} y={-11} width={26} height={6} rx={3} fill="#ffffff" opacity={0.45} />
      </g>

      {/* Bail with the cord threaded through */}
      <rect x={196} y={94} width={68} height={84} rx={30} fill="#ee7d5d" />
      <rect x={212} y={108} width={36} height={26} rx={13} fill="#b84b30" />

      {/* Shell */}
      <path d={PEBBLE} fill="url(#pebble-fill)" />
      <g clipPath="url(#pebble-clip)">
        <path d={PEBBLE} fill="none" stroke="#b9472b" strokeOpacity={0.35} strokeWidth={26} filter="url(#soft-blur)" transform="translate(10 16)" />
        <ellipse cx={160} cy={230} rx={44} ry={70} fill="#ffffff" opacity={0.22} filter="url(#soft-blur)" />
        {/* Recesses for the screen and the button */}
        <circle cx={228} cy={282} r={99} fill="#d8603f" opacity={0.55} />
        <circle cx={222} cy={422} r={46} fill="#d8603f" opacity={0.5} />
      </g>
      <text
        x={230}
        y={502}
        textAnchor="middle"
        fontFamily="var(--font-fredoka), sans-serif"
        fontWeight={600}
        fontSize={23}
        letterSpacing={3}
        fill="#cf5c3c"
        style={{ paintOrder: "stroke" }}
        stroke="#ffb59a"
        strokeOpacity={0.5}
        strokeWidth={1}
      >
        oomi
      </text>
    </svg>
  );
}

/** The necklace, drawn like the product render: coral pebble, round navy screen, big mint button. */
export function Necklace({ face, micOpen, pressed, micEnabled, level, onPress, onRelease, onToggleMic }: Props) {
  const still = face === "listening";
  return (
    <div className="relative aspect-[600/560] w-full select-none">
      {/* Floor shadow breathes with the float */}
      <motion.div
        aria-hidden
        className="absolute rounded-[50%] bg-coral-700/25 blur-xl"
        style={at(232, 548, 270, 26)}
        animate={still ? { scale: 1, opacity: 0.9 } : { scale: [1, 0.86, 1], opacity: [0.9, 0.6, 0.9] }}
        transition={still ? { duration: 0.2 } : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute inset-0"
        style={{ originX: 0.38, originY: 0.9 }}
        animate={still ? { rotate: 0, y: 0 } : { rotate: [-2.5, 1, -2.5], y: [0, -14, 0] }}
        transition={still ? { duration: 0.25 } : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div
          className="absolute inset-0"
          style={{ originX: 0.38, originY: 0.92 }}
          animate={pressed ? { scaleY: 0.975, scaleX: 1.015 } : { scaleY: 1, scaleX: 1 }}
          transition={{ type: "spring", stiffness: 600, damping: 18 }}
        >
          <Body />

          {/* Screen */}
          <div
            className="absolute rounded-full bg-navy-950 p-[3.5%] shadow-[inset_0_6px_14px_rgb(0_0_0/0.6),0_2px_0_rgb(255_255_255/0.35)]"
            style={at(228, 282, 186)}
          >
            <div className="h-full w-full overflow-hidden rounded-full">
              <OomiEyes face={face} level={level} />
            </div>
          </div>

          {/* Listening glow around the button */}
          <AnimatePresence>
            {micOpen && (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute rounded-full border-[6px] border-mint-300"
                style={at(222, 420, 96)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: [0.9, 0.2, 0.9], scale: [1, 1.22, 1] }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </AnimatePresence>

          {/* Push-to-talk button */}
          <button
            type="button"
            aria-label="Hold to talk to Oomi"
            aria-pressed={pressed}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              onPress();
            }}
            onPointerUp={onRelease}
            onPointerCancel={onRelease}
            onContextMenu={(event) => event.preventDefault()}
            className="group absolute cursor-pointer touch-none rounded-full outline-offset-8"
            style={at(222, 420, 78)}
          >
            <span className="absolute inset-0 translate-y-[7%] rounded-full bg-mint-600" />
            <span
              className={`absolute inset-0 rounded-full bg-gradient-to-br from-mint-200 via-mint-300 to-mint-400 shadow-[inset_0_-6px_10px_rgb(36_140_100/0.35),inset_0_6px_8px_rgb(255_255_255/0.65)] transition-transform duration-100 ${
                pressed ? "translate-y-[7%] scale-[0.96]" : "group-hover:-translate-y-[2%]"
              }`}
            />
          </button>

          {/* Mic LED: on only while Oomi is listening */}
          <span
            role="status"
            aria-label={micOpen ? "Microphone on" : "Microphone off"}
            className={`absolute rounded-full transition-all duration-150 ${
              micOpen
                ? "bg-[#7dffad] shadow-[0_0_14px_5px_rgb(125_255_173/0.8),0_0_40px_10px_rgb(125_255_173/0.35)]"
                : "bg-[#c7583a] shadow-[inset_0_1px_2px_rgb(0_0_0/0.35)]"
            }`}
            style={at(300, 418, 12)}
          />

          {/* Physical mic kill switch on the side */}
          <button
            type="button"
            onClick={onToggleMic}
            aria-label={micEnabled ? "Turn microphone off" : "Turn microphone on"}
            aria-pressed={!micEnabled}
            className="absolute flex cursor-pointer justify-center rounded-full bg-[#d9643f] p-[0.35%] shadow-[inset_-2px_0_4px_rgb(0_0_0/0.25)]"
            style={at(384, 318, 15, 56)}
          >
            <span
              className={`block h-[45%] w-full rounded-full transition-transform duration-200 ${
                micEnabled ? "bg-mint-300" : "translate-y-[120%] bg-navy-800"
              }`}
            />
          </button>
          <AnimatePresence>
            {!micEnabled && (
              <motion.span
                className="absolute rounded-full border-2 border-navy-900 bg-white px-2.5 py-0.5 font-display text-xs font-semibold whitespace-nowrap text-navy-900 shadow-sticker-sm sm:text-sm"
                style={{ left: `${(404 / W) * 100}%`, top: `${(330 / H) * 100}%` }}
                initial={{ opacity: 0, scale: 0.6, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: -4 }}
                exit={{ opacity: 0, scale: 0.6 }}
              >
                mic off
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
