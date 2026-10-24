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
export async function callApi<T = unknown>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  if (response.status === 401) {
    reloadThroughGate();
    throw new Error("locked");
  }
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  const body = await response.text();
  return (body ? JSON.parse(body) : undefined) as T;
}

/**
 * Fills fields an older server may not send yet, so the UI can rely on the contract shape.
 * The journal crosses the network, so this is the one place we trust nothing.
 */
export function normalizeJournal(raw: Journal): Journal {
  const partial = raw as Partial<Journal> & Pick<Journal, "child" | "settings">;
  return {
    ...raw,
    settings: { ...raw.settings, videosEnabled: raw.settings.videosEnabled ?? true },
    today: partial.today ?? { questions: 0, activities: 0, topics: 0 },
    digest: partial.digest ?? { headline: "", text: "" },
    week: partial.week ?? [],
    weekTotals: partial.weekTotals ?? { questions: 0, answered: 0, grownUp: 0, declined: 0, activitiesDone: 0 },
    discoveries: (partial.discoveries ?? []).map(withCardDefaults),
    grownUp: (partial.grownUp ?? []).map(withCardDefaults),
    declinedToday: partial.declinedToday ?? 0,
    alerts: partial.alerts ?? [],
    memory: partial.memory ?? [],
    stories: (partial.stories ?? []).map((story) => ({ ...story, audioUrl: story.audioUrl ?? "" })),
  };
}

function withCardDefaults(card: Journal["discoveries"][number]): Journal["discoveries"][number] {
  return {
    ...card,
    intent: card.intent ?? "question",
    doneAt: card.doneAt ?? null,
    video: card.video ?? { id: null, status: "none" },
  };
}

/**
 * Keeps the journal fresh while the page is visible, so cards appear live during the demo.
 * Polls that started before or during a local edit are dropped so they cannot resurrect deleted items.
 */
export function useJournal(initial: Journal) {
  const [journal, setJournal] = useState(() => normalizeJournal(initial));
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
      const next = normalizeJournal((await response.json()) as Journal);
      if (version.current === startedAt && mutationsInFlight.current === 0) setJournal(next);
      setSync("live");
    } catch {
      setSync("offline");
    }
  }, []);

  const mutate = useCallback(
    async (optimistic: (current: Journal) => Journal, request: () => Promise<unknown>) => {
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
