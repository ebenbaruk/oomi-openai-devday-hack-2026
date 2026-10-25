"use client";

import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import { paletteOf } from "@/components/mascot/colors";
import { MascotArt } from "@/components/mascot/mascot-art";
import { SPECIES } from "@/components/mascot/species";
import { SettingsInput, type Journal } from "@/lib/contracts";
import { AlertIcon, MailIcon, MoonIcon, ShieldIcon, TvIcon } from "./icons";
import { ConfirmAction, OomiPebble, SectionHeader, Switch, TimeLabel } from "./ui";
import { callApi } from "./use-journal";

type SaveState = "idle" | "saving" | "saved" | "error";

export function SettingsView({
  journal,
  onSaved,
  onEraseAll,
  onOpenStudio,
}: {
  journal: Journal;
  onSaved: () => Promise<void>;
  onEraseAll: () => Promise<void>;
  onOpenStudio: () => void;
}) {
  return (
    <div className="space-y-8">
      <SectionHeader kicker="Settings" title="Oomi, your way" subtitle="Simple rules, a calm safety report, and full control." />
      <MascotCard journal={journal} onOpen={onOpenStudio} />
      {/* On a phone the safety report comes before the erase card; on a laptop they sit side by side. */}
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="space-y-8">
          <SettingsForm initial={journal.settings} onSaved={onSaved} />
          <WatchPairingCard />
        </div>
        <div className="space-y-8 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <SafetyReport journal={journal} />
          <DailyNote journal={journal} />
        </div>
        <EraseCard onEraseAll={onEraseAll} />
      </div>
    </div>
  );
}

// ---------- Apple Watch ----------

type Pairing = { pairingCode: string; expiresAt: string };
type WatchConnection = { paired: boolean; pairedAt: string | null; lastSeenAt: string | null };

/** A short-lived code starts a secure Watch pairing without exposing the adult access code. */
function WatchPairingCard() {
  const [pairing, setPairing] = useState<Pairing | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [connection, setConnection] = useState<WatchConnection | null>(null);

  useEffect(() => {
    fetch("/api/watch/pair", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() as Promise<WatchConnection> : null)
      .then(setConnection)
      .catch(() => undefined);
  }, []);

  const prepare = async () => {
    setState("loading");
    try {
      const response = await fetch("/api/watch/pair", { method: "POST" });
      if (!response.ok) throw new Error("pairing_failed");
      setPairing(await response.json() as Pairing);
      setConnection({ paired: false, pairedAt: null, lastSeenAt: null });
      setState("idle");
    } catch {
      setState("error");
    }
  };

  return (
    <section className="rounded-[2rem] bg-navy-900 p-5 text-cream-50 shadow-card sm:p-7" aria-labelledby="watch-pairing-title">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/12 text-xl" aria-hidden>⌚</span>
        <div>
          <p className="text-xs font-extrabold tracking-[0.14em] text-mint-200 uppercase">Apple Watch</p>
          <h2 id="watch-pairing-title" className="mt-1 font-display text-xl font-semibold">Connect Oomi</h2>
          <p className="mt-1 text-sm leading-relaxed text-cream-100/75">Your Watch stays connected after its first setup. The Oomi server is already configured.</p>
        </div>
      </div>

      {pairing ? (
        <div className="mt-5 rounded-2xl bg-white/10 p-4">
          <p className="text-xs font-bold tracking-[0.12em] text-mint-200 uppercase">Code for this Watch</p>
          <p className="mt-1 font-mono text-4xl font-bold tracking-[0.24em] text-white">{pairing.pairingCode}</p>
          <p className="mt-3 text-xs leading-relaxed text-cream-100/75">On the Watch: open ⚙, enter this code, then tap <strong className="font-semibold text-white">Enregistrer la connexion</strong>. It stays securely connected afterwards. This code expires in 15 minutes.</p>
        </div>
      ) : connection?.paired ? (
        <div className="mt-5 rounded-2xl bg-mint-300/15 p-4">
          <p className="text-xs font-bold tracking-[0.12em] text-mint-200 uppercase">Watch connected</p>
          <p className="mt-1 text-sm font-semibold text-white">This Apple Watch is connected to Oomi.</p>
          <p className="mt-2 text-xs leading-relaxed text-cream-100/75">No code is needed again. Create one only if you intentionally reconnect this Watch.</p>
        </div>
      ) : (
        <button type="button" onClick={prepare} disabled={state === "loading"} className="mt-5 rounded-full bg-mint-300 px-5 py-2.5 font-bold text-navy-950 transition hover:bg-mint-200 disabled:opacity-60">
          {state === "loading" ? "Creating code…" : "Prepare my Apple Watch"}
        </button>
      )}
      {(pairing || connection?.paired) && <button type="button" onClick={prepare} disabled={state === "loading"} className="mt-4 text-sm font-bold text-mint-200 underline underline-offset-4 disabled:opacity-60">Reconnect this Watch</button>}
      {connection && <WatchConnectionDiagnostic connection={connection} />}
      {state === "error" && <p role="alert" className="mt-3 text-sm font-semibold text-coral-200">Couldn&apos;t create a code. Please try again.</p>}
    </section>
  );
}

function WatchConnectionDiagnostic({ connection }: { connection: WatchConnection }) {
  const lastSeen = connection.lastSeenAt ? new Date(connection.lastSeenAt) : null;
  const validLastSeen = Boolean(lastSeen && !Number.isNaN(lastSeen.valueOf()));
  const lastSeenLabel = validLastSeen
    ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(lastSeen!)
    : null;
  const minutesAway = validLastSeen ? Math.max(0, Math.round((Date.now() - lastSeen!.valueOf()) / 60_000)) : null;
  const current = minutesAway !== null && minutesAway <= 2;

  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-black/15 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold tracking-[0.12em] text-mint-200 uppercase">Diagnostic de connexion</p>
        <span className={`rounded-full px-2.5 py-1 text-[0.7rem] font-extrabold ${current ? "bg-mint-300/20 text-mint-100" : "bg-white/10 text-cream-100/80"}`}>
          {current ? "En ligne" : connection.paired ? "En attente" : "Non associée"}
        </span>
      </div>
      {connection.paired ? (
        <>
          <p className="mt-2 text-sm font-semibold text-white">
            {lastSeenLabel ? `Dernier contact sécurisé : ${lastSeenLabel}` : "La montre est associée, mais n’a pas encore contacté Oomi."}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-cream-100/75">
            {current
              ? "La montre échange bien avec Oomi. Les réglages du Studio se mettent à jour pendant que l’app est ouverte."
              : "Si la montre ne répond pas : ouvrez Oomi, vérifiez le Wi‑Fi ou la connexion de l’iPhone, puis relâchez une courte question. Si aucun contact n’apparaît, créez un nouveau code et reconnectez la montre."}
          </p>
        </>
      ) : (
        <p className="mt-2 text-xs leading-relaxed text-cream-100/75">Préparez un code puis saisissez-le dans Oomi sur la montre. Le dashboard n’enregistre jamais l’audio ni la conversation.</p>
      )}
    </div>
  );
}

// ---------- Mascot ----------

const PERSONALITY_LABEL = { playful: "Playful", calm: "Calm", silly: "Silly", curious: "Curious" } as const;

/** The entry to the mascot studio: the child's companion, live, with what makes it theirs. */
function MascotCard({ journal, onOpen }: { journal: Journal; onOpen: () => void }) {
  const { config, portraitUrl } = journal.mascot;
  const palette = paletteOf(config);
  const facts = [SPECIES[config.species].label, palette?.name ?? "Custom colors", PERSONALITY_LABEL[config.personality], `Voice: ${config.voice}`];
  return (
    <section
      aria-labelledby="mascot-card-title"
      className="relative overflow-hidden rounded-[2rem] p-5 shadow-card sm:p-6"
      style={{ background: `linear-gradient(120deg, ${config.backgroundColor}, ${config.backgroundColor}e6)` }}
    >
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
        <button type="button" onClick={onOpen} aria-label={`Customize ${config.name}`} className="mx-auto shrink-0 rounded-[22%] sm:mx-0">
          <MascotArt config={config} face="happy" rounded className="size-36 rounded-[22%] shadow-soft ring-4 ring-white/15 sm:size-40" />
        </button>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-xs font-extrabold tracking-[0.14em] text-white/70 uppercase">Your child&apos;s Oomi</p>
          <h2 id="mascot-card-title" className="mt-1 font-display text-3xl font-semibold tracking-tight text-white">
            Meet {config.name}
          </h2>
          <ul className="mt-2 flex flex-wrap justify-center gap-1.5 sm:justify-start">
            {facts.map((fact) => (
              <li key={fact} className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white capitalize">
                {fact}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm leading-relaxed text-white/80">
            Choose its look, name, voice and personality. It shows up on the necklace, on Oomi TV and in this app.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-2">
          <button
            type="button"
            onClick={onOpen}
            className="rounded-full bg-white px-6 py-3 font-display text-lg font-semibold text-navy-900 shadow-soft transition-transform hover:-translate-y-0.5"
          >
            Open the studio
          </button>
          {portraitUrl && (
            <span className="flex items-center gap-2 text-xs font-bold text-white/80">
              {/* Portraits are served from the database behind the access cookie, so next/image can't optimize them. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={portraitUrl} alt="" className="size-7 rounded-lg object-cover" /> Painted avatar in use
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

// ---------- Profile & rules ----------

const AGE_MIN = 4;
const AGE_MAX = 12;

function SettingsForm({ initial, onSaved }: { initial: SettingsInput; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState(initial);
  const [save, setSave] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const storiesId = useId();
  const videosId = useId();

  const update = <K extends keyof SettingsInput>(key: K, value: SettingsInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setSave("idle");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = SettingsInput.safeParse(form);
    if (!parsed.success) {
      setError("Please check the name and times.");
      setSave("error");
      return;
    }
    setError(null);
    setSave("saving");
    try {
      await callApi("/api/settings", { method: "PUT", body: JSON.stringify(parsed.data) });
      setSave("saved");
      await onSaved();
    } catch {
      setError("Couldn't save. Please try again.");
      setSave("error");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6 rounded-[2rem] bg-white p-5 shadow-card ring-1 ring-cream-200 sm:p-7">
      <CardTitle title="Child profile" />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="First name">
          {(id) => (
            <input
              id={id}
              value={form.firstName}
              maxLength={40}
              autoComplete="off"
              onChange={(event) => update("firstName", event.target.value)}
              className="w-full rounded-2xl border-2 border-cream-200 bg-cream-50 px-4 py-3 font-semibold text-navy-900 transition-colors outline-none focus:border-mint-400"
            />
          )}
        </Field>
        <Field label="Age">
          {(id) => (
            <Stepper id={id} value={form.age} min={AGE_MIN} max={AGE_MAX} unit="years" onChange={(value) => update("age", value)} />
          )}
        </Field>
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-bold text-navy-700">Family language</legend>
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-cream-100 p-1">
          {(["en", "fr"] as const).map((language) => (
            <label
              key={language}
              className={`cursor-pointer rounded-xl px-3 py-2.5 text-center font-bold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-sky-400 ${
                form.language === language ? "bg-white text-navy-900 shadow-sm" : "text-navy-600 hover:text-navy-900"
              }`}
            >
              <input
                type="radio"
                name="language"
                value={language}
                checked={form.language === language}
                onChange={() => update("language", language)}
                className="sr-only"
              />
              {language === "en" ? "English" : "Français"}
            </label>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-navy-500">Oomi always answers in the language your child speaks.</p>
      </fieldset>

      <div className="h-px bg-cream-200" />
      <CardTitle title="When Oomi is awake" />

      <fieldset>
        <legend className="mb-2 text-sm font-bold text-navy-700">Allowed hours</legend>
        <div className="flex items-center gap-3">
          <TimeInput label="From" value={form.allowedStart} onChange={(value) => update("allowedStart", value)} />
          <span aria-hidden className="font-bold text-navy-400">
            to
          </span>
          <TimeInput label="Until" value={form.allowedEnd} onChange={(value) => update("allowedEnd", value)} />
        </div>
        <p className="mt-1.5 text-xs text-navy-500">Outside these hours Oomi sleeps, eyes closed.</p>
      </fieldset>
      <Field label="Session length">
        {(id) => (
          <Stepper
            id={id}
            value={form.maxSessionMinutes}
            min={5}
            max={120}
            step={5}
            unit="min"
            onChange={(value) => update("maxSessionMinutes", value)}
          />
        )}
      </Field>

      <div className="space-y-2.5">
        <ToggleRow
          id={storiesId}
          icon={<MoonIcon size={20} className="text-grape-500" />}
          title="Bedtime stories"
          text="An illustrated story made from the day's discoveries."
          checked={form.storyEnabled}
          onChange={(value) => update("storyEnabled", value)}
        />
        <ToggleRow
          id={videosId}
          icon={<TvIcon size={20} className="text-sky-500" />}
          title="Oomi TV"
          text="Short explainer videos to rewatch on the family tablet, each ending with a real-world mission."
          checked={form.videosEnabled}
          onChange={(value) => update("videosEnabled", value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={save === "saving"}
          className="rounded-full bg-coral-500 px-7 py-3 font-display text-lg font-semibold text-white shadow-soft transition-colors hover:bg-coral-600 disabled:opacity-60"
        >
          {save === "saving" ? "Saving…" : "Save changes"}
        </button>
        <p aria-live="polite" className="text-sm font-semibold">
          {save === "saved" && <span className="text-mint-700">Saved. Oomi uses these from the next chat.</span>}
          {save === "error" && <span className="text-coral-700">{error}</span>}
        </p>
      </div>
    </form>
  );
}

function CardTitle({ title, icon }: { title: string; icon?: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-navy-900">
      {icon}
      {title}
    </h2>
  );
}

function Field({ label, children }: { label: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-bold text-navy-700">
        {label}
      </label>
      {children(id)}
    </div>
  );
}

function ToggleRow({
  id,
  icon,
  title,
  text,
  checked,
  onChange,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  text: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-cream-100 px-4 py-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white shadow-sm">{icon}</span>
      <div className="min-w-0 flex-1">
        <p id={id} className="font-bold text-navy-900">
          {title}
        </p>
        <p className="text-sm leading-snug text-navy-600">{text}</p>
      </div>
      <Switch checked={checked} onChange={onChange} labelledBy={id} />
    </div>
  );
}

function Stepper({
  id,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: {
  id: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));
  const buttonClass =
    "grid size-11 shrink-0 place-items-center rounded-xl bg-white text-xl font-bold text-navy-900 shadow-sm transition-colors hover:bg-coral-50 disabled:opacity-30";
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-cream-100 p-1">
      <button type="button" aria-label="Decrease" onClick={() => onChange(clamp(value - step))} disabled={value <= min} className={buttonClass}>
        −
      </button>
      <output id={id} aria-live="polite" className="flex-1 text-center font-display text-xl font-semibold text-navy-900">
        {value} <span className="text-sm font-medium text-navy-600">{unit}</span>
      </output>
      <button type="button" aria-label="Increase" onClick={() => onChange(clamp(value + step))} disabled={value >= max} className={buttonClass}>
        +
      </button>
    </div>
  );
}

function TimeInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="min-w-0 flex-1">
      <span className="sr-only">{label}</span>
      <input
        type="time"
        value={value}
        required
        onChange={(event) => onChange(event.target.value)}
        className="w-full min-w-0 rounded-2xl border-2 border-cream-200 bg-cream-50 px-3 py-3 font-display text-lg font-semibold text-navy-900 transition-colors outline-none focus:border-mint-400"
      />
    </label>
  );
}

// ---------- Safety ----------

function SafetyReport({ journal }: { journal: Journal }) {
  const name = journal.child.firstName;
  const { answered, grownUp, declined } = journal.weekTotals;
  const total = answered + grownUp + declined;
  const parts = [
    { label: "Answered", hint: "with an experiment", value: answered, bar: "bg-mint-400", dot: "bg-mint-400" },
    { label: "Sent to you", hint: "to talk about together", value: grownUp, bar: "bg-grape-400", dot: "bg-grape-400" },
    { label: "Gently declined", hint: "with a new idea instead", value: declined, bar: "bg-sun-400", dot: "bg-sun-400" },
  ];

  return (
    <section aria-label="Safety this week" className="rounded-[2rem] bg-white p-5 shadow-card ring-1 ring-cream-200 sm:p-7">
      <CardTitle title="Safety this week" icon={<ShieldIcon size={22} className="text-mint-600" />} />
      <p className="mt-1 text-sm leading-relaxed text-navy-600">
        Every question {name} asks gets one of three calm answers.
      </p>

      <div aria-hidden className="mt-5 flex h-4 gap-1 overflow-hidden rounded-full bg-cream-100">
        {total > 0 &&
          parts.map((part) =>
            part.value > 0 ? (
              <span key={part.label} className={`h-full rounded-full ${part.bar}`} style={{ flexGrow: part.value }} />
            ) : null,
          )}
      </div>
      <ul className="mt-4 grid grid-cols-3 gap-2">
        {parts.map((part) => (
          <li key={part.label} className="rounded-2xl bg-cream-50 p-3">
            <p className="flex items-center gap-1.5 font-display text-2xl font-semibold text-navy-900">
              <span aria-hidden className={`size-2.5 rounded-full ${part.dot}`} />
              {part.value}
            </p>
            <p className="mt-0.5 text-sm leading-tight font-bold text-navy-800">{part.label}</p>
            <p className="hidden text-xs leading-snug text-navy-500 sm:block">{part.hint}</p>
          </li>
        ))}
      </ul>

      <div className="mt-5">
        {journal.alerts.length === 0 ? (
          <p className="flex items-center gap-3 rounded-2xl bg-mint-50 px-4 py-3 text-sm font-semibold text-mint-700 ring-1 ring-mint-200">
            <OomiPebble face="happy" className="size-8" />
            No safety alerts. All calm.
          </p>
        ) : (
          <div className="space-y-2.5">
            <p className="flex items-center gap-2 text-sm font-extrabold tracking-[0.1em] text-coral-700 uppercase">
              <AlertIcon size={16} /> Needs your attention
            </p>
            <ul className="space-y-2.5">
              {journal.alerts.map((alert) => (
                <li key={alert.id} className="rounded-2xl bg-coral-50 p-4 ring-1 ring-coral-200">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-display text-lg leading-snug font-medium text-navy-900">“{alert.question}”</p>
                    <span className="shrink-0 pt-1 text-xs font-semibold text-navy-500">
                      <TimeLabel iso={alert.createdAt} />
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-navy-700">{alert.reason}</p>
                  <p className="mt-3 rounded-xl bg-white px-3 py-2.5 text-sm leading-relaxed text-navy-700">
                    <strong className="text-navy-900">What to do: </strong>
                    find a calm moment to talk with {name} about it. Listen first, you don&apos;t need every answer. If
                    something worries you, your pediatrician can help.
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

// ---------- Daily note ----------

/** What the evening email would look like, built from the live journal. A preview: nothing is sent. */
function DailyNote({ journal }: { journal: Journal }) {
  const name = journal.child.firstName;
  const { today, digest } = journal;
  const tryTonight = journal.discoveries.find((card) => card.activity && card.doneAt === null && card.status === "ready");
  const talk = journal.grownUp.find((card) => card.doneAt === null) ?? journal.grownUp[0];
  const story = journal.stories[0];

  return (
    <section aria-labelledby="note-title">
      <div className="mb-3 flex items-end justify-between gap-3 px-1">
        <div>
          <h2 id="note-title" className="flex items-center gap-2 font-display text-xl font-semibold text-navy-900">
            <MailIcon size={22} className="text-coral-500" /> Daily note
          </h2>
          <p className="text-sm text-navy-600">What you&apos;d get by email each evening. Preview only.</p>
        </div>
      </div>

      <article className="overflow-hidden rounded-[1.75rem] bg-white shadow-card ring-1 ring-cream-200">
        <header className="space-y-1 border-b border-cream-200 bg-cream-50 px-5 py-4 text-sm">
          <p className="flex items-center gap-2 text-navy-600">
            <OomiPebble face="happy" className="size-7" />
            <span>
              <strong className="text-navy-900">Oomi</strong> · to you · 7:30 PM
            </span>
          </p>
          <p className="font-display text-lg leading-snug font-semibold text-navy-900">
            {name}&apos;s day: {digest.headline || `${today.questions} questions explored`}
          </p>
        </header>
        <div className="space-y-4 px-5 py-5 text-[0.95rem] leading-relaxed text-navy-800">
          <p>Hi! {digest.text || `Here is what ${name} discovered today with Oomi.`}</p>
          <p className="flex flex-wrap gap-2 text-sm font-bold">
            <span className="rounded-full bg-coral-50 px-3 py-1 text-coral-700">{today.questions} questions</span>
            <span className="rounded-full bg-mint-50 px-3 py-1 text-mint-700">{today.activities} activities</span>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-500">{today.topics} topics</span>
          </p>
          {tryTonight?.activity && (
            <NoteBlock label="Try tonight" emoji={tryTonight.emoji ?? "✨"}>
              <strong>{tryTonight.activity.title}</strong>. {tryTonight.activity.steps[0]}
            </NoteBlock>
          )}
          {talk && (
            <NoteBlock label="Talk about it" emoji={talk.emoji ?? "💬"}>
              {name} wondered: “{talk.question}”
            </NoteBlock>
          )}
          {story && (
            <NoteBlock label="Bedtime story" emoji="🌙">
              {story.title}
            </NoteBlock>
          )}
          <p className="border-t border-cream-200 pt-3 text-xs text-navy-500">
            Oomi never keeps conversations or audio. Manage everything in the app.
          </p>
        </div>
      </article>
    </section>
  );
}

function NoteBlock({ label, emoji, children }: { label: string; emoji: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-cream-50 px-4 py-3">
      <span aria-hidden className="text-xl">
        {emoji}
      </span>
      <div>
        <p className="text-xs font-extrabold tracking-[0.1em] text-navy-500 uppercase">{label}</p>
        <p className="text-navy-800">{children}</p>
      </div>
    </div>
  );
}

// ---------- Erase ----------

function EraseCard({ onEraseAll }: { onEraseAll: () => Promise<void> }) {
  return (
    <section className="rounded-[2rem] border-2 border-dashed border-coral-200 p-5 sm:p-7">
      <h2 className="font-display text-lg font-semibold text-navy-900">Erase everything</h2>
      <p className="mt-1 mb-4 text-sm leading-relaxed text-navy-600">
        Deletes every discovery, story, memory and alert. The profile and settings stay.
      </p>
      <ConfirmAction
        variant="danger"
        label="Erase everything"
        question="Erase everything Oomi has collected? This can't be undone."
        confirmLabel="Yes, erase everything"
        onConfirm={onEraseAll}
      />
    </section>
  );
}
