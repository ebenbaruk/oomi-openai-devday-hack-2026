"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { DiscoveryCard, Journal } from "@/lib/contracts";
import { DiscoveryCardView, type DiscoveryActions } from "./discovery-card";
import { TonightStory } from "./stories";
import { TalkCard } from "./talk-card";
import { cardMotion, dayKey, dayLabel, EmptyState, OomiPebble, SectionHeader } from "./ui";

const TALK_PREVIEW = 3;

/** The most recent day with discoveries: usually today, otherwise the last day Oomi was used. */
export function latestDay(discoveries: DiscoveryCard[]): string | null {
  return discoveries[0] ? dayKey(discoveries[0].createdAt) : null;
}

export function TodayView({
  journal,
  freshIds,
  actions,
  onStoryWritten,
}: {
  journal: Journal;
  freshIds: Set<string>;
  actions: DiscoveryActions;
  onStoryWritten: () => Promise<void>;
}) {
  const name = journal.child.firstName;
  const day = latestDay(journal.discoveries);
  const dayCards = journal.discoveries.filter((card) => dayKey(card.createdAt) === day);
  const isToday = day === dayKey(new Date().toISOString());
  const firstReady = dayCards.find((card) => card.status === "ready" && card.activity);

  return (
    <div className="space-y-10">
      <DayHero journal={journal} />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section aria-labelledby="together-title">
          <SectionHeader
            id="together-title"
            kicker={day && !isToday ? `From ${dayLabel(new Date(dayCards[0].createdAt))}` : "Today's discoveries"}
            title="Do it together"
            subtitle={`Each question ${name} asked comes with a tiny real-world experiment.`}
          />
          {dayCards.length === 0 ? (
            <EmptyState title="No discoveries yet today">
              When {name} holds Oomi&apos;s button and asks a question, a new illustrated page appears here, live.
            </EmptyState>
          ) : (
            <ul className="space-y-5">
              <AnimatePresence initial={false}>
                {dayCards.map((card, index) => (
                  <motion.li key={card.id} {...cardMotion}>
                    <DiscoveryCardView
                      card={card}
                      childName={name}
                      videosEnabled={journal.settings.videosEnabled}
                      actions={actions}
                      fresh={freshIds.has(card.id)}
                      eager={index < 2}
                      openActivity={card.id === firstReady?.id}
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </section>

        <div className="space-y-10">
          <TalkSection cards={journal.grownUp} childName={name} onToggleDone={actions.onToggleDone} />
          <section aria-labelledby="story-title">
            <SectionHeader id="story-title" kicker="Bedtime" title="Tonight's story" />
            <TonightStory
              story={journal.stories[0] ?? null}
              childName={name}
              language={journal.child.language}
              enabled={journal.settings.storyEnabled}
              onWritten={onStoryWritten}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function DayHero({ journal }: { journal: Journal }) {
  const name = journal.child.firstName;
  const { digest, today } = journal;
  const headline = digest.headline || (today.questions > 0 ? `${name} was full of questions today` : `${name}'s day is just starting`);
  const text =
    digest.text ||
    (today.questions > 0
      ? `Here is what ${name} explored with Oomi, and a few simple things to try together tonight.`
      : `When ${name} asks Oomi something, you'll see it here with an idea to explore it together.`);

  return (
    <section
      aria-labelledby="day-title"
      className="relative overflow-hidden rounded-[2.25rem] bg-white p-5 shadow-card ring-1 ring-cream-200 sm:p-8"
    >
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-20 size-72 rounded-full bg-coral-100/70 blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-28 left-1/3 size-72 rounded-full bg-mint-100/80 blur-2xl" />

      <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center lg:gap-10">
        <div>
          <div className="flex items-center gap-3">
            <OomiPebble face="happy" className="size-12 sm:size-14" />
            <p className="font-display text-lg font-medium text-coral-600" suppressHydrationWarning>
              {greeting()}! Here&apos;s {name}&apos;s day.
            </p>
          </div>
          <h1
            id="day-title"
            className="mt-4 font-display text-[2rem] leading-[1.08] font-semibold tracking-tight text-balance text-navy-900 sm:text-[2.6rem]"
          >
            {headline}
          </h1>
          <p className="mt-3 max-w-xl text-[1.05rem] leading-relaxed text-navy-700">{text}</p>
        </div>

        <div className="space-y-4">
          <DayNumbers today={today} />
          {journal.week.length > 0 && <WeekStrip week={journal.week} />}
        </div>
      </div>
    </section>
  );
}

function DayNumbers({ today }: { today: Journal["today"] }) {
  const stats = [
    { value: today.questions, label: today.questions === 1 ? "question" : "questions", tone: "bg-coral-50 text-coral-600" },
    { value: today.activities, label: today.activities === 1 ? "activity" : "activities", tone: "bg-mint-50 text-mint-600" },
    { value: today.topics, label: today.topics === 1 ? "topic" : "topics", tone: "bg-sky-100/70 text-sky-500" },
  ];
  return (
    <ul className="grid grid-cols-3 gap-2.5" aria-label="Today in numbers">
      {stats.map((stat) => (
        <li key={stat.label} className={`rounded-3xl px-3 py-4 text-center ${stat.tone}`}>
          <p className="font-display text-4xl leading-none font-semibold">
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
          <p className="mt-1.5 text-sm font-bold text-navy-700">{stat.label}</p>
        </li>
      ))}
    </ul>
  );
}

function WeekStrip({ week }: { week: Journal["week"] }) {
  const max = Math.max(1, ...week.map((day) => day.questions));
  const todayKey = dayKey(new Date().toISOString());
  return (
    <div className="rounded-3xl bg-cream-50 p-3 ring-1 ring-cream-200">
      <p className="mb-2 px-1 text-xs font-extrabold tracking-[0.12em] text-navy-500 uppercase">This week</p>
      <ol className="grid grid-cols-7 gap-1.5">
        {week.map((day) => {
          const date = new Date(`${day.date}T12:00:00`);
          const isToday = day.date === todayKey;
          const fill = day.questions === 0 ? 0 : 0.25 + 0.75 * (day.questions / max);
          return (
            <li
              key={day.date}
              aria-label={`${date.toLocaleDateString("en-US", { weekday: "long" })}: ${day.questions} questions`}
              className={`flex flex-col items-center gap-1 rounded-2xl px-0.5 py-2 ${isToday ? "bg-white shadow-sm ring-1 ring-coral-200" : ""}`}
            >
              <span className={`text-xs font-extrabold ${isToday ? "text-coral-600" : "text-navy-500"}`} suppressHydrationWarning>
                {date.toLocaleDateString("en-US", { weekday: "narrow" })}
              </span>
              <span className="flex h-14 flex-col items-center justify-end gap-0.5 text-sm leading-none" aria-hidden>
                {day.emojis.slice(0, 3).map((emoji, index) => (
                  <span key={index}>{emoji}</span>
                ))}
                {day.emojis.length === 0 && <span className="size-1.5 rounded-full bg-navy-300" />}
              </span>
              <span aria-hidden className="h-1.5 w-full max-w-7 overflow-hidden rounded-full bg-cream-200">
                <span
                  className={`block h-full rounded-full ${isToday ? "bg-coral-400" : "bg-mint-400"}`}
                  style={{ width: `${fill * 100}%` }}
                />
              </span>
              <span className="font-display text-sm font-semibold text-navy-800">{day.questions}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function TalkSection({
  cards,
  childName,
  onToggleDone,
}: {
  cards: DiscoveryCard[];
  childName: string;
  onToggleDone: DiscoveryActions["onToggleDone"];
}) {
  const [showAll, setShowAll] = useState(false);
  // Conversations still waiting come first: those are the ones worth having tonight.
  const sorted = [...cards].sort((a, b) => Number(a.doneAt !== null) - Number(b.doneAt !== null));
  const visible = showAll ? sorted : sorted.slice(0, TALK_PREVIEW);

  return (
    <section aria-labelledby="talk-title">
      <SectionHeader
        id="talk-title"
        kicker="Just for you"
        title="Talk about it together"
        subtitle={`Big questions Oomi kept for you, with a gentle way to start.`}
      />
      {cards.length === 0 ? (
        <EmptyState face="grown_up" title="Nothing waiting for you">
          When a question deserves a grown-up, Oomi tells {childName} to ask you, and you&apos;ll find a conversation starter
          here.
        </EmptyState>
      ) : (
        <>
          <ul className="space-y-4">
            <AnimatePresence initial={false}>
              {visible.map((card) => (
                <motion.li key={card.id} {...cardMotion}>
                  <TalkCard card={card} childName={childName} onToggleDone={onToggleDone} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          {sorted.length > TALK_PREVIEW && (
            <button
              type="button"
              onClick={() => setShowAll((value) => !value)}
              className="mt-3 w-full rounded-full bg-white py-2.5 text-sm font-bold text-navy-600 ring-1 ring-cream-200 hover:text-navy-900"
            >
              {showAll ? "Show fewer" : `Show ${sorted.length - TALK_PREVIEW} earlier`}
            </button>
          )}
        </>
      )}
    </section>
  );
}
