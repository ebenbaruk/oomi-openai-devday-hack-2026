"use client";

import { AnimatePresence, motion, useAnimationFrame, useMotionValue } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import type { Explainer, KidVideo } from "@/lib/contracts";
import { ArrowIcon, PauseIcon, PlayIcon } from "./icons";
import { useExplainer } from "./kid-api";
import { MakingVideo } from "./making-video";
import { MissionScreen, OutroScreen } from "./mission-screens";
import { OomiBuddy } from "./oomi-buddy";
import { SWATCHES } from "./palette";
import { SceneStage } from "./scene-stage";
import { CloseButton, KidImage, RoundButton, SpeechBubble } from "./ui";
import { readingTimeMs, useVoice, type Voice } from "./use-voice";
import { useSpeech } from "./use-speech";

type Props = { video: KidVideo; childName: string; onClose: () => void };

export function ExplainerPlayer({ video, childName, onClose }: Props) {
  const state = useExplainer(video.discoveryId, video.video.id);

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-hidden bg-navy-900"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25 }}
    >
      {state.status === "ready" && state.data.status === "ready" && state.data.scenes.length > 0 ? (
        <Player explainer={state.data} childName={childName} onClose={onClose} />
      ) : (
        <>
          {state.status === "error" ? (
            <Oops onClose={onClose} />
          ) : state.status === "loading" && video.video.status === "ready" ? (
            <div className="bg-dots absolute inset-0 grid place-items-center bg-grape-100">
              <OomiBuddy face="thinking" className="size-32" />
            </div>
          ) : (
            <MakingVideo title={video.title} emoji={video.emoji} />
          )}
          <div className="absolute top-4 left-4 z-30 sm:top-6 sm:left-6">
            <CloseButton onClick={onClose} />
          </div>
        </>
      )}
    </motion.div>
  );
}

function Oops({ onClose }: { onClose: () => void }) {
  return (
    <div className="bg-dots absolute inset-0 flex flex-col items-center justify-center gap-6 bg-coral-100 px-6 text-center">
      <OomiBuddy face="curious" className="size-36" />
      <h2 className="font-display text-3xl font-bold sm:text-5xl">Oops! This video got lost.</h2>
      <button type="button" onClick={onClose} className="btn-chunky rounded-full bg-sun-300 px-8 py-4 font-display text-2xl font-bold">
        Back home
      </button>
    </div>
  );
}

type Phase = "cover" | "scenes" | "mission" | "outro";

/** Pause between two scenes, so the last words land before the wipe. */
const SCENE_BEAT_MS = 700;

const WIPE = {
  enter: (direction: number) => ({
    clipPath: direction >= 0 ? "circle(0% at 90% 88%)" : "circle(0% at 10% 88%)",
    zIndex: 2,
  }),
  center: (direction: number) => ({
    clipPath: direction >= 0 ? "circle(150% at 90% 88%)" : "circle(150% at 10% 88%)",
    zIndex: 2,
    transition: { duration: 0.8, ease: [0.65, 0, 0.35, 1] as const },
  }),
  exit: { zIndex: 1, scale: 0.94, transition: { duration: 0.8 } },
};

function Player({ explainer, childName, onClose }: { explainer: Explainer; childName: string; onClose: () => void }) {
  const voice = useVoice();
  const speech = useSpeech();
  const [phase, setPhase] = useState<Phase>("cover");
  const [step, setStep] = useState({ index: 0, direction: 1 });
  const [paused, setPaused] = useState(false);
  const [speakingPhase, setSpeakingPhase] = useState<Phase | null>(null);

  const { scenes, mission } = explainer;
  const scene = scenes[step.index];
  const missionLine = mission ? `Your mission: ${mission.title}! ${mission.steps.join(". ")}.` : "";
  const outroLine = `Now go try it for real, ${childName}!`;

  const goTo = useCallback(
    (index: number) => {
      if (index >= scenes.length) {
        setPhase(mission ? "mission" : "outro");
        return;
      }
      setStep((current) => ({ index: Math.max(0, index), direction: index >= current.index ? 1 : -1 }));
    },
    [scenes.length, mission],
  );

  // Each scene plays its narration and moves on by itself when it ends.
  useEffect(() => {
    if (phase !== "scenes") return;
    const current = scenes[step.index];
    let beat: ReturnType<typeof setTimeout> | undefined;
    voice.play(current.audioUrl, readingTimeMs(current.narration), () => {
      beat = setTimeout(() => goTo(step.index + 1), SCENE_BEAT_MS);
    });
    return () => clearTimeout(beat);
  }, [phase, step.index, scenes, voice, goTo]);

  // The mission and the goodbye are read aloud too.
  useEffect(() => {
    if (phase !== "mission" && phase !== "outro") return;
    let cancelled = false;
    voice.stop();
    void speech(phase === "mission" ? missionLine : outroLine).then((url) => {
      if (cancelled || !url) return;
      setSpeakingPhase(phase);
      voice.play(url, 0, () => setSpeakingPhase(null));
    });
    return () => {
      cancelled = true;
    };
  }, [phase, missionLine, outroLine, speech, voice]);

  const start = () => {
    voice.unlock();
    if (missionLine) void speech(missionLine);
    void speech(outroLine);
    setPhase("scenes");
  };

  const togglePause = useCallback(() => {
    if (paused) voice.resume();
    else voice.pause();
    setPaused(!paused);
  }, [paused, voice]);

  useEffect(() => {
    if (phase !== "scenes") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === " ") {
        event.preventDefault();
        togglePause();
      } else if (event.key === "ArrowRight") goTo(step.index + 1);
      else if (event.key === "ArrowLeft") goTo(step.index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, step.index, togglePause, goTo]);

  const close = () => {
    voice.stop();
    onClose();
  };

  return (
    <div className="absolute inset-0">
      <AnimatePresence initial={false} custom={step.direction}>
        <motion.div
          key={phase === "scenes" ? `scene-${step.index}` : phase}
          className="absolute inset-0"
          custom={step.direction}
          variants={WIPE}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {phase === "cover" && <Cover explainer={explainer} onStart={start} />}
          {phase === "scenes" && <SceneStage scene={scene} fallbackEmoji={explainer.emoji} paused={paused} />}
          {phase === "mission" && mission && (
            <MissionScreen
              mission={mission}
              level={voice.level}
              speaking={speakingPhase === "mission"}
              onReady={() => setPhase("outro")}
            />
          )}
          {phase === "outro" && (
            <OutroScreen name={childName} level={voice.level} speaking={speakingPhase === "outro"} onDone={close} />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center gap-4 p-4 sm:p-6">
        <div className="pointer-events-auto">
          <CloseButton onClick={close} />
        </div>
        {phase === "scenes" && (
          <SceneDots count={scenes.length} index={step.index} voice={voice} onPick={(index) => goTo(index)} />
        )}
      </div>

      {phase === "scenes" && (
        <>
          <div className="absolute inset-x-0 bottom-0 z-30 flex items-center justify-center gap-5 p-5 sm:gap-8 sm:p-7">
            <RoundButton label="Previous" onClick={() => goTo(step.index - 1)} disabled={step.index === 0} className="size-14 bg-cream-50 sm:size-16">
              <ArrowIcon direction="left" className="size-7 sm:size-8" />
            </RoundButton>
            <RoundButton label={paused ? "Play" : "Pause"} onClick={togglePause} className="size-20 bg-sun-300 sm:size-24">
              {paused ? <PlayIcon className="size-10 translate-x-0.5 sm:size-12" /> : <PauseIcon className="size-10 sm:size-12" />}
            </RoundButton>
            <RoundButton label="Next" onClick={() => goTo(step.index + 1)} className="size-14 bg-cream-50 sm:size-16">
              <ArrowIcon className="size-7 sm:size-8" />
            </RoundButton>
          </div>
          <div className="pointer-events-none absolute right-4 bottom-28 z-30 sm:right-8 sm:bottom-6">
            <OomiBuddy face={paused ? "idle" : "speaking"} level={voice.level} className="size-20 sm:size-28" />
          </div>
        </>
      )}
    </div>
  );
}

function Cover({ explainer, onStart }: { explainer: Explainer; onStart: () => void }) {
  const swatch = SWATCHES[explainer.scenes[0]?.color ?? "sky"];
  return (
    <button
      type="button"
      onClick={onStart}
      aria-label={`Play: ${explainer.title}`}
      className={`bg-dots absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 pt-16 pb-8 landscape:flex-row landscape:gap-14 landscape:px-14 ${swatch.bg}`}
    >
      <motion.div
        className="relative w-full max-w-sm landscape:w-[42%] landscape:max-w-none"
        initial={{ scale: 0.7, rotate: 8, opacity: 0 }}
        animate={{ scale: 1, rotate: 2, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
      >
        <div className="sticker-lg aspect-[4/3] overflow-hidden rounded-[2.25rem] bg-cream-50 p-3">
          <KidImage
            src={explainer.coverUrl ?? explainer.scenes[0]?.imageUrl ?? null}
            className={`size-full rounded-[1.6rem] border-[2.5px] border-navy-900 ${swatch.soft}`}
            fallback={<span className="text-9xl">{explainer.emoji}</span>}
          />
        </div>
        <span className="sticker absolute -top-6 -left-6 grid size-20 -rotate-12 place-items-center rounded-3xl bg-cream-50 text-5xl">
          {explainer.emoji}
        </span>
      </motion.div>

      <div className="flex flex-col items-center gap-6 text-center landscape:flex-1 landscape:items-start landscape:text-left">
        <h1 className="font-display text-[clamp(2.2rem,6vw,4.6rem)] leading-[1.04] font-bold tracking-tight text-navy-900">
          {explainer.title}
        </h1>
        <div className="flex items-center gap-5">
          <motion.span
            className="sticker-lg grid size-24 place-items-center rounded-full bg-mint-300 sm:size-32"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <PlayIcon className="size-12 translate-x-1 text-navy-900 sm:size-16" />
          </motion.span>
          <div className="hidden items-center gap-6 sm:flex">
            <OomiBuddy face="happy" className="size-20" />
            <SpeechBubble className="rotate-2">
              <p className="font-display text-2xl font-semibold">Ready? Tap!</p>
            </SpeechBubble>
          </div>
        </div>
      </div>
    </button>
  );
}

/** Progress made of scene dots; the current one fills up as the narration plays. */
function SceneDots({ count, index, voice, onPick }: { count: number; index: number; voice: Voice; onPick: (index: number) => void }) {
  const fill = useMotionValue(0);
  useAnimationFrame(() => fill.set(voice.progress()));

  return (
    <ol className="pointer-events-auto mx-auto flex items-center gap-2 rounded-full border-[2.5px] border-navy-900 bg-cream-50/90 px-3 py-2.5 sm:gap-3 sm:px-4">
      {Array.from({ length: count }, (_, dot) => (
        <li key={dot}>
          <button
            type="button"
            aria-label={`Scene ${dot + 1}`}
            aria-current={dot === index ? "step" : undefined}
            onClick={() => onPick(dot)}
            className={`relative block h-4 overflow-hidden rounded-full border-2 border-navy-900 transition-[width] duration-300 sm:h-5 ${dot === index ? "w-12 sm:w-16" : "w-4 sm:w-5"} ${dot < index ? "bg-navy-900" : "bg-cream-50"}`}
          >
            {dot === index && <motion.span className="absolute inset-0 origin-left bg-coral-400" style={{ scaleX: fill }} />}
          </button>
        </li>
      ))}
    </ol>
  );
}
