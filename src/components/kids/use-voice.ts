"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

/** Scene clips are pre-made; a long story track may be synthesized on first play, so callers can wait longer. */
const STALL_MS = 5000;

type Clip = {
  onEnd: () => void;
  /** Best guess of the clip length, used while a streamed track has no known duration yet. */
  estimateMs: number;
  /** Silent fallback when a clip has no audio (or it fails): a timer that can pause too. */
  timer: { total: number; remaining: number; startedAt: number; handle?: ReturnType<typeof setTimeout> } | null;
};

/**
 * One audio element for a whole player, routed through an analyser so Oomi's eyes can bounce with
 * the narration. Browsers only allow sound after a tap, so `unlock` must run inside a tap handler.
 */
export function useVoice() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const samplesRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const clipRef = useRef<Clip | null>(null);
  const pausedRef = useRef(false);

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = "auto";
      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  const unlock = useCallback(() => {
    const audio = ensureAudio();
    if (contextRef.current) {
      void contextRef.current.resume();
      return;
    }
    try {
      const context = new AudioContext();
      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      context.createMediaElementSource(audio).connect(analyser);
      analyser.connect(context.destination);
      contextRef.current = context;
      analyserRef.current = analyser;
      samplesRef.current = new Uint8Array(analyser.fftSize);
    } catch {
      // No Web Audio: narration still plays, the eyes just won't bounce.
    }
  }, [ensureAudio]);

  const clearTimer = () => {
    const timer = clipRef.current?.timer;
    if (timer?.handle) clearTimeout(timer.handle);
  };

  const finish = useCallback((clip: Clip) => {
    if (clipRef.current !== clip) return;
    clipRef.current = null;
    clip.onEnd();
  }, []);

  const runTimer = useCallback(
    (clip: Clip) => {
      const timer = clip.timer;
      if (!timer || pausedRef.current) return;
      timer.startedAt = performance.now();
      timer.handle = setTimeout(() => finish(clip), timer.remaining);
    },
    [finish],
  );

  const stop = useCallback(() => {
    clearTimer();
    clipRef.current = null;
    const audio = audioRef.current;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
    }
  }, []);

  /** Plays one clip and calls `onEnd` once, whether it had audio or only a silent timer. */
  const play = useCallback(
    (src: string | null, fallbackMs: number, onEnd: () => void, stallMs = STALL_MS) => {
      stop();
      const clip: Clip = { onEnd, estimateMs: fallbackMs, timer: null };
      clipRef.current = clip;
      const fallBack = () => {
        if (clipRef.current !== clip || clip.timer) return;
        clip.timer = { total: fallbackMs, remaining: fallbackMs, startedAt: 0 };
        runTimer(clip);
      };
      if (!src) {
        fallBack();
        return;
      }
      const audio = ensureAudio();
      audio.onended = () => finish(clip);
      audio.onerror = fallBack;
      audio.src = src;
      if (!pausedRef.current) audio.play().catch(fallBack);
      // A clip that never starts (stalled network, blocked output) must not freeze the video.
      setTimeout(() => {
        if (clipRef.current === clip && !pausedRef.current && audio.currentTime === 0) {
          audio.pause();
          fallBack();
        }
      }, stallMs);
    },
    [ensureAudio, finish, runTimer, stop],
  );

  const pause = useCallback(() => {
    if (pausedRef.current) return;
    pausedRef.current = true;
    const clip = clipRef.current;
    if (clip?.timer) {
      clearTimer();
      clip.timer.remaining = Math.max(0, clip.timer.remaining - (performance.now() - clip.timer.startedAt));
    } else {
      audioRef.current?.pause();
    }
  }, []);

  const resume = useCallback(() => {
    pausedRef.current = false;
    void contextRef.current?.resume();
    const clip = clipRef.current;
    if (clip?.timer) runTimer(clip);
    else if (clip) audioRef.current?.play().catch(() => undefined);
  }, [runTimer]);

  /** Loudness of the current narration, 0..1. */
  const level = useCallback(() => {
    const clip = clipRef.current;
    if (!clip || pausedRef.current) return 0;
    if (clip.timer) return 0.25 + 0.2 * Math.sin(performance.now() / 120);
    const analyser = analyserRef.current;
    const samples = samplesRef.current;
    if (!analyser || !samples) return 0.3;
    analyser.getByteTimeDomainData(samples);
    let sum = 0;
    for (const sample of samples) sum += ((sample - 128) / 128) ** 2;
    return Math.min(1, Math.sqrt(sum / samples.length) * 4);
  }, []);

  /** How far into the current clip we are, 0..1. */
  const progress = useCallback(() => {
    const clip = clipRef.current;
    if (!clip) return 0;
    if (clip.timer) {
      const running = pausedRef.current ? 0 : performance.now() - clip.timer.startedAt;
      return Math.min(1, (clip.timer.total - clip.timer.remaining + running) / clip.timer.total);
    }
    const audio = audioRef.current;
    if (!audio) return 0;
    if (Number.isFinite(audio.duration) && audio.duration > 0) return audio.currentTime / audio.duration;
    return Math.min(0.99, (audio.currentTime * 1000) / clip.estimateMs);
  }, []);

  const element = useCallback(() => audioRef.current, []);

  useEffect(
    () => () => {
      stop();
      void contextRef.current?.close();
    },
    [stop],
  );

  return useMemo(
    () => ({ unlock, play, pause, resume, stop, level, progress, element }),
    [unlock, play, pause, resume, stop, level, progress, element],
  );
}

export type Voice = ReturnType<typeof useVoice>;

/** Rough reading time when a scene has no audio: ~2.6 words per second, never too short. */
export function readingTimeMs(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(3500, Math.round((words / 2.6) * 1000) + 800);
}
