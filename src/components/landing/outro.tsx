import Link from "next/link";
import { Pebble } from "./pebble";
import { Reveal } from "./reveal";
import { Arrow, Cross, Section, Sparkle, Star } from "./ui";

const NOT = [
  { title: "Not a ChatGPT in a toy", text: "Answering is easy. The loop to the real world is the point." },
  { title: "Not another screen", text: "No scroll, no apps, no notifications, no streaks." },
  { title: "Not a best friend", text: "An explorer's tool that sends kids back to their people." },
];

export function WhatItIsNot() {
  return (
    <Section className="bg-coral-300">
      <h2 className="text-center font-display text-4xl font-semibold tracking-tight sm:text-5xl">What Oomi is not.</h2>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {NOT.map((item, index) => (
          <Reveal key={item.title} delay={index * 0.06}>
            <div className="sticker-lg h-full rounded-[30px] bg-cream-50 p-6" style={{ rotate: `${[-1.5, 1, -0.5][index]}deg` }}>
              <span className="flex h-11 w-11 items-center justify-center rounded-full border-[2.5px] border-navy-900 bg-bubble-200">
                <Cross className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-2xl leading-tight font-semibold">{item.title}</h3>
              <p className="mt-2 text-navy-600">{item.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

const TEAM = [
  { name: "Eli", tone: "bg-sky-200" },
  { name: "Ali", tone: "bg-sun-200" },
  { name: "Akram", tone: "bg-mint-200" },
];

export function FinalCta() {
  return (
    <Section className="bg-dots">
      <Reveal>
        <div className="sticker-lg relative overflow-hidden rounded-[40px] bg-sun-200 px-6 py-14 text-center sm:px-12 sm:py-16">
          <Star className="absolute top-8 left-8 h-10 w-10 animate-float" fill="var(--color-coral-300)" />
          <Sparkle className="absolute right-10 bottom-10 h-10 w-10 animate-float [animation-delay:-3s]" />
          <div className="mx-auto w-24 sm:w-28">
            <Pebble face="happy" />
          </div>
          <h2 className="mx-auto mt-6 max-w-2xl font-display text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
            Ask Oomi something. Out loud.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-navy-700">
            The whole loop works today: live voice, safety, memory, stories and the parent journal.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/oomi"
              className="btn-chunky group inline-flex items-center gap-2 rounded-full bg-coral-400 px-7 py-4 font-display text-lg font-semibold"
            >
              Try the live demo
              <Arrow className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/parent" className="btn-chunky rounded-full bg-white px-7 py-4 font-display text-lg font-semibold">
              See the parent app
            </Link>
          </div>
        </div>
      </Reveal>

      <div className="mt-16 text-center">
        <p className="font-display text-sm font-semibold tracking-wide text-navy-500 uppercase">Made in a weekend by</p>
        <ul className="mt-4 flex justify-center gap-6">
          {TEAM.map((member) => (
            <li key={member.name} className="flex flex-col items-center gap-2">
              <span className={`sticker flex h-16 w-16 items-center justify-center rounded-full font-display text-2xl font-semibold ${member.tone}`}>
                {member.name[0]}
              </span>
              <span className="font-display font-semibold">{member.name}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-navy-500">OpenAI DevDay Hackathon 2026 · Hardware · Impact · Build in Public</p>
      </div>
    </Section>
  );
}

export function Footer() {
  return (
    <footer className="bg-navy-900 px-4 py-12 text-center sm:px-6">
      <p className="mx-auto max-w-2xl font-display text-2xl leading-snug font-semibold text-balance text-cream-50 sm:text-3xl">
        Not an AI best friend. <span className="block text-coral-300">A little companion for big discoveries.</span>
      </p>
      <p className="mt-6 text-sm text-navy-400">© 2026 Oomi · Prototype. During the hackathon, children&apos;s questions are played by adults.</p>
    </footer>
  );
}
