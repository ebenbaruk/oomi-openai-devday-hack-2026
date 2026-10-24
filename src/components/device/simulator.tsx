"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MascotArt } from "@/components/mascot/mascot-art";
import { isClassicLook, useFetchedMascot } from "@/components/mascot/mascot-context";
import type { Face, MascotConfig } from "@/lib/contracts";
import { OomiDevice, type DeviceMode, type TurnLog } from "@/lib/device/oomi-device";
import { DemoConsole } from "./demo-console";
import { Necklace } from "./necklace";
import { Backdrop, FaceStickers } from "./scene";

function Header({
  consoleOpen,
  onToggleConsole,
  mascot,
  name,
}: {
  consoleOpen: boolean;
  onToggleConsole: () => void;
  mascot: MascotConfig | null;
  name: string;
}) {
  const pill = "btn-chunky rounded-full bg-white px-3 py-1.5 font-display text-sm font-semibold text-navy-900 sm:px-4";
  return (
    <header className="relative z-10 mx-auto flex w-full max-w-[1400px] items-center gap-2 px-4 pt-4 sm:px-6">
      <Link href="/" className="mr-auto flex items-center gap-2 font-display text-2xl font-semibold tracking-tight text-navy-900">
        {mascot ? (
          <MascotArt config={mascot} face="idle" rounded className="h-10 w-10 rounded-2xl border-[2.5px] border-navy-900" />
        ) : (
          <Image src="/brand/oomi-mascot.png" alt="" width={40} height={40} className="h-10 w-10 rounded-2xl border-[2.5px] border-navy-900 bg-white" />
        )}
        oomi
        {name !== "Oomi" && (
          <span className="rounded-full border-2 border-navy-900 bg-sun-300 px-2.5 py-0.5 text-sm font-semibold -rotate-2">{name}</span>
        )}
      </Link>
      <Link href="/parent" className={pill}>
        Parent app
      </Link>
      <Link href="/kids" className={`${pill} hidden sm:inline-block`}>
        Oomi TV
      </Link>
      <button
        type="button"
        onClick={onToggleConsole}
        aria-pressed={consoleOpen}
        className={`${pill} cursor-pointer ${consoleOpen ? "bg-navy-900! text-cream-50!" : ""}`}
      >
        Console
      </button>
    </header>
  );
}

function Hint({ awake, name }: { awake: boolean; name: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, rotate: -2 }}
      animate={{ opacity: 1, y: 0, rotate: -2 }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
      className="flex items-center gap-2 rounded-2xl border-[2.5px] border-navy-900 bg-sun-300 px-4 py-2 font-display text-lg font-semibold text-navy-900 shadow-sticker sm:text-xl"
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 20 V5 M6 11 L12 5 L18 11" />
      </svg>
      {awake ? (
        <span>
          Hold the button or{" "}
          <kbd className="rounded-lg border-2 border-navy-900 bg-white px-2 py-0.5 font-display text-base shadow-[0_2px_0_0_var(--color-navy-900)]">Space</kbd>{" "}
          to talk
        </span>
      ) : (
        <span>Tap the button to wake {name}</span>
      )}
    </motion.div>
  );
}

/** Big captions under the necklace when the console is hidden, so the room can still read along. */
function Caption({ turn }: { turn?: TurnLog }) {
  if (!turn?.question) return null;
  return (
    <motion.div
      key={turn.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 w-full max-w-2xl rounded-3xl border-[2.5px] border-navy-900 bg-white/90 px-5 py-3 text-center shadow-sticker"
    >
      <p className="font-display text-xl font-medium text-navy-900">{turn.question}</p>
      {turn.answer && <p className="mt-1 line-clamp-3 text-base text-navy-700">{turn.answer}</p>}
    </motion.div>
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
  const [status, setStatus] = useState("Oomi is asleep");
  const [turns, setTurns] = useState<TurnLog[]>([]);
  const [talkedOnce, setTalkedOnce] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(true);

  const level = useCallback(() => deviceRef.current?.level() ?? 0, []);
  const mascotState = useFetchedMascot();
  const name = mascotState?.config.name ?? "Oomi";
  // The classic look keeps the hand-tuned coral render; any other look repaints the necklace.
  const custom = mascotState && !isClassicLook(mascotState.config) ? mascotState.config : null;

  const wake = useCallback(async (nextMode: DeviceMode): Promise<boolean> => {
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
      return device.awake;
    } catch (error) {
      console.error(error);
      setStatus("Oomi could not wake up. Check the connection and try again.");
      setFace("sleep");
      return false;
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
    setTalkedOnce(true);
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

  // Typed questions wake Oomi first, so the jury console works from a cold start.
  const ask = async (text: string) => {
    if (!awake && !(await wake(mode))) return;
    void deviceRef.current?.ask(text);
  };

  const night = awake && face === "sleep";
  const statusText = waking ? "Waking up…" : pressed ? (micOpen ? "I'm listening!" : "Getting ready…") : status.replace(/\bOomi\b/g, name);

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative flex min-h-dvh flex-col overflow-x-hidden text-navy-900">
        <Backdrop night={night} />
        <Header consoleOpen={consoleOpen} onToggleConsole={() => setConsoleOpen((open) => !open)} mascot={custom} name={name} />

        <main
          className={`relative z-10 mx-auto grid w-full max-w-[1400px] flex-1 content-start gap-6 px-4 pt-2 pb-10 sm:px-6 lg:items-start ${
            consoleOpen ? "lg:grid-cols-[minmax(0,1fr)_minmax(400px,460px)]" : ""
          }`}
        >
          <section className="flex flex-col items-center lg:min-h-[calc(100dvh-6rem)] lg:justify-center" aria-label="Oomi necklace simulator">
            <div
              className="relative"
              style={{
                width: consoleOpen ? "min(92vw, 640px, calc((100dvh - 230px) * 1.07))" : "min(92vw, 820px, calc((100dvh - 300px) * 1.07))",
                minWidth: "min(92vw, 300px)",
              }}
            >
              <FaceStickers face={face} />
              <Necklace
                face={face}
                micOpen={micOpen}
                pressed={pressed}
                micEnabled={micEnabled}
                level={level}
                onPress={press}
                onRelease={release}
                onToggleMic={() => setMicEnabled((value) => !value)}
                look={custom}
              />
            </div>

            <div className="mt-2 flex min-h-14 flex-col items-center">
              <AnimatePresence mode="wait">
                {!talkedOnce && !waking ? (
                  <Hint key={awake ? "talk" : "wake"} awake={awake} name={name} />
                ) : (
                  <motion.p
                    key={statusText}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="rounded-full bg-white/70 px-5 py-2 text-center font-display text-lg font-medium text-navy-800 backdrop-blur"
                  >
                    {statusText}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            {!consoleOpen && <Caption turn={turns[0]} />}
          </section>

          <AnimatePresence>
            {consoleOpen && (
              <DemoConsole
                key="console"
                mode={mode}
                awake={awake}
                busy={waking}
                turns={turns}
                onMode={switchMode}
                onAsk={(text) => void ask(text)}
                onCollapse={() => setConsoleOpen(false)}
              />
            )}
          </AnimatePresence>
        </main>
      </div>
    </MotionConfig>
  );
}
