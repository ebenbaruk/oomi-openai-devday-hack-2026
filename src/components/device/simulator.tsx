"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Face } from "@/lib/contracts";
import { OomiDevice, type DeviceMode, type TurnLog } from "@/lib/device/oomi-device";
import { Necklace } from "./necklace";

const DEMO_PROMPTS = [
  "How do airplanes fly?",
  "I did it! The big wings won!",
  "Where do babies come from?",
  "How do I light a fire?",
  "You're my best friend, do you love me?",
  "Tell me a bedtime story",
];

const VERDICT_STYLE: Record<string, { label: string; className: string }> = {
  answer: { label: "answer", className: "bg-mint-100 text-mint-700" },
  grown_up: { label: "ask a grown-up", className: "bg-sun-300/50 text-navy-800" },
  decline: { label: "declined", className: "bg-coral-100 text-coral-700" },
};

function Backdrop() {
  // Soft floating doodles: planets, stars, a paper plane. Pure decoration.
  const items = [
    { emoji: "✈️", className: "left-[8%] top-[18%] text-4xl", delay: 0 },
    { emoji: "🪐", className: "right-[10%] top-[12%] text-5xl", delay: 1.2 },
    { emoji: "⭐", className: "left-[16%] bottom-[22%] text-3xl", delay: 0.6 },
    { emoji: "🌱", className: "right-[18%] bottom-[16%] text-4xl", delay: 1.8 },
    { emoji: "🦕", className: "left-[4%] top-[55%] text-4xl", delay: 2.4 },
    { emoji: "🌈", className: "right-[4%] top-[48%] text-4xl", delay: 0.9 },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-coral-200/50 blur-3xl" />
      <div className="absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-mint-200/60 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-sun-300/30 blur-3xl" />
      {items.map((item) => (
        <motion.span
          key={item.emoji}
          className={`absolute opacity-70 ${item.className}`}
          animate={{ y: [0, -14, 0], rotate: [-6, 6, -6] }}
          transition={{ duration: 7, repeat: Infinity, delay: item.delay, ease: "easeInOut" }}
        >
          {item.emoji}
        </motion.span>
      ))}
    </div>
  );
}

export function Simulator() {
  const deviceRef = useRef<OomiDevice | null>(null);
  const [mode, setMode] = useState<DeviceMode>("live");
  const [face, setFace] = useState<Face>("sleep");
  const [micOpen, setMicOpen] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [awake, setAwake] = useState(false);
  const [waking, setWaking] = useState(false);
  const [status, setStatus] = useState("Tap the button to wake Oomi");
  const [turns, setTurns] = useState<TurnLog[]>([]);
  const [typed, setTyped] = useState("");

  const level = useCallback(() => deviceRef.current?.level() ?? 0, []);

  const wake = useCallback(async (nextMode: DeviceMode) => {
    deviceRef.current?.close();
    const device = new OomiDevice(nextMode, {
      face: setFace,
      mic: setMicOpen,
      status: setStatus,
      turn: (turn) =>
        setTurns((current) => {
          const others = current.filter((item) => item.id !== turn.id);
          return [turn, ...others].sort((a, b) => b.id - a.id).slice(0, 12);
        }),
    });
    deviceRef.current = device;
    setWaking(true);
    try {
      await device.wake();
      setAwake(device.awake);
    } catch (error) {
      console.error(error);
      setStatus("Oomi could not wake up. Check the connection and try again.");
      setFace("sleep");
    } finally {
      setWaking(false);
    }
  }, []);

  useEffect(() => () => deviceRef.current?.close(), []);

  const press = useCallback(() => {
    if (!awake) {
      if (!waking) void wake(mode);
      return;
    }
    if (!micEnabled) {
      setStatus("The microphone switch is off");
      return;
    }
    setPressed(true);
    deviceRef.current?.press();
  }, [awake, waking, wake, mode, micEnabled]);

  const release = useCallback(() => {
    setPressed(false);
    void deviceRef.current?.release();
  }, []);

  // Space bar = the button, for keyboard demos.
  useEffect(() => {
    const isTyping = (target: EventTarget | null) => target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
    const down = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat || isTyping(event.target)) return;
      event.preventDefault();
      press();
    };
    const up = (event: KeyboardEvent) => {
      if (event.code !== "Space" || isTyping(event.target)) return;
      event.preventDefault();
      release();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [press, release]);

  const switchMode = (nextMode: DeviceMode) => {
    setMode(nextMode);
    setTurns([]);
    if (awake) void wake(nextMode);
  };

  const ask = (text: string) => {
    if (!text.trim() || !awake) return;
    void deviceRef.current?.ask(text.trim());
    setTyped("");
  };

  const latest = turns[0];

  return (
    <main className="relative min-h-dvh overflow-hidden bg-cream-100">
      <Backdrop />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-4 pt-5 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-2xl font-semibold text-navy-900">
          <Image src="/brand/oomi-mascot.png" alt="" width={36} height={36} className="h-9 w-9 rounded-xl" />
          oomi
        </Link>
        <Link
          href="/parent"
          className="rounded-full bg-white/80 px-4 py-2 font-display text-sm font-medium text-navy-800 shadow-card backdrop-blur transition hover:bg-white"
        >
          Parent journal →
        </Link>
      </header>

      <div className="relative z-10 mx-auto grid max-w-6xl gap-8 px-4 pt-4 pb-12 sm:px-6 lg:grid-cols-[1fr_380px] lg:items-start lg:pt-8">
        <section className="flex flex-col items-center" aria-label="Oomi necklace simulator">
          <Necklace
            face={face}
            micOpen={micOpen}
            pressed={pressed}
            micEnabled={micEnabled}
            level={level}
            onPress={press}
            onRelease={release}
            onToggleMic={() => setMicEnabled((value) => !value)}
          />
          <AnimatePresence mode="wait">
            <motion.p
              key={status + String(awake)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-8 text-center font-display text-xl font-medium text-navy-800"
            >
              {waking ? "Waking up…" : awake ? (pressed ? "I'm listening!" : "Hold the button (or Space) and ask anything") : status}
            </motion.p>
          </AnimatePresence>
          {awake && <p className="mt-1 text-sm text-navy-700/70">{status}</p>}
        </section>

        <aside className="rounded-[28px] bg-white/75 p-5 shadow-card backdrop-blur" aria-label="Demo console">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-navy-900">Demo console</h2>
            <div className="flex rounded-full bg-cream-200 p-1 text-xs font-semibold" role="radiogroup" aria-label="Voice mode">
              {(["live", "turn"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={mode === option}
                  onClick={() => switchMode(option)}
                  className={`rounded-full px-3 py-1 transition ${mode === option ? "bg-navy-900 text-cream-50" : "text-navy-700"}`}
                >
                  {option === "live" ? "Live voice" : "Turn by turn"}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-1 text-xs text-navy-700/70">The necklace never shows text. This panel is for the audience.</p>

          <form
            className="mt-4 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              ask(typed);
            }}
          >
            <input
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              placeholder={awake ? "Type a question…" : "Wake Oomi first"}
              disabled={!awake}
              className="min-w-0 flex-1 rounded-full border border-cream-200 bg-cream-50 px-4 py-2 text-sm outline-none focus:border-mint-400"
            />
            <button
              type="submit"
              disabled={!awake || !typed.trim()}
              className="rounded-full bg-coral-500 px-4 py-2 font-display text-sm font-semibold text-white transition hover:bg-coral-600 disabled:opacity-40"
            >
              Ask
            </button>
          </form>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {DEMO_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={!awake}
                onClick={() => ask(prompt)}
                className="rounded-full bg-cream-100 px-3 py-1 text-xs text-navy-800 transition hover:bg-mint-100 disabled:opacity-40"
              >
                {prompt}
              </button>
            ))}
          </div>

          <ol className="mt-5 space-y-3">
            <AnimatePresence initial={false}>
              {turns.map((turn) => (
                <motion.li
                  key={turn.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: turn === latest ? 1 : 0.6, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl bg-cream-50 p-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-navy-900">🧒 {turn.question || (turn.status === "ignored" ? "(silence)" : "…")}</span>
                    {turn.verdict && (
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${VERDICT_STYLE[turn.verdict]?.className ?? ""}`}>
                        {VERDICT_STYLE[turn.verdict]?.label ?? turn.verdict}
                      </span>
                    )}
                  </div>
                  {turn.answer && <p className="mt-1.5 whitespace-pre-line text-navy-700">🟠 {turn.answer}</p>}
                  <div className="mt-1.5 flex gap-3 text-[11px] text-navy-700/60">
                    <span>{turn.status === "ignored" ? "ignored (noise)" : turn.status}</span>
                    {turn.heardMs !== undefined && <span>heard {(turn.heardMs / 1000).toFixed(1)} s</span>}
                    {turn.checkedMs !== undefined && <span>safety ✓ {(turn.checkedMs / 1000).toFixed(1)} s</span>}
                    {turn.latencyMs !== undefined && <span>voice {(turn.latencyMs / 1000).toFixed(1)} s</span>}
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>
          {turns.length === 0 && (
            <p className="mt-6 text-center text-sm text-navy-700/60">Conversations will appear here as they happen.</p>
          )}
        </aside>
      </div>
    </main>
  );
}
