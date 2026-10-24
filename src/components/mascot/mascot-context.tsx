"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DEFAULT_MASCOT, type MascotConfig, type MascotState } from "@/lib/contracts";

export const DEFAULT_MASCOT_STATE: MascotState = { config: DEFAULT_MASCOT, portraitUrl: null, portraits: [] };

const MascotContext = createContext<MascotState | null>(null);

/** Shares the family's mascot with every Oomi drawing below it (pebbles, buddies, avatars). */
export function MascotProvider({ value, children }: { value: MascotState | null | undefined; children: ReactNode }) {
  return <MascotContext.Provider value={value ?? null}>{children}</MascotContext.Provider>;
}

/** The family's mascot, or null outside a provider (then the classic Oomi is drawn). */
export function useMascot(): MascotState | null {
  return useContext(MascotContext);
}

const LOOK_KEYS = ["species", "bodyColor", "accentColor", "backgroundColor", "eyes", "mouth", "cheeks", "accessory"] as const;

/** True when the mascot still looks like the brand's coral pebble, so the hand-made classic drawings are kept. */
export function isClassicLook(config: MascotConfig): boolean {
  return LOOK_KEYS.every((key) => String(config[key]).toLowerCase() === String(DEFAULT_MASCOT[key]).toLowerCase());
}

/** Loads the mascot once, for pages that don't receive it from a bigger payload (the necklace simulator). */
export function useFetchedMascot(): MascotState | null {
  const [state, setState] = useState<MascotState | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/mascot", { cache: "no-store" })
      .then((response) => (response.ok ? (response.json() as Promise<MascotState>) : null))
      .then((value) => !cancelled && value && setState(value))
      // The classic Oomi is a fine fallback: the necklace must keep working offline.
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
}
