"use client";

import { useCallback, useEffect, useState } from "react";
import type { Explainer, KidLibrary } from "@/lib/contracts";

const POLL_MS = 2500;
const LIBRARY_POLL_MS = 10_000;

class LockedError extends Error {}

/** Same-origin JSON call. A 401 means the access cookie expired: reload through the unlock page. */
async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (response.status === 401) {
    window.location.reload();
    throw new LockedError("locked");
  }
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return (await response.json()) as T;
}

function fetchLibrary(): Promise<KidLibrary> {
  return requestJson<KidLibrary>("/api/kids");
}

function createExplainer(discoveryId: string): Promise<Explainer> {
  return requestJson<Explainer>("/api/explainers", { method: "POST", body: JSON.stringify({ discoveryId }) });
}

function fetchExplainer(id: string): Promise<Explainer> {
  return requestJson<Explainer>(`/api/explainers/${id}`);
}

type Load<T> = { status: "loading" } | { status: "error" } | { status: "ready"; data: T };

export function useKidLibrary() {
  const [state, setState] = useState<Load<KidLibrary>>({ status: "loading" });

  const refresh = useCallback(async () => {
    try {
      const data = await fetchLibrary();
      setState({ status: "ready", data });
    } catch (error) {
      if (!(error instanceof LockedError)) setState((current) => (current.status === "ready" ? current : { status: "error" }));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchLibrary()
      .then((data) => !cancelled && setState({ status: "ready", data }))
      .catch((error: unknown) => !cancelled && !(error instanceof LockedError) && setState({ status: "error" }));
    // New videos keep arriving while the tablet sits on the home screen.
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, LIBRARY_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [refresh]);

  return { state, refresh };
}

/**
 * Loads an explainer, asking the server to make it first when the discovery has none yet,
 * then polls while it is still being generated.
 */
export function useExplainer(discoveryId: string, videoId: string | null) {
  const [state, setState] = useState<Load<Explainer>>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const settle = (explainer: Explainer) => {
      if (cancelled) return;
      setState({ status: "ready", data: explainer });
      if (explainer.status === "pending") timer = setTimeout(() => void poll(explainer.id), POLL_MS);
    };
    const fail = (error: unknown) => {
      if (!cancelled && !(error instanceof LockedError)) setState({ status: "error" });
    };
    const poll = (id: string) => fetchExplainer(id).then(settle, fail);

    if (videoId) void poll(videoId);
    else createExplainer(discoveryId).then(settle, fail);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [discoveryId, videoId]);

  return state;
}
