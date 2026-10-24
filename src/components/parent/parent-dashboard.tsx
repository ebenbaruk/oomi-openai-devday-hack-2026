"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import type { Journal, MemoryItem } from "@/lib/contracts";
import { DiscoveryCardView } from "./discovery-card";
import { GrownUpCard } from "./grown-up-card";
import { MemoryPanel } from "./memory-panel";
import { SafetyPanel } from "./safety-panel";
import { SettingsForm } from "./settings-form";
import { StoryShelf } from "./stories";
import { EmptyState, Section } from "./ui";
import { callApi, useJournal, type SyncState } from "./use-journal";

const NAV = [
  { id: "today", label: "Today" },
  { id: "discoveries", label: "Discoveries" },
  { id: "together", label: "Talk together" },
  { id: "stories", label: "Stories" },
  { id: "memory", label: "Memory" },
  { id: "safety", label: "Safety" },
  { id: "settings", label: "Settings" },
];

const cardMotion = {
  layout: true,
  initial: { opacity: 0, y: 18, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
  transition: { type: "spring", damping: 24, stiffness: 220 },
} as const;

export function ParentDashboard({ initialJournal }: { initialJournal: Journal }) {
  const { journal, sync, refresh, mutate } = useJournal(initialJournal);
  const name = journal.child.firstName;

  const forgetMemory = (item: MemoryItem) => {
    mutate(
      (current) => ({ ...current, memory: current.memory.filter((entry) => entry.id !== item.id) }),
      () => callApi(`/api/memory?id=${encodeURIComponent(item.id)}`, { method: "DELETE" }),
    ).catch(() => undefined);
  };

  const forgetAllMemory = () =>
    mutate(
      (current) => ({ ...current, memory: [] }),
      () => callApi("/api/memory", { method: "DELETE" }),
    );

  const eraseAll = () =>
    mutate(
      (current) => ({
        ...current,
        today: { questions: 0, activities: 0, topics: 0 },
        discoveries: [],
        grownUp: [],
        declinedToday: 0,
        alerts: [],
        memory: [],
        stories: [],
      }),
      () => callApi("/api/erase", { method: "POST" }),
    );

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen overflow-x-clip">
        <Backdrop />
        <div className="relative mx-auto max-w-3xl px-4 pt-6 pb-24 sm:px-6 sm:pt-10">
          <Header name={name} sync={sync} />
          <SectionNav />

          <main className="mt-8 space-y-14">
            <Section id="today" emoji="☀️" title="Today" subtitle={`What ${name} explored with Oomi today.`}>
              <TodayStats today={journal.today} />
            </Section>

            <Section
              id="discoveries"
              emoji="🔭"
              title="Discoveries"
              subtitle="Each question becomes a page, with a little something to do together."
            >
              {journal.discoveries.length === 0 ? (
                <EmptyState emoji="🫧">
                  No discoveries yet. When {name} asks Oomi a question, a new page appears here.
                </EmptyState>
              ) : (
                <ul className="space-y-6">
                  <AnimatePresence initial={false}>
                    {journal.discoveries.map((card, index) => (
                      <motion.li key={card.id} {...cardMotion}>
                        <DiscoveryCardView card={card} eager={index === 0} />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </Section>

            <Section
              id="together"
              emoji="🤗"
              title="To talk about together"
              subtitle={`Big questions Oomi thought were best answered by you.`}
            >
              {journal.grownUp.length === 0 ? (
                <EmptyState emoji="💛">
                  Nothing waiting for you. When a question deserves a grown-up, Oomi invites {name} to ask you, and you&apos;ll
                  find a gentle conversation starter here.
                </EmptyState>
              ) : (
                <ul className="space-y-5">
                  <AnimatePresence initial={false}>
                    {journal.grownUp.map((card) => (
                      <motion.li key={card.id} {...cardMotion}>
                        <GrownUpCard card={card} childName={name} />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </Section>

            <Section id="stories" emoji="🌙" title="Bedtime stories" subtitle={`Starring ${name}, made from the day's discoveries.`}>
              {journal.stories.length === 0 ? (
                <EmptyState emoji="✨">
                  {journal.settings.storyEnabled
                    ? `No stories yet. When ${name} asks Oomi for a bedtime story, the illustrated version lands here to read together.`
                    : "Bedtime stories are turned off. You can switch them on in Settings."}
                </EmptyState>
              ) : (
                <StoryShelf stories={journal.stories} />
              )}
            </Section>

            <Section
              id="memory"
              emoji="🧠"
              title={`What Oomi knows about ${name}`}
              subtitle="Small facts to keep the adventure going. Remove anything, anytime."
            >
              <MemoryPanel memory={journal.memory} childName={name} onForget={forgetMemory} onForgetAll={forgetAllMemory} />
            </Section>

            <Section id="safety" emoji="🛡️" title="Safety" subtitle="Rarely needed, always watching out.">
              <SafetyPanel declinedToday={journal.declinedToday} alerts={journal.alerts} />
            </Section>

            <Section id="settings" emoji="⚙️" title="Settings">
              <SettingsForm initial={journal.settings} onSaved={refresh} onEraseAll={eraseAll} />
            </Section>
          </main>

          <footer className="mt-16 flex flex-col items-center gap-2 text-center text-sm text-navy-700/70">
            <p className="font-display text-base text-navy-700">🔒 Private by design</p>
            <p className="max-w-md leading-relaxed">
              Oomi never records audio and never keeps full conversations. You see questions and topics, nothing more.
            </p>
          </footer>
        </div>
      </div>
    </MotionConfig>
  );
}

function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[520px] overflow-hidden">
      <div className="absolute -top-32 -left-24 size-80 rounded-full bg-coral-200/50 blur-3xl" />
      <div className="absolute -top-20 right-[-6rem] size-96 rounded-full bg-mint-200/60 blur-3xl" />
      <div className="absolute top-64 left-1/3 size-64 rounded-full bg-sun-300/30 blur-3xl" />
    </div>
  );
}

function Header({ name, sync }: { name: string; sync: SyncState }) {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  return (
    <header className="flex items-center gap-4">
      <motion.div
        className="relative size-16 shrink-0 overflow-hidden rounded-[1.4rem] shadow-soft ring-4 ring-white sm:size-20"
        initial={{ rotate: -8, scale: 0.8, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 12, stiffness: 180 }}
      >
        <Image src="/brand/oomi-mascot.png" alt="Oomi" fill sizes="80px" priority className="object-cover object-[70%_50%]" />
      </motion.div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-coral-600" suppressHydrationWarning>
          {today}
        </p>
        <h1 className="truncate font-display text-3xl font-semibold text-navy-900 sm:text-4xl">{name}&apos;s journal</h1>
        <LiveBadge sync={sync} />
      </div>
      <Link
        href="/oomi"
        className="shrink-0 self-start rounded-full bg-white/80 px-3.5 py-2 text-xs font-bold text-navy-700 shadow-sm ring-1 ring-cream-200 transition-colors hover:bg-white hover:text-coral-600 sm:text-sm"
      >
        <span aria-hidden>🎙️</span> Device
      </Link>
    </header>
  );
}

function LiveBadge({ sync }: { sync: SyncState }) {
  return (
    <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-navy-700/70" role="status">
      <span className={`relative flex size-2 ${sync === "live" ? "text-mint-500" : "text-sun-400"}`}>
        {sync === "live" && <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" />}
        <span className="relative inline-flex size-2 rounded-full bg-current" />
      </span>
      {sync === "live" ? "Updates live" : "Reconnecting…"}
    </p>
  );
}

function SectionNav() {
  return (
    <nav
      aria-label="Journal sections"
      className="sticky top-0 z-20 -mx-4 mt-6 bg-cream-100/80 px-4 py-3 backdrop-blur-md sm:top-3 sm:mx-0 sm:rounded-full sm:px-2 sm:py-2"
    >
      <ul className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
        {NAV.map((item) => (
          <li key={item.id} className="shrink-0">
            <a
              href={`#${item.id}`}
              className="block rounded-full bg-white px-4 py-2 text-sm font-bold text-navy-700 shadow-sm ring-1 ring-cream-200 transition-colors hover:bg-coral-50 hover:text-coral-700"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function TodayStats({ today }: { today: Journal["today"] }) {
  const stats = [
    { label: today.questions === 1 ? "question" : "questions", value: today.questions, emoji: "💬", tint: "bg-coral-100 text-coral-700" },
    { label: today.activities === 1 ? "activity" : "activities", value: today.activities, emoji: "✂️", tint: "bg-mint-200 text-mint-700" },
    { label: today.topics === 1 ? "topic" : "topics", value: today.topics, emoji: "🧭", tint: "bg-sun-300/60 text-navy-800" },
  ];
  return (
    <ul className="grid grid-cols-3 gap-3 sm:gap-4">
      {stats.map((stat) => (
        <li
          key={stat.emoji}
          className="flex flex-col items-center rounded-[1.75rem] bg-white px-2 py-5 text-center shadow-card ring-1 ring-cream-200 sm:py-7"
        >
          <span aria-hidden className={`grid size-10 place-items-center rounded-2xl text-xl sm:size-12 sm:text-2xl ${stat.tint}`}>
            {stat.emoji}
          </span>
          <p className="mt-3 font-display text-4xl leading-none font-semibold text-navy-900 sm:text-5xl">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={stat.value}
                className="inline-block"
                initial={{ y: 14, opacity: 0, scale: 0.7 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -14, opacity: 0 }}
                transition={{ type: "spring", damping: 14, stiffness: 260 }}
              >
                {stat.value}
              </motion.span>
            </AnimatePresence>
          </p>
          <p className="mt-1 text-sm font-bold text-navy-700/80">{stat.label}</p>
        </li>
      ))}
    </ul>
  );
}
