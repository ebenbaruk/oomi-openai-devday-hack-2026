"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Oomi's short spoken lines outside the scenes (the mission, the goodbye), so a child who can't
 * read yet still hears them. Each line is fetched once and kept as a local audio URL.
 */
export function useSpeech() {
  const cache = useRef(new Map<string, Promise<string | null>>());

  useEffect(() => {
    const lines = cache.current;
    return () => {
      for (const url of lines.values()) void url.then((value) => value && URL.revokeObjectURL(value));
      lines.clear();
    };
  }, []);

  return useCallback((text: string) => {
    let line = cache.current.get(text);
    if (!line) {
      line = fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, style: "playful" }),
      })
        .then((response) => (response.ok ? response.blob() : null))
        .then((blob) => (blob ? URL.createObjectURL(blob) : null))
        .catch(() => null);
      cache.current.set(text, line);
    }
    return line;
  }, []);
}
