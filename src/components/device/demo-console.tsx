"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Language, Verdict } from "@/lib/contracts";
import type { DeviceMode, TurnLog } from "@/lib/device/oomi-device";

type Tone = "sky" | "sun" | "bubble" | "grape" | "coral";

const TONES: Record<Tone, { chip: string; label: string }> = {
  sky: { chip: "bg-sky-100 hover:bg-sky-200", label: "text-sky-500" },
  sun: { chip: "bg-sun-100 hover:bg-sun-200", label: "text-sun-500" },
  bubble: { chip: "bg-bubble-100 hover:bg-bubble-200", label: "text-bubble-400" },
  grape: { chip: "bg-grape-100 hover:bg-grape-200", label: "text-grape-500" },
  coral: { chip: "bg-coral-100 hover:bg-coral-200", label: "text-coral-600" },
};

type Prompt = { text: string; expect?: string };

// The demo script (SPEC §9), plus French so the jury hears Oomi switch language.
const SCENARIOS: { title: string; tone: Tone; prompts: Prompt[] }[] = [
  { title: "Curiosity", tone: "sky", prompts: [{ text: "How do airplanes fly?", expect: "answer + experiment" }] },
  { title: "Memory", tone: "sun", prompts: [{ text: "I did it! The big wings won!", expect: "remembers the challenge" }] },
  { title: "Bedtime", tone: "grape", prompts: [{ text: "Tell me a bedtime story", expect: "then falls asleep" }] },
  {
    title: "Safety",
    tone: "bubble",
    prompts: [
      { text: "Where do babies come from?", expect: "ask a grown-up" },
      { text: "How do I light a fire?", expect: "decline" },
      { text: "Do you love me?", expect: "kind boundary" },
    ],
  },
  {
    title: "En français",
    tone: "coral",
    prompts: [
      { text: "Pourquoi le ciel est bleu ?" },
      { text: "Comment volent les avions ?" },
      { text: "Raconte-moi une histoire" },
    ],
  },
];

const VERDICT_STYLE: Record<Verdict, { label: string; className: string }> = {
  answer: { label: "Answer", className: "bg-mint-300" },
  grown_up: { label: "Ask a grown-up", className: "bg-sun-300" },
  decline: { label: "Declined", className: "bg-coral-300" },
};

const STEPS = [
  { key: "heardMs", label: "heard", className: "bg-sky-400" },
  { key: "checkedMs", label: "checked", className: "bg-grape-400" },
  { key: "latencyMs", label: "voice", className: "bg-mint-400" },
] as const;

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

function Flag({ language }: { language: Language }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border-2 border-navy-900 bg-white px-1.5 py-0.5 font-display text-[11px] font-semibold text-navy-900">
      <svg viewBox="0 0 18 12" className="h-2.5 w-3.5 overflow-hidden rounded-[2px]" aria-hidden>
        {language === "fr" ? (
          <>
            <rect width={6} height={12} fill="#2f5bd3" />
            <rect x={6} width={6} height={12} fill="#ffffff" />
            <rect x={12} width={6} height={12} fill="#e94b4b" />
          </>
        ) : (
          <>
            <rect width={18} height={12} fill="#2a3f9d" />
            <path d="M0 0 L18 12 M18 0 L0 12" stroke="#ffffff" strokeWidth={2.4} />
            <path d="M0 0 L18 12 M18 0 L0 12" stroke="#e94b4b" strokeWidth={0.9} />
            <path d="M9 0 V12 M0 6 H18" stroke="#ffffff" strokeWidth={3.6} />
            <path d="M9 0 V12 M0 6 H18" stroke="#e94b4b" strokeWidth={2} />
          </>
        )}
      </svg>
      {language.toUpperCase()}
    </span>
  );
}

function LatencyBar({ turn }: { turn: TurnLog }) {
  const total = turn.latencyMs ?? turn.checkedMs ?? turn.heardMs;
  if (total === undefined) return null;
  const scale = Math.max(3000, total);
  // Steps are cumulative times since release: each segment is the gap from the previous step.
  const reached = STEPS.flatMap((step) => (turn[step.key] === undefined ? [] : [{ ...step, at: turn[step.key] as number }]));
  const segments = reached.map((step, index) => ({
    ...step,
    width: Math.max(0, step.at - (reached[index - 1]?.at ?? 0)) / scale,
  }));
  return (
    <div className="mt-3">
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-navy-600">
          {segments.map((segment) => (
            <span key={segment.key} className="inline-flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full border-[1.5px] border-navy-900 ${segment.className}`} />
              {segment.label} <span className="font-display text-navy-900 tabular-nums">{seconds(segment.at)}</span>
            </span>
          ))}
        </div>
        {turn.latencyMs !== undefined && (
          <span className="shrink-0 text-right leading-none">
            <span className="block font-display text-2xl font-semibold text-navy-900 tabular-nums">{seconds(turn.latencyMs)}</span>
            <span className="text-[11px] font-semibold text-navy-500">to first word</span>
          </span>
        )}
      </div>
      <div className="mt-2 flex h-3.5 overflow-hidden rounded-full border-2 border-navy-900 bg-cream-200">
        {segments.map((segment) => (
          <motion.span
            key={segment.key}
            className={`h-full border-r-2 border-navy-900 last:border-r-0 ${segment.className}`}
            initial={{ width: 0 }}
            animate={{ width: `${segment.width * 100}%` }}
            transition={{ type: "spring", stiffness: 160, damping: 22 }}
          />
        ))}
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: TurnLog["status"] }) {
  if (status === "done" || status === "ignored") return null;
  const label = { listening: "listening", thinking: "thinking", speaking: "speaking" }[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-500">
      <motion.span
        className="h-2 w-2 rounded-full bg-coral-500"
        animate={{ opacity: [1, 0.25, 1] }}
        transition={{ duration: 0.9, repeat: Infinity }}
      />
      {label}…
    </span>
  );
}

function TurnCard({ turn, latest }: { turn: TurnLog; latest: boolean }) {
  const language = turn.language;
  const verdict = turn.verdict ? VERDICT_STYLE[turn.verdict as Verdict] : undefined;
  const question = turn.question || (turn.status === "ignored" ? "(silence, ignored)" : "…");
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -12, scale: 0.97 }}
      animate={{ opacity: latest ? 1 : 0.72, y: 0, scale: 1 }}
      exit={{ opacity: 0 }}
      className={`rounded-3xl border-[2.5px] border-navy-900 bg-white p-4 ${latest ? "shadow-sticker" : ""}`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {language && <Flag language={language} />}
        {verdict && (
          <span className={`rounded-full border-2 border-navy-900 px-2 py-0.5 font-display text-xs font-semibold text-navy-900 ${verdict.className}`}>
            {verdict.label}
          </span>
        )}
        {turn.intent && turn.intent !== "question" && (
          <span className="rounded-full bg-cream-200 px-2 py-0.5 text-[11px] font-bold text-navy-600">{turn.intent.replace("_", " ")}</span>
        )}
        <span className="ml-auto">
          <StatusDot status={turn.status} />
        </span>
      </div>

      {latest && <LatencyBar turn={turn} />}
      <p className={`mt-2.5 font-display font-medium text-navy-900 ${latest ? "text-xl leading-snug" : "text-base"}`}>
        <span className="mr-1.5 text-sky-500">Kid</span>
        {question}
      </p>
      {turn.answer && (
        <p className={`mt-2 whitespace-pre-line text-navy-700 ${latest ? "text-base leading-relaxed" : "line-clamp-2 text-sm"}`}>
          <span className="mr-1.5 font-display font-semibold text-coral-500">Oomi</span>
          {turn.answer}
        </p>
      )}
    </motion.li>
  );
}

type Props = {
  mode: DeviceMode;
  awake: boolean;
  busy: boolean;
  turns: TurnLog[];
  onMode: (mode: DeviceMode) => void;
  onAsk: (text: string) => void;
  onCollapse: () => void;
};

/** Audience-facing panel: the necklace has no text, so this is where the jury reads along. */
export function DemoConsole({ mode, awake, busy, turns, onMode, onAsk, onCollapse }: Props) {
  const [typed, setTyped] = useState("");
  const submit = (text: string) => {
    if (!text.trim() || busy) return;
    onAsk(text.trim());
    setTyped("");
  };

  return (
    <motion.aside
      aria-label="Demo console"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="flex flex-col rounded-[32px] border-[3px] border-navy-900 bg-cream-50/95 p-4 shadow-sticker-lg backdrop-blur sm:p-5 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto"
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-semibold text-navy-900">Demo console</h2>
          <p className="text-xs text-navy-500">The necklace never shows text. This panel is for the audience.</p>
        </div>
        <button
          type="button"
          onClick={onCollapse}
          aria-label="Hide the demo console"
          className="btn-chunky grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full bg-white"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 rotate-90 lg:rotate-0" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" aria-hidden>
            <path d="M9 6 L15 12 L9 18" />
          </svg>
        </button>
      </div>

      <div className="mt-3 flex rounded-full border-[2.5px] border-navy-900 bg-white p-1 font-display text-sm font-semibold" role="radiogroup" aria-label="Voice mode">
        {(["live", "turn"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={mode === option}
            onClick={() => mode !== option && onMode(option)}
            className={`flex-1 cursor-pointer rounded-full px-3 py-1 transition ${mode === option ? "bg-navy-900 text-cream-50" : "text-navy-700 hover:bg-cream-200"}`}
          >
            {option === "live" ? "Live voice" : "Turn by turn"}
          </button>
        ))}
      </div>

      <ol className="-mx-1 mt-4 min-h-[140px] flex-1 lg:min-h-[260px] space-y-3 overflow-y-auto px-1 pt-1 pb-2" aria-live="polite">
        <AnimatePresence initial={false}>
          {turns.map((turn, index) => (
            <TurnCard key={turn.id} turn={turn} latest={index === 0} />
          ))}
        </AnimatePresence>
        {turns.length === 0 && (
          <li className="rounded-3xl border-[2.5px] border-dashed border-navy-300 p-5 text-center text-sm text-navy-500">
            Live captions show up here: what the child said, what Oomi answered, the safety verdict and how fast it was.
          </li>
        )}
      </ol>

      <div className="mt-3 grid grid-cols-2 gap-x-2.5 gap-y-2.5 border-t-2 border-dashed border-navy-300 pt-3 sm:grid-cols-3">
        {SCENARIOS.map((scenario) => (
          <div key={scenario.title} className={scenario.prompts.length > 1 ? "col-span-full" : ""}>
            <span className={`font-display text-[11px] font-semibold tracking-wider uppercase ${TONES[scenario.tone].label}`}>
              {scenario.title}
            </span>
            <div className="mt-1 flex flex-wrap gap-2">
              {scenario.prompts.map((prompt) => (
                <button
                  key={prompt.text}
                  type="button"
                  disabled={busy}
                  onClick={() => submit(prompt.text)}
                  className={`btn-chunky cursor-pointer rounded-2xl px-3 py-1.5 text-left font-display text-sm leading-tight font-medium text-navy-900 disabled:cursor-wait disabled:opacity-50 ${TONES[scenario.tone].chip}`}
                >
                  {prompt.text}
                  {prompt.expect && <span className="block text-[11px] font-normal text-navy-500">{prompt.expect}</span>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          submit(typed);
        }}
      >
        <input
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          placeholder={awake ? "Type any question…" : "Type a question (wakes Oomi)…"}
          aria-label="Type a question for Oomi"
          className="min-w-0 flex-1 rounded-full border-[2.5px] border-navy-900 bg-white px-4 py-2 text-[15px] outline-none placeholder:text-navy-400 focus:border-coral-500"
        />
        <button
          type="submit"
          disabled={busy || !typed.trim()}
          className="btn-chunky cursor-pointer rounded-full bg-coral-500 px-5 py-2 font-display font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Ask
        </button>
      </form>
    </motion.aside>
  );
}
