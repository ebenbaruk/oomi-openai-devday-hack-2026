"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { PALETTES } from "@/components/mascot/colors";
import { MascotArt } from "@/components/mascot/mascot-art";
import { NecklacePreview } from "@/components/mascot/necklace-preview";
import { SPECIES } from "@/components/mascot/species";
import {
  DEFAULT_MASCOT,
  MASCOT_ACCESSORIES,
  MASCOT_EYES,
  MASCOT_MOUTHS,
  MASCOT_SPECIES,
  MascotConfig,
  type Face,
  type Journal,
  type MascotPortrait,
  type MascotState,
} from "@/lib/contracts";
import {
  AccessoryPicker,
  ColorPicker,
  CornerPicker,
  FacePicker,
  NameInput,
  PersonalityPicker,
  SpeciesPicker,
  StudioSection,
  VoicePicker,
} from "./mascot-pickers";
import { PortraitStudio } from "./mascot-portraits";
import { callApi } from "./use-journal";

type SaveState = "idle" | "saving" | "saved" | "error";

const EXPRESSIONS: { face: Face; label: string }[] = [
  { face: "idle", label: "Hello" },
  { face: "listening", label: "Listening" },
  { face: "thinking", label: "Thinking" },
  { face: "speaking", label: "Talking" },
  { face: "happy", label: "Happy" },
  { face: "curious", label: "Curious" },
  { face: "sleep", label: "Asleep" },
];
const CYCLE_MS = 1600;

const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

/** A random but harmonious look: a curated palette, never a random color soup. Name, voice and personality stay. */
function surprise(current: MascotConfig): MascotConfig {
  const palette = pick(PALETTES.filter((entry) => entry.body !== current.bodyColor));
  return {
    ...current,
    species: pick(MASCOT_SPECIES.filter((species) => species !== current.species)),
    bodyColor: palette.body,
    accentColor: palette.accent,
    backgroundColor: palette.background,
    eyes: pick(MASCOT_EYES),
    mouth: pick(MASCOT_MOUTHS),
    cheeks: Math.random() < 0.5,
    accessory: Math.random() < 0.4 ? "none" : pick(MASCOT_ACCESSORIES),
    corner: Math.random() < 0.5 ? "left" : "right",
  };
}

const sameConfig = (a: MascotConfig, b: MascotConfig) => JSON.stringify(a) === JSON.stringify(b);

export function MascotStudio({ journal, onBack, onSaved }: { journal: Journal; onBack: () => void; onSaved: () => Promise<void> }) {
  const [saved, setSaved] = useState<MascotState>(journal.mascot);
  const [draft, setDraft] = useState<MascotConfig>(journal.mascot.config);
  const [save, setSave] = useState<SaveState>("idle");
  const dirty = !sameConfig(draft, saved.config);
  const childName = journal.child.firstName;

  const update = <K extends keyof MascotConfig>(key: K, value: MascotConfig[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setSave("idle");
  };
  const setColors = (bodyColor: string, accentColor: string, backgroundColor: string) => {
    setDraft((current) => ({ ...current, bodyColor, accentColor, backgroundColor }));
    setSave("idle");
  };

  // Leaving with unsaved changes asks first, like any editor.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const persist = async (config: MascotConfig): Promise<MascotState> => {
    const next = await callApi<MascotState>("/api/mascot", { method: "PUT", body: JSON.stringify(config) });
    setSaved(next);
    void onSaved();
    return next;
  };

  const submit = async () => {
    const parsed = MascotConfig.safeParse({ ...draft, name: draft.name.trim() || "Oomi" });
    if (!parsed.success) {
      setSave("error");
      return;
    }
    setSave("saving");
    try {
      const next = await persist(parsed.data);
      setDraft(next.config);
      setSave("saved");
    } catch {
      setSave("error");
    }
  };

  const reload = async () => {
    const next = await callApi<MascotState>("/api/mascot");
    setSaved(next);
    void onSaved();
  };

  const paint = async () => {
    const config = MascotConfig.parse({ ...draft, name: draft.name.trim() || "Oomi" });
    const portrait = await callApi<MascotPortrait>("/api/mascot/portraits", { method: "POST", body: JSON.stringify({ config }) });
    setSaved((current) => ({ ...current, portraits: [portrait, ...current.portraits.filter((entry) => entry.id !== portrait.id)] }));
  };

  // The avatar is saved right away, on top of the last saved look, so pending edits stay pending.
  const chooseAvatar = async (portrait: MascotPortrait | null) => {
    const portraitId = portrait?.id ?? null;
    await persist({ ...saved.config, portraitId });
    setDraft((current) => ({ ...current, portraitId }));
  };

  const deletePortrait = async (portrait: MascotPortrait) => {
    await callApi(`/api/mascot/portraits/${portrait.id}`, { method: "DELETE" });
    if (draft.portraitId === portrait.id) setDraft((current) => ({ ...current, portraitId: null }));
    await reload();
  };

  const avatarUrl = saved.portraits.find((portrait) => portrait.id === draft.portraitId)?.imageUrl ?? null;
  const name = draft.name.trim() || "Oomi";

  return (
    <div className="pb-24">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-2 flex items-center gap-1 rounded-full text-sm font-bold text-navy-600 transition-colors hover:text-coral-600"
          >
            <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
            Settings
          </button>
          <p className="mb-1 text-xs font-extrabold tracking-[0.14em] text-coral-600 uppercase">Mascot studio</p>
          <h1 className="font-display text-3xl leading-tight font-semibold tracking-tight text-navy-900 sm:text-4xl">
            Make {name} {childName}&apos;s own
          </h1>
          <p className="mt-1 text-[0.95rem] text-navy-600">Pick a character, colors, a face and a voice. It shows up everywhere: necklace, Oomi TV and here.</p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:items-start lg:gap-8">
        <aside className="lg:sticky lg:top-24">
          <PreviewPanel
            draft={draft}
            name={name}
            childName={childName}
            avatarUrl={avatarUrl}
            onSurprise={() => {
              setDraft(surprise);
              setSave("idle");
            }}
            onReset={() => {
              setDraft({ ...DEFAULT_MASCOT, portraitId: null });
              setSave("idle");
            }}
          />
        </aside>

        <div className="min-w-0 space-y-6">
          <StudioSection id="studio-character" title="Character" hint="Twelve little friends, each one simple enough to read at a glance.">
            <SpeciesPicker draft={draft} update={update} />
          </StudioSection>
          <StudioSection id="studio-colors" title="Colors" hint="Two colors for the character, one for its background.">
            <ColorPicker draft={draft} update={update} setColors={setColors} />
          </StudioSection>
          <StudioSection id="studio-face" title="Face" hint="Two simple eyes and, if you like, a tiny mouth.">
            <FacePicker draft={draft} update={update} />
          </StudioSection>
          <StudioSection id="studio-accessory" title="Accessory" hint="One little extra, or none at all.">
            <AccessoryPicker draft={draft} update={update} />
          </StudioSection>
          <div className="grid gap-6 xl:grid-cols-2">
            <StudioSection id="studio-name" title="Name">
              <NameInput draft={draft} update={update} />
            </StudioSection>
            <StudioSection id="studio-corner" title="Corner" hint="Which side it peeks from on its tile.">
              <CornerPicker draft={draft} update={update} />
            </StudioSection>
          </div>
          <StudioSection id="studio-personality" title="Personality" hint="How it talks, tells stories and explains.">
            <PersonalityPicker draft={draft} update={update} />
          </StudioSection>
          <StudioSection id="studio-voice" title="Voice" hint={`Used for live chats, bedtime stories and Oomi TV.`}>
            <VoicePicker draft={draft} update={update} childName={childName} language={journal.child.language} />
          </StudioSection>
          <StudioSection id="studio-portrait" title="Paint with AI">
            <PortraitStudio
              draft={draft}
              portraits={saved.portraits}
              avatarId={saved.config.portraitId}
              onPaint={paint}
              onUse={chooseAvatar}
              onDelete={deletePortrait}
            />
          </StudioSection>
        </div>
      </div>

      <SaveBar draft={draft} dirty={dirty} save={save} name={name} onSave={() => void submit()} />
    </div>
  );
}

// ---------- Preview ----------

function PreviewPanel({
  draft,
  name,
  childName,
  avatarUrl,
  onSurprise,
  onReset,
}: {
  draft: MascotConfig;
  name: string;
  childName: string;
  avatarUrl: string | null;
  onSurprise: () => void;
  onReset: () => void;
}) {
  const [chosen, setChosen] = useState<Face | null>(null);
  const [hovering, setHovering] = useState(false);
  const [tick, setTick] = useState(0);

  // Hovering the big preview plays through every expression.
  useEffect(() => {
    if (!hovering) return;
    const timer = setInterval(() => setTick((value) => value + 1), CYCLE_MS);
    return () => clearInterval(timer);
  }, [hovering]);

  const face = hovering ? EXPRESSIONS[(tick + 1) % EXPRESSIONS.length].face : (chosen ?? "idle");

  return (
    <div className="space-y-4 rounded-[2rem] bg-white p-4 shadow-card ring-1 ring-cream-200 sm:p-5">
      <div
        className="relative mx-auto max-w-[260px] lg:max-w-[290px]"
        onPointerEnter={(event) => event.pointerType === "mouse" && setHovering(true)}
        onPointerLeave={() => setHovering(false)}
      >
        <MascotArt config={draft} face={face} rounded className="w-full rounded-[22%] shadow-soft" label={`${name}, the ${SPECIES[draft.species].label.toLowerCase()}`} />
        <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 font-display text-lg font-semibold text-navy-900 shadow-sm backdrop-blur">
          {name}
        </span>
      </div>

      <div>
        <p className="mb-2 text-xs font-extrabold tracking-[0.12em] text-navy-500 uppercase">Try expressions</p>
        <div className="flex flex-wrap gap-1.5">
          {EXPRESSIONS.map((expression) => (
            <button
              key={expression.face}
              type="button"
              aria-pressed={face === expression.face}
              onClick={() => setChosen(expression.face)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                face === expression.face ? "bg-navy-900 text-white" : "bg-cream-100 text-navy-700 hover:bg-cream-200"
              }`}
            >
              {expression.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-extrabold tracking-[0.12em] text-navy-500 uppercase">In {childName}&apos;s world</p>
        <div className="grid grid-cols-3 items-end gap-2 rounded-3xl bg-cream-100 p-3">
          <figure className="flex flex-col items-center gap-1.5">
            <NecklacePreview config={draft} face={face} className="w-[70%]" />
            <figcaption className="text-[0.7rem] font-bold text-navy-600">Necklace</figcaption>
          </figure>
          <figure className="flex flex-col items-center gap-1.5">
            <div className="bg-dots grid aspect-square w-full place-items-center rounded-2xl bg-paper">
              <MascotArt config={draft} face={face} bare className="w-[78%]" />
            </div>
            <figcaption className="text-[0.7rem] font-bold text-navy-600">Oomi TV</figcaption>
          </figure>
          <figure className="flex flex-col items-center gap-1.5">
            <div className="flex aspect-square w-full items-center justify-center gap-1.5 rounded-2xl bg-white">
              {avatarUrl ? (
                // Portraits are served from the database behind the access cookie, so next/image can't optimize them.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="size-[46%] rounded-[30%] object-cover" />
              ) : (
                <MascotArt config={draft} rounded className="size-[46%] rounded-[30%]" />
              )}
              <span className="size-[26%] overflow-hidden rounded-full">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="size-full object-cover" />
                ) : (
                  <MascotArt config={draft} className="size-full" />
                )}
              </span>
            </div>
            <figcaption className="text-[0.7rem] font-bold text-navy-600">Avatar</figcaption>
          </figure>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSurprise}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-sun-300 whitespace-nowrap px-4 py-2.5 font-display text-base font-semibold text-navy-900 transition-colors hover:bg-sun-400"
        >
          <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="currentColor">
            <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z" />
          </svg>
          Surprise me
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full bg-cream-100 px-4 py-2.5 text-sm font-bold whitespace-nowrap text-navy-700 transition-colors hover:bg-cream-200"
        >
          Reset to classic
        </button>
      </div>
    </div>
  );
}

// ---------- Save ----------

function SaveBar({ draft, dirty, save, name, onSave }: { draft: MascotConfig; dirty: boolean; save: SaveState; name: string; onSave: () => void }) {
  const message =
    save === "saving"
      ? "Saving…"
      : save === "error"
        ? "Couldn't save. Check the name and try again."
        : save === "saved" && !dirty
          ? `Saved! ${name} will update on the Watch within 15 seconds while Oomi is open.`
          : dirty
            ? "Unsaved changes"
            : "All changes saved";
  return (
    <div className="fixed inset-x-3 bottom-[5.25rem] z-30 md:bottom-6 md:left-auto md:w-[480px] lg:right-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))]">
      <div className="mx-auto flex max-w-xl items-center gap-3 rounded-full bg-white/95 p-2 pl-2 shadow-card ring-1 ring-cream-200 backdrop-blur">
        <MascotArt config={draft} rounded className="size-11 shrink-0 rounded-full" />
        <p aria-live="polite" className="flex min-w-0 flex-1 items-center gap-2 text-sm font-bold text-navy-800">
          <AnimatePresence>
            {dirty && save !== "saving" && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="size-2.5 shrink-0 rounded-full bg-sun-400"
                aria-hidden
              />
            )}
          </AnimatePresence>
          <span className={`truncate ${save === "error" ? "text-coral-700" : save === "saved" && !dirty ? "text-mint-700" : ""}`}>{message}</span>
        </p>
        <button
          type="button"
          onClick={onSave}
          disabled={!dirty || save === "saving"}
          className="shrink-0 rounded-full bg-coral-500 px-6 py-2.5 font-display text-base font-semibold text-white shadow-soft transition-colors hover:bg-coral-600 disabled:bg-navy-300 disabled:shadow-none"
        >
          {save === "saving" ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
