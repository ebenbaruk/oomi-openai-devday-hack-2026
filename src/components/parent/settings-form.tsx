"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { SettingsInput } from "@/lib/contracts";
import { callApi } from "./use-journal";
import { ConfirmAction } from "./ui";

type SaveState = "idle" | "saving" | "saved" | "error";

const AGE_MIN = 4;
const AGE_MAX = 12;

export function SettingsForm({
  initial,
  onSaved,
  onEraseAll,
}: {
  initial: SettingsInput;
  onSaved: () => Promise<void>;
  onEraseAll: () => Promise<void>;
}) {
  const [form, setForm] = useState(initial);
  const [save, setSave] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);

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
    <div className="space-y-6">
      <form onSubmit={submit} className="space-y-5 rounded-[2rem] bg-white p-5 shadow-card ring-1 ring-cream-200 sm:p-7">
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
              <Stepper
                id={id}
                value={form.age}
                min={AGE_MIN}
                max={AGE_MAX}
                unit="years old"
                onChange={(value) => update("age", value)}
              />
            )}
          </Field>
          <fieldset>
            <legend className="mb-2 text-sm font-bold text-navy-700">Language Oomi speaks</legend>
            <div className="grid grid-cols-2 gap-1 rounded-2xl bg-cream-100 p-1">
              {(["en", "fr"] as const).map((language) => (
                <label
                  key={language}
                  className={`cursor-pointer rounded-xl px-3 py-2.5 text-center font-bold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-mint-400 ${
                    form.language === language ? "bg-white text-navy-900 shadow-sm" : "text-navy-700/70 hover:text-navy-900"
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
                  {language === "en" ? "🇬🇧 English" : "🇫🇷 Français"}
                </label>
              ))}
            </div>
          </fieldset>
          <Field label="Max session length">
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
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-bold text-navy-700">Oomi is awake between</legend>
          <div className="flex items-center gap-3">
            <TimeInput label="From" value={form.allowedStart} onChange={(value) => update("allowedStart", value)} />
            <span aria-hidden className="text-navy-700/50">
              →
            </span>
            <TimeInput label="Until" value={form.allowedEnd} onChange={(value) => update("allowedEnd", value)} />
          </div>
        </fieldset>

        <div className="flex items-center justify-between gap-4 rounded-2xl bg-cream-100 px-4 py-3">
          <div>
            <p id="story-toggle-label" className="font-bold text-navy-900">
              🌙 Bedtime stories
            </p>
            <p className="text-sm text-navy-700/75">Oomi can tell a short story with today&apos;s discoveries.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.storyEnabled}
            aria-labelledby="story-toggle-label"
            onClick={() => update("storyEnabled", !form.storyEnabled)}
            className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${form.storyEnabled ? "bg-mint-400" : "bg-navy-700/25"}`}
          >
            <span
              className={`absolute top-1 left-1 size-6 rounded-full bg-white shadow transition-transform ${
                form.storyEnabled ? "translate-x-6" : ""
              }`}
            />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={save === "saving"}
            className="rounded-full bg-coral-500 px-7 py-3 font-display text-lg font-semibold text-white shadow-soft transition-colors hover:bg-coral-600 disabled:opacity-60"
          >
            {save === "saving" ? "Saving…" : "Save settings"}
          </button>
          <p aria-live="polite" className="text-sm font-semibold">
            {save === "saved" && <span className="text-mint-700">✓ Saved. Oomi will use these from the next chat.</span>}
            {save === "error" && <span className="text-coral-700">{error}</span>}
          </p>
        </div>
      </form>

      <div className="rounded-[2rem] border-2 border-dashed border-coral-200 p-5 sm:p-7">
        <h3 className="font-display text-lg font-semibold text-navy-900">Erase all data</h3>
        <p className="mt-1 mb-4 text-sm leading-relaxed text-navy-700/80">
          Deletes every discovery, story, memory and alert. The profile and settings above stay.
        </p>
        <ConfirmAction
          variant="danger"
          label="Erase all data"
          question="Erase everything Oomi has collected? This can't be undone."
          confirmLabel="Yes, erase everything"
          onConfirm={onEraseAll}
        />
      </div>
    </div>
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
        {value} <span className="text-sm font-medium text-navy-700/70">{unit}</span>
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
