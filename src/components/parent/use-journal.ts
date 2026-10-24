"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Journal } from "@/lib/contracts";

const POLL_INTERVAL_MS = 5000;

export type SyncState = "live" | "offline";

/** The access cookie expired: reloading lets the proxy send the parent through the unlock page. */
function reloadThroughGate(): void {
  window.location.reload();
}

/** Sends a same-origin API call and throws on any non-2xx so callers can show feedback. */
export async function callApi(input: string, init?: RequestInit): Promise<void> {
  const response = await fetch(input, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  if (response.status === 401) {
    reloadThroughGate();
    throw new Error("locked");
  }
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
}

/**
 * Keeps the journal fresh while the page is visible, so cards appear live during the demo.
 * Polls that started before or during a local edit are dropped so they cannot resurrect deleted items.
 */
export function useJournal(initial: Journal) {
  const [journal, setJournal] = useState(initial);
  const [sync, setSync] = useState<SyncState>("live");
  const version = useRef(0);
  const mutationsInFlight = useRef(0);

  const refresh = useCallback(async () => {
    const startedAt = version.current;
    try {
      const response = await fetch("/api/journal", { cache: "no-store" });
      if (response.status === 401) {
        reloadThroughGate();
        return;
      }
      if (!response.ok) throw new Error(`Journal failed (${response.status})`);
      const next = (await response.json()) as Journal;
      if (version.current === startedAt && mutationsInFlight.current === 0) setJournal(next);
      setSync("live");
    } catch {
      setSync("offline");
    }
  }, []);

  const mutate = useCallback(
    async (optimistic: (current: Journal) => Journal, request: () => Promise<void>) => {
      version.current += 1;
      mutationsInFlight.current += 1;
      setJournal(optimistic);
      try {
        await request();
      } finally {
        mutationsInFlight.current -= 1;
        await refresh();
      }
    },
    [refresh],
  );

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      if (timer) return;
      timer = setInterval(refresh, POLL_INTERVAL_MS);
    };
    const stop = () => {
      clearInterval(timer);
      timer = undefined;
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void refresh();
        start();
      } else {
        stop();
      }
    };

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh]);

  return { journal, sync, refresh, mutate };
}
