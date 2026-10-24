import Image from "next/image";
import type { ReactNode } from "react";
import { Reveal } from "./reveal";
import { ACCENTS, type Accent, Cross, Section, SectionHeading, Sparkle, Star } from "./ui";

export function Problem() {
  return (
    <section className="relative overflow-hidden bg-navy-900 px-4 py-20 text-cream-50 sm:px-6 sm:py-28">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(rgb(255_255_255/0.07)_1.2px,transparent_1.2px)] [background-size:22px_22px]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <p className="font-display text-[clamp(5rem,16vw,9.5rem)] leading-none font-semibold tracking-tight text-sun-300">
            1,000
          </p>
          <h2 className="mt-3 font-display text-3xl leading-tight font-semibold text-balance sm:text-4xl">
            questions a day. That&apos;s how curious kids are.
          </h2>
          <p className="mt-5 max-w-lg text-lg text-navy-300">
            Too often, technology answers that curiosity with one thing: more screen time. Autoplay, endless feeds, apps built to keep them
            there.
          </p>
          <ul className="mt-7 flex flex-wrap gap-3">
            {["Autoplay", "Endless scroll", "Streaks & rewards"].map((item) => (
              <li key={item} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 font-display text-sm text-navy-300 line-through decoration-coral-400 decoration-2">
                <Cross className="h-3.5 w-3.5 text-coral-400" />
                {item}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.1} className="relative">
          <div className="relative rotate-1 overflow-hidden rounded-[36px] border-[3px] border-cream-50 bg-cream-100 shadow-[0_8px_0_0_var(--color-coral-400)]">
            <Image
              src="/brand/oomi-story.png"
              alt="A girl wearing Oomi folds a paper plane at the kitchen table while another one flies by the window"
              width={1536}
              height={1024}
              sizes="(min-width: 1024px) 560px, 100vw"
              className="h-auto w-full"
            />
          </div>
          <p className="sticker absolute -bottom-6 left-4 max-w-[17rem] -rotate-3 rounded-2xl bg-sun-300 px-4 py-3 font-display text-lg leading-snug font-semibold text-navy-900 sm:left-8">
            Oomi turns questions into paper planes, not playlists.
          </p>
          <Star className="absolute -top-5 -right-3 h-12 w-12 animate-float" />
        </Reveal>
      </div>
    </section>
  );
}

function Bubble({ who, children }: { who: "kid" | "oomi"; children: ReactNode }) {
  return (
    <p
      className={`sticker max-w-[19rem] rounded-[22px] px-4 py-3 font-display text-base leading-snug font-medium ${
        who === "kid" ? "rounded-bl-md bg-sky-200" : "ml-auto rounded-br-md bg-white"
      }`}
    >
      <span className="mb-0.5 block text-[11px] font-semibold tracking-wide text-navy-500 uppercase">{who === "kid" ? "Maya, 7" : "Oomi"}</span>
      {children}
    </p>
  );
}

type Step = { accent: Accent; verb: string; title: string; text: string; art: ReactNode };

const STEPS: Step[] = [
  {
    accent: "sky",
    verb: "Ask",
    title: "Hold the button. Ask anything.",
    text: "One big button, no screen to read. The mic LED lights up only while Oomi listens.",
    art: (
      <div className="space-y-4">
        <Bubble who="kid">How do airplanes fly?</Bubble>
        <div className="sticker ml-auto flex w-fit items-center gap-3 rounded-full bg-white py-2 pr-4 pl-2 font-display text-sm font-semibold">
          <span className="h-8 w-8 rounded-full border-2 border-navy-900 bg-gradient-to-br from-mint-200 to-mint-400" />
          Holding the button
          <span className="h-2.5 w-2.5 rounded-full bg-[#6dff9e] shadow-[0_0_8px_3px_rgb(109_255_158/0.7)]" />
        </div>
      </div>
    ),
  },
  {
    accent: "sun",
    verb: "Answer",
    title: "A short answer, then a challenge.",
    text: "Two or three playful sentences in about two seconds, and always a tiny experiment to try for real.",
    art: (
      <div className="space-y-3">
        <Bubble who="oomi">The wings push air down, and the air pushes the plane up!</Bubble>
        <div className="sticker -rotate-1 rounded-[22px] bg-sun-200 p-4">
          <p className="font-display text-xs font-semibold tracking-wide text-navy-600 uppercase">Want to test it?</p>
          <p className="mt-1 font-display text-lg leading-snug font-semibold">Fold two paper planes with different wings. Which one flies farther?</p>
        </div>
      </div>
    ),
  },
  {
    accent: "mint",
    verb: "Explore",
    title: "Off they go, into the real world.",
    text: "The best moment with Oomi is when the child lets go of it. Later, Oomi remembers and asks how it went.",
    art: (
      <div className="space-y-3">
        <Bubble who="kid">I did it! The big wings won!</Bubble>
        <Bubble who="oomi">Amazing, scientist! Why do you think the big wings flew farther?</Bubble>
      </div>
    ),
  },
  {
    accent: "grape",
    verb: "Share",
    title: "Parents get the discovery.",
    text: "An illustrated card in the journal, with an activity to do together tonight. Topics, never transcripts.",
    art: (
      <div className="rounded-[26px] bg-white p-5 shadow-card">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-grape-100 text-2xl">✈️</span>
          <div>
            <p className="font-display text-lg leading-tight font-semibold">Aerodynamics explorer</p>
            <p className="text-sm text-navy-500">Today · 4:12 pm</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-navy-700">Maya asked how airplanes fly and tested two paper planes.</p>
        <p className="mt-3 rounded-2xl bg-grape-100 px-4 py-3 text-sm">
          <span className="font-display font-semibold text-grape-500">Do it together · </span>
          Hold a paper plane contest after dinner. Measure the flights in footsteps!
        </p>
      </div>
    ),
  },
  {
    accent: "bubble",
    verb: "Dream",
    title: "A bedtime story from their day.",
    text: "Illustrated and narrated, built from today's discovery. It always ends with sleep.",
    art: (
      <div className="relative overflow-hidden rounded-[26px] bg-navy-900 p-5 text-cream-50 shadow-card">
        <Star className="absolute top-4 right-6 h-5 w-5" />
        <Star className="absolute top-12 right-16 h-3 w-3" fill="var(--color-cream-50)" />
        <Sparkle className="absolute right-4 bottom-16 h-4 w-4" fill="var(--color-grape-300)" />
        <p className="font-display text-xs font-semibold tracking-wide text-grape-300 uppercase">Tonight&apos;s story</p>
        <p className="mt-1 max-w-[15rem] font-display text-xl leading-snug font-semibold">The paper plane who dreamed of the stars</p>
        <p className="mt-3 text-sm text-navy-300 italic">“…and the little plane folded its wings, and drifted off to sleep.”</p>
        <div className="mt-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sun-300 text-navy-900">
            <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4" aria-hidden>
              <path d="M7 5l12 7-12 7z" fill="currentColor" />
            </svg>
          </span>
          <span className="font-display text-sm text-navy-300">Narrated · 3 min</span>
        </div>
      </div>
    ),
  },
];

export function HowItWorks() {
  return (
    <Section id="how">
      <SectionHeading
        eyebrow="How it works"
        accent="sky"
        title="One question. A whole adventure."
        intro="Every question becomes a loop that ends away from the device: in the kitchen, the garden, or a parent's lap."
      />

      <ol aria-label="The Oomi loop" className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-2 sm:gap-3">
        {STEPS.map((step, index) => (
          <li key={step.verb} className="flex items-center gap-2 sm:gap-3">
            <span className={`sticker rounded-full px-4 py-1.5 font-display font-semibold ${ACCENTS[step.accent].solid}`}>
              {step.verb}
            </span>
            {index < STEPS.length - 1 && <span aria-hidden className="font-display text-navy-400">→</span>}
          </li>
        ))}
      </ol>

      <div className="relative mt-16 space-y-6 sm:mt-20">
        <div aria-hidden className="absolute top-8 bottom-8 left-[1.6rem] hidden border-l-[3px] border-dashed border-navy-900/15 md:block" />
        {STEPS.map((step, index) => (
          <Reveal key={step.verb}>
            <div className="relative grid items-center gap-6 rounded-[32px] md:grid-cols-[3.5rem_1fr_1fr] md:gap-10">
              <span
                className={`sticker relative z-10 hidden h-14 w-14 items-center justify-center rounded-full font-display text-2xl font-semibold md:flex ${ACCENTS[step.accent].solid}`}
              >
                {index + 1}
              </span>
              <div>
                <p className={`font-display text-sm font-semibold tracking-wide uppercase ${ACCENTS[step.accent].ink}`}>
                  <span className="md:hidden">{index + 1}. </span>
                  {step.verb}
                </p>
                <h3 className="mt-1 font-display text-2xl leading-tight font-semibold sm:text-3xl">{step.title}</h3>
                <p className="mt-2 max-w-md text-lg text-navy-600">{step.text}</p>
              </div>
              <div className={`rounded-[32px] p-5 sm:p-7 ${ACCENTS[step.accent].soft}`}>{step.art}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
