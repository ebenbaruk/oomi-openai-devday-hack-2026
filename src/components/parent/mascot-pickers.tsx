"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { contrast, MIN_BODY_CONTRAST, paletteOf, PALETTES } from "@/components/mascot/colors";
import { MascotArt } from "@/components/mascot/mascot-art";
import { SPECIES } from "@/components/mascot/species";
import {
  MASCOT_ACCESSORIES,
  MASCOT_EYES,
  MASCOT_MOUTHS,
  MASCOT_PERSONALITIES,
  MASCOT_SPECIES,
  MASCOT_VOICES,
  type Language,
  type MascotConfig,
} from "@/lib/contracts";

type Update = <K extends keyof MascotConfig>(key: K, value: MascotConfig[K]) => void;
type PickerProps = { draft: MascotConfig; update: Update };

// ---------- Building blocks ----------

export function StudioSection({ id, title, hint, children }: { id: string; title: string; hint?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-[2rem] bg-white p-5 shadow-card ring-1 ring-cream-200 sm:p-6">
      <h2 id={id} className="font-display text-xl font-semibold text-navy-900">
        {title}
      </h2>
      {hint && <p className="mt-0.5 text-sm text-navy-600">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** A big tappable choice: a radio under the hood, a tile on screen. */
function Choice({
  name,
  checked,
  onSelect,
  label,
  children,
  className = "",
}: {
  name: string;
  checked: boolean;
  onSelect: () => void;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label
      className={`relative block cursor-pointer rounded-2xl transition-[box-shadow,transform] has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-sky-400 ${
        checked ? "ring-3 ring-coral-500 ring-offset-2 ring-offset-white" : "ring-1 ring-cream-200 hover:-translate-y-0.5 hover:ring-coral-200"
      } ${className}`}
    >
      <input type="radio" name={name} checked={checked} onChange={onSelect} aria-label={label} className="sr-only" />
      {children}
    </label>
  );
}

// ---------- Character ----------

export function SpeciesPicker({ draft, update }: PickerProps) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-6">
      {MASCOT_SPECIES.map((species) => (
        <Choice key={species} name="species" checked={draft.species === species} onSelect={() => update("species", species)} label={SPECIES[species].label}>
          <MascotArt config={{ ...draft, species, accessory: "none" }} rounded className="w-full rounded-2xl" />
          <span className="block pt-1.5 pb-1 text-center text-xs font-bold text-navy-700">{SPECIES[species].label}</span>
        </Choice>
      ))}
    </div>
  );
}

// ---------- Colors ----------

export function ColorPicker({ draft, update, setColors }: PickerProps & { setColors: (body: string, accent: string, background: string) => void }) {
  const current = paletteOf(draft);
  const lowContrast = contrast(draft.bodyColor, draft.backgroundColor) < MIN_BODY_CONTRAST;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {PALETTES.map((palette) => (
          <Choice
            key={palette.id}
            name="palette"
            checked={current?.id === palette.id}
            onSelect={() => setColors(palette.body, palette.accent, palette.background)}
            label={palette.name}
            className="p-2"
          >
            <span className="flex items-center gap-2.5">
              <span className="relative grid size-11 shrink-0 place-items-end overflow-hidden rounded-xl" style={{ background: palette.background }}>
                <span className="absolute -right-1.5 -bottom-2 size-8 rounded-full" style={{ background: palette.body }} />
                <span className="absolute right-5 bottom-1.5 size-3 rounded-full" style={{ background: palette.accent }} />
              </span>
              <span className="min-w-0 text-sm leading-tight font-bold text-navy-800">{palette.name}</span>
            </span>
          </Choice>
        ))}
      </div>

      <div>
        <p className="mb-2 text-sm font-bold text-navy-700">Or mix your own</p>
        <div className="grid grid-cols-3 gap-2">
          <ColorInput label="Body" value={draft.bodyColor} onChange={(value) => update("bodyColor", value)} />
          <ColorInput label="Accent" value={draft.accentColor} onChange={(value) => update("accentColor", value)} />
          <ColorInput label="Background" value={draft.backgroundColor} onChange={(value) => update("backgroundColor", value)} />
        </div>
        {lowContrast && (
          <p role="status" className="mt-3 rounded-2xl bg-sun-100 px-4 py-2.5 text-sm font-semibold text-navy-800 ring-1 ring-sun-300">
            The body and the background are very close: {draft.name} may be hard to see. Try a darker or lighter background.
          </p>
        )}
      </div>
    </div>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl bg-cream-100 p-2 text-center has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-sky-400 sm:flex-row sm:gap-2 sm:text-left">
      <span className="relative size-9 shrink-0 overflow-hidden rounded-xl ring-2 ring-white" style={{ background: value }}>
        <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-bold text-navy-800">{label}</span>
        <span className="block font-mono text-[0.7rem] text-navy-500 uppercase">{value}</span>
      </span>
    </label>
  );
}

// ---------- Face ----------

const EYE_LABELS: Record<MascotConfig["eyes"], string> = { round: "Round", dots: "Dots", ovals: "Ovals", sleepy: "Sleepy", sparkle: "Sparkle" };
const MOUTH_LABELS: Record<MascotConfig["mouth"], string> = { none: "None", smile: "Smile", open: "Open", cat: "Cat" };

export function FacePicker({ draft, update }: PickerProps) {
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-bold text-navy-700">Eyes</p>
        <div className="grid grid-cols-5 gap-2">
          {MASCOT_EYES.map((eyes) => (
            <Choice key={eyes} name="eyes" checked={draft.eyes === eyes} onSelect={() => update("eyes", eyes)} label={EYE_LABELS[eyes]}>
              <FaceCrop config={{ ...draft, eyes }} />
              <span className="block pb-1 text-center text-xs font-bold text-navy-700">{EYE_LABELS[eyes]}</span>
            </Choice>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-bold text-navy-700">Mouth</p>
        <div className="grid grid-cols-4 gap-2">
          {MASCOT_MOUTHS.map((mouth) => (
            <Choice key={mouth} name="mouth" checked={draft.mouth === mouth} onSelect={() => update("mouth", mouth)} label={MOUTH_LABELS[mouth]}>
              <FaceCrop config={{ ...draft, mouth }} />
              <span className="block pb-1 text-center text-xs font-bold text-navy-700">{MOUTH_LABELS[mouth]}</span>
            </Choice>
          ))}
        </div>
      </div>
      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-cream-100 px-4 py-3">
        <span>
          <span className="block font-bold text-navy-900">Rosy cheeks</span>
          <span className="block text-sm text-navy-600">A soft blush, always on.</span>
        </span>
        <input
          type="checkbox"
          checked={draft.cheeks}
          onChange={(event) => update("cheeks", event.target.checked)}
          className="size-6 shrink-0 cursor-pointer accent-coral-500"
        />
      </label>
    </div>
  );
}

/** Zooms on the face so eye and mouth choices are easy to compare. */
function FaceCrop({ config }: { config: MascotConfig }) {
  return (
    <span className="block overflow-hidden rounded-t-2xl" style={{ background: config.backgroundColor }}>
      <MascotArt config={{ ...config, accessory: "none" }} bare focus="face" className="aspect-[4/3] w-full" />
    </span>
  );
}

// ---------- Accessory & corner ----------

const ACCESSORY_LABELS: Record<MascotConfig["accessory"], string> = {
  none: "None",
  scarf: "Scarf",
  cap: "Cap",
  bow: "Bow",
  headphones: "Headset",
  leaf: "Leaf",
  crown: "Crown",
  glasses: "Glasses",
};

export function AccessoryPicker({ draft, update }: PickerProps) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3">
      {MASCOT_ACCESSORIES.map((accessory) => (
        <Choice
          key={accessory}
          name="accessory"
          checked={draft.accessory === accessory}
          onSelect={() => update("accessory", accessory)}
          label={ACCESSORY_LABELS[accessory]}
        >
          <MascotArt config={{ ...draft, accessory }} rounded className="w-full rounded-2xl" />
          <span className="block truncate px-1 pt-1.5 pb-1 text-center text-xs font-bold text-navy-700">{ACCESSORY_LABELS[accessory]}</span>
        </Choice>
      ))}
    </div>
  );
}

export function CornerPicker({ draft, update }: PickerProps) {
  return (
    <div className="grid max-w-xs grid-cols-2 gap-3">
      {(["left", "right"] as const).map((corner) => (
        <Choice key={corner} name="corner" checked={draft.corner === corner} onSelect={() => update("corner", corner)} label={`Peeks from the ${corner}`}>
          <MascotArt config={{ ...draft, corner }} rounded className="w-full rounded-2xl" />
          <span className="block pt-1.5 pb-1 text-center text-xs font-bold text-navy-700">{corner === "left" ? "From the left" : "From the right"}</span>
        </Choice>
      ))}
    </div>
  );
}

// ---------- Name & personality ----------

export function NameInput({ draft, update }: PickerProps) {
  return (
    <div>
      <input
        value={draft.name}
        maxLength={20}
        autoComplete="off"
        aria-label="Name"
        placeholder="Oomi"
        onChange={(event) => update("name", event.target.value)}
        className="w-full rounded-2xl border-2 border-cream-200 bg-cream-50 px-4 py-3 font-display text-2xl font-semibold text-navy-900 transition-colors outline-none focus:border-coral-400"
      />
      <p className="mt-1.5 text-xs text-navy-500">Your child will call it by this name, and it will introduce itself with it.</p>
    </div>
  );
}

const PERSONALITIES: Record<MascotConfig["personality"], { label: string; text: string; emoji: string }> = {
  playful: { label: "Playful", text: "Bouncy, warm and full of little games.", emoji: "🎈" },
  calm: { label: "Calm", text: "Slow, soft and reassuring. Great before bed.", emoji: "🌙" },
  silly: { label: "Silly", text: "Giggles, funny words and gentle jokes.", emoji: "🤪" },
  curious: { label: "Curious", text: "Asks lots of “what if?” questions back.", emoji: "🔍" },
};

export function PersonalityPicker({ draft, update }: PickerProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {MASCOT_PERSONALITIES.map((personality) => {
        const item = PERSONALITIES[personality];
        return (
          <Choice
            key={personality}
            name="personality"
            checked={draft.personality === personality}
            onSelect={() => update("personality", personality)}
            label={item.label}
            className="px-4 py-3"
          >
            <span className="flex items-start gap-3">
              <span aria-hidden className="text-2xl">
                {item.emoji}
              </span>
              <span>
                <span className="block font-display text-lg leading-tight font-semibold text-navy-900">{item.label}</span>
                <span className="block text-sm leading-snug text-navy-600">{item.text}</span>
              </span>
            </span>
          </Choice>
        );
      })}
    </div>
  );
}

// ---------- Voice ----------

const VOICES: Record<MascotConfig["voice"], string> = {
  marin: "Bright and warm",
  cedar: "Deep and steady",
  coral: "Cheerful",
  sage: "Gentle and wise",
  shimmer: "Soft and airy",
  ballad: "Storyteller",
  verse: "Lively",
  alloy: "Clear and even",
  ash: "Cozy and low",
  echo: "Friendly and smooth",
};

function greeting(language: Language, child: string, name: string): string {
  return language === "fr"
    ? `Salut ${child} ! Moi, c'est ${name}. On part explorer quelque chose aujourd'hui ?`
    : `Hi ${child}! I'm ${name}. Want to explore something today?`;
}

type Preview = { voice: MascotConfig["voice"]; state: "loading" | "playing" } | null;

export function VoicePicker({ draft, update, childName, language }: PickerProps & { childName: string; language: Language }) {
  const [preview, setPreview] = useState<Preview>(null);
  const [error, setError] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const urls = useRef(new Map<string, string>());

  useEffect(() => {
    const cache = urls.current;
    return () => {
      audio.current?.pause();
      cache.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const play = async (voice: MascotConfig["voice"]) => {
    audio.current?.pause();
    if (preview?.voice === voice && preview.state === "playing") {
      setPreview(null);
      return;
    }
    setError(false);
    const text = greeting(language, childName, draft.name.trim() || "Oomi");
    const key = `${voice}|${text}`;
    setPreview({ voice, state: "loading" });
    try {
      let url = urls.current.get(key);
      if (!url) {
        const response = await fetch("/api/speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, style: "playful", language, voice }),
        });
        if (!response.ok) throw new Error(`Speech failed (${response.status})`);
        url = URL.createObjectURL(await response.blob());
        urls.current.set(key, url);
      }
      const player = new Audio(url);
      audio.current = player;
      player.onended = () => setPreview((current) => (current?.voice === voice ? null : current));
      await player.play();
      setPreview({ voice, state: "playing" });
    } catch {
      setPreview(null);
      setError(true);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {MASCOT_VOICES.map((voice) => {
          const selected = draft.voice === voice;
          const busy = preview?.voice === voice;
          return (
            <div
              key={voice}
              className={`flex items-center gap-2 rounded-2xl p-1.5 pl-2 transition-colors ${
                selected ? "bg-coral-50 ring-2 ring-coral-400" : "bg-cream-100 ring-1 ring-transparent hover:ring-cream-200"
              }`}
            >
              <button
                type="button"
                onClick={() => void play(voice)}
                aria-label={busy && preview.state === "playing" ? `Stop ${voice}` : `Listen to ${voice}`}
                className={`grid size-10 shrink-0 place-items-center rounded-full text-white shadow-sm transition-colors ${
                  busy ? "bg-navy-900" : "bg-coral-500 hover:bg-coral-600"
                }`}
              >
                {busy && preview.state === "loading" ? (
                  <motion.span
                    aria-hidden
                    className="size-4 rounded-full border-2 border-white border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                ) : busy ? (
                  <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="2.5" />
                  </svg>
                ) : (
                  <svg aria-hidden viewBox="0 0 24 24" className="ml-0.5 size-4" fill="currentColor">
                    <path d="M8 5.5v13a1 1 0 0 0 1.5.9l10.4-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5z" />
                  </svg>
                )}
              </button>
              <label className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 py-1 pr-2">
                <span className="min-w-0">
                  <span className="block font-bold text-navy-900 capitalize">{voice}</span>
                  <span className="block truncate text-xs text-navy-600">{VOICES[voice]}</span>
                </span>
                <input
                  type="radio"
                  name="voice"
                  checked={selected}
                  onChange={() => update("voice", voice)}
                  className="size-5 shrink-0 cursor-pointer accent-coral-500"
                />
              </label>
            </div>
          );
        })}
      </div>
      <p aria-live="polite" className="mt-2 text-xs text-navy-500">
        {error ? "Couldn't play that voice. Please try again." : `Tap ▶ to hear ${draft.name.trim() || "Oomi"} say hi to ${childName}.`}
      </p>
    </div>
  );
}
