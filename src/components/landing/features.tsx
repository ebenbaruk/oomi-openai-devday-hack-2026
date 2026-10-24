import type { ReactNode } from "react";
import { Reveal } from "./reveal";
import { ACCENTS, type Accent, Section, SectionHeading, Star } from "./ui";

type Feature = { accent: Accent; title: string; text: string; wide?: boolean; dark?: boolean; art?: ReactNode };

const WAVE = [10, 22, 34, 18, 40, 28, 14, 36, 24, 12, 30, 20, 8];

function Toggle({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-2.5 shadow-card">
      <span className="text-sm text-navy-700">{label}</span>
      <span className="font-display text-sm font-semibold text-navy-900">{value}</span>
    </div>
  );
}

const FEATURES: Feature[] = [
  {
    accent: "coral",
    wide: true,
    title: "Live voice, in about 2 seconds",
    text: "Push-to-talk only: Oomi never listens otherwise. A mic LED shows when it does, and a physical switch turns the mic off.",
    art: (
      <div className="flex items-end gap-4">
        <div className="flex h-12 items-center gap-1" aria-hidden>
          {WAVE.map((height, index) => (
            <span key={index} className="w-1.5 rounded-full bg-coral-500" style={{ height }} />
          ))}
        </div>
        <span className="font-display text-5xl leading-none font-semibold text-coral-600">~2s</span>
      </div>
    ),
  },
  {
    accent: "sky",
    title: "English & French",
    text: "Oomi replies in the language the child speaks.",
    art: (
      <div className="space-y-2 font-display text-sm font-medium">
        <p className="w-fit rounded-xl rounded-bl-sm bg-white px-3 py-1.5 shadow-card">Why is the sky blue?</p>
        <p className="ml-auto w-fit rounded-xl rounded-br-sm bg-white px-3 py-1.5 shadow-card">Pourquoi le ciel est bleu ?</p>
      </div>
    ),
  },
  {
    accent: "sun",
    title: "Real-world experiments",
    text: "Every answer ends with something to try with hands, eyes and a kitchen table.",
    art: <p className="text-4xl" aria-hidden>🧪 ✂️ 🔦</p>,
  },
  {
    accent: "grape",
    wide: true,
    title: "Memory that follows up",
    text: "Oomi remembers interests and open challenges, then picks the thread back up next time. Parents can see and delete all of it.",
    art: (
      <div className="flex flex-wrap items-center gap-2">
        <p className="sticker rounded-2xl rounded-br-md bg-white px-4 py-2 font-display font-medium">So, which plane flew farther?</p>
        <span className="rounded-full bg-white/70 px-3 py-1 font-display text-xs font-semibold text-grape-500">Loves: planes, ants</span>
        <span className="rounded-full bg-white/70 px-3 py-1 font-display text-xs font-semibold text-grape-500">Open: paper plane test</span>
      </div>
    ),
  },
  {
    accent: "grape",
    dark: true,
    title: "Bedtime stories",
    text: "Illustrated and narrated, made from the day's discoveries. They always end with sleep.",
    art: (
      <div className="flex gap-2" aria-hidden>
        <Star className="h-7 w-7" />
        <Star className="h-5 w-5 translate-y-3" fill="var(--color-cream-50)" />
        <span className="text-3xl">🌙</span>
      </div>
    ),
  },
  {
    accent: "mint",
    title: "Parent journal",
    text: "Today in three numbers, illustrated discovery cards, and questions to talk about together.",
    art: (
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          ["7", "questions"],
          ["2", "activities"],
          ["3", "topics"],
        ].map(([value, label]) => (
          <div key={label} className="rounded-xl bg-white px-1 py-2 shadow-card">
            <p className="font-display text-xl leading-none font-semibold">{value}</p>
            <p className="text-[11px] text-navy-500">{label}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    accent: "bubble",
    wide: true,
    title: "Oomi TV",
    text: "Short motion-design explainers of the child's own discoveries, on the family tablet. Each one ends with a real-world mission. Never autoplay.",
    art: (
      <div className="rounded-[20px] border-[3px] border-navy-900 bg-navy-900 p-1.5">
        <div className="flex items-center gap-3 rounded-[14px] bg-gradient-to-br from-sky-200 to-bubble-200 p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-navy-900 shadow-card">
            <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4" aria-hidden>
              <path d="M7 5l12 7-12 7z" fill="currentColor" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="truncate font-display font-semibold">Why do planes fly? · 60s</p>
            <p className="truncate text-sm text-navy-700">Mission: launch a plane from the stairs!</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    accent: "mint",
    wide: true,
    title: "Parent controls",
    text: "Set the hours and session length, pick the language, erase Oomi's memory in one tap.",
    art: (
      <div className="grid gap-2 sm:grid-cols-3">
        <Toggle label="Hours" value="7am–8:30pm" />
        <Toggle label="Session" value="20 min" />
        <div className="flex items-center justify-center rounded-2xl bg-white px-4 py-2.5 font-display text-sm font-semibold text-coral-600 shadow-card">
          Erase memory
        </div>
      </div>
    ),
  },
];

export function Features() {
  return (
    <Section id="features" className="bg-cream-50">
      <SectionHeading
        eyebrow="Features"
        accent="sun"
        title="Small on the outside. Big on the inside."
        intro="Everything a curious kid needs, and everything a parent wants to know."
      />
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {FEATURES.map((feature, index) => (
          <Reveal key={feature.title} delay={(index % 4) * 0.05} className={feature.wide ? "sm:col-span-2" : ""}>
            <article
              className={`sticker flex h-full flex-col justify-between gap-6 rounded-[30px] p-6 ${
                feature.dark ? "bg-navy-900 text-cream-50" : ACCENTS[feature.accent].soft
              }`}
            >
              <div>
                <h3 className="font-display text-2xl leading-tight font-semibold">{feature.title}</h3>
                <p className={`mt-2 ${feature.dark ? "text-navy-300" : "text-navy-600"}`}>{feature.text}</p>
              </div>
              {feature.art}
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
