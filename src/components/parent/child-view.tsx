"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import type { DiscoveryCard, Journal, MemoryItem } from "@/lib/contracts";
import { DiscoveryRow, type DiscoveryActions } from "./discovery-card";
import { CheckIcon, CloseIcon, LockIcon } from "./icons";
import { StoryLibrary } from "./stories";
import { latestDay } from "./today-view";
import { ConfirmAction, dayKey, dayLabel, EmptyState, OomiPebble, SectionHeader } from "./ui";

export function ChildView({
  journal,
  actions,
  onForget,
  onForgetAll,
}: {
  journal: Journal;
  actions: DiscoveryActions;
  onForget: (item: MemoryItem) => void;
  onForgetAll: () => Promise<void>;
}) {
  const name = journal.child.firstName;
  const memory = journal.memory;

  return (
    <div className="space-y-12">
      <section aria-labelledby="knows-title">
        <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-4">
            <OomiPebble face="curious" className="size-16 sm:size-20" />
            <div>
              <p className="text-xs font-extrabold tracking-[0.14em] text-coral-600 uppercase">
                {name}, {journal.child.age} years old
              </p>
              <h1 id="knows-title" className="font-display text-[2rem] leading-tight font-semibold tracking-tight text-navy-900 sm:text-[2.4rem]">
                What Oomi knows about {name}
              </h1>
            </div>
          </div>
          <p className="flex max-w-sm items-start gap-2.5 rounded-3xl bg-mint-50 px-4 py-3 text-sm leading-relaxed text-navy-700 ring-1 ring-mint-200">
            <LockIcon size={18} className="mt-0.5 shrink-0 text-mint-600" />
            <span>
              <strong className="text-navy-900">Oomi keeps small facts, never conversations or audio.</strong> Remove anything,
              anytime.
            </span>
          </p>
        </div>

        {memory.length === 0 ? (
          <EmptyState title={`Oomi doesn't remember anything about ${name} yet`}>
            As {name} explores, Oomi keeps favorite topics, open challenges and things learned, to keep the adventure going.
          </EmptyState>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <Interests items={memory.filter((item) => item.kind === "interest")} name={name} onForget={onForget} />
              <Challenges items={memory.filter((item) => item.kind === "challenge")} onForget={onForget} />
              <ChipGroup
                title={`${name} learned`}
                tone="bg-sky-100/70 ring-sky-200"
                items={memory.filter((item) => item.kind === "fact")}
                onForget={onForget}
              />
              <ChipGroup
                title={`${name} enjoys`}
                tone="bg-bubble-100/70 ring-bubble-200"
                items={memory.filter((item) => item.kind === "preference")}
                onForget={onForget}
              />
            </div>
            <div className="mt-4 flex justify-end">
              <ConfirmAction
                label={`Forget everything about ${name}`}
                question={`Remove everything Oomi remembers about ${name}? Discoveries and stories stay.`}
                confirmLabel="Yes, forget it all"
                busyLabel="Forgetting…"
                onConfirm={onForgetAll}
              />
            </div>
          </>
        )}
      </section>

      <section aria-labelledby="library-title">
        <SectionHeader id="library-title" kicker="Library" title="Bedtime stories" subtitle={`Every story starring ${name}.`} />
        {journal.stories.length === 0 ? (
          <EmptyState face="sleep" title="No stories yet">
            Write tonight&apos;s story from the Today page, or let {name} ask Oomi for one at bedtime.
          </EmptyState>
        ) : (
          <StoryLibrary stories={journal.stories} />
        )}
      </section>

      <History journal={journal} actions={actions} />
    </div>
  );
}

function Group({ title, tone, children }: { title: string; tone: string; children: ReactNode }) {
  return (
    <div className={`rounded-[1.75rem] p-5 ring-1 ${tone}`}>
      <h2 className="mb-3 font-display text-lg font-semibold text-navy-900">{title}</h2>
      {children}
    </div>
  );
}

function ForgetButton({ item, onForget }: { item: MemoryItem; onForget: (item: MemoryItem) => void }) {
  return (
    <button
      type="button"
      onClick={() => onForget(item)}
      aria-label={`Forget "${item.content}"`}
      className="grid size-8 shrink-0 place-items-center rounded-full text-navy-400 transition-colors hover:bg-coral-100 hover:text-coral-700"
    >
      <CloseIcon size={14} />
    </button>
  );
}

const itemMotion = {
  layout: true,
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, x: 24 },
} as const;

function Interests({ items, name, onForget }: { items: MemoryItem[]; name: string; onForget: (item: MemoryItem) => void }) {
  if (items.length === 0) return null;
  const ranked = [...items].sort((a, b) => b.weight - a.weight);
  const max = Math.max(1, ...ranked.map((item) => item.weight));
  return (
    <Group title={`${name} loves`} tone="bg-sun-100/60 ring-sun-200">
      <ol className="space-y-2">
        <AnimatePresence initial={false}>
          {ranked.map((item, index) => (
            <motion.li key={item.id} {...itemMotion} className="flex items-center gap-3 rounded-2xl bg-white/90 py-2 pr-1.5 pl-3 shadow-sm">
              <span className="w-5 shrink-0 text-center font-display text-sm font-semibold text-sun-500">{index + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-navy-900 first-letter:uppercase">{item.content}</span>
                <span aria-hidden className="mt-1 block h-2 overflow-hidden rounded-full bg-sun-100">
                  <motion.span
                    className="block h-full rounded-full bg-gradient-to-r from-sun-300 to-coral-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.weight / max) * 100}%` }}
                    transition={{ type: "spring", damping: 20, stiffness: 120, delay: index * 0.05 }}
                  />
                </span>
              </span>
              <ForgetButton item={item} onForget={onForget} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
    </Group>
  );
}

function Challenges({ items, onForget }: { items: MemoryItem[]; onForget: (item: MemoryItem) => void }) {
  if (items.length === 0) return null;
  const sorted = [...items].sort((a, b) => Number(a.status === "done") - Number(b.status === "done"));
  return (
    <Group title="Challenges" tone="bg-mint-50 ring-mint-200">
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {sorted.map((item) => {
            const done = item.status === "done";
            return (
              <motion.li key={item.id} {...itemMotion} className="flex items-center gap-3 rounded-2xl bg-white/90 py-2 pr-1.5 pl-3 shadow-sm">
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-full ${
                    done ? "bg-mint-400 text-white" : "border-2 border-dashed border-sun-400"
                  }`}
                >
                  {done && <CheckIcon size={14} strokeWidth={3} />}
                </span>
                <span className={`min-w-0 flex-1 leading-snug ${done ? "text-navy-500" : "font-semibold text-navy-900"}`}>
                  {item.content}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${done ? "bg-mint-100 text-mint-700" : "bg-sun-200 text-navy-800"}`}
                >
                  {done ? "Done" : "Open"}
                </span>
                <ForgetButton item={item} onForget={onForget} />
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </Group>
  );
}

function ChipGroup({
  title,
  tone,
  items,
  onForget,
}: {
  title: string;
  tone: string;
  items: MemoryItem[];
  onForget: (item: MemoryItem) => void;
}) {
  if (items.length === 0) return null;
  return (
    <Group title={title} tone={tone}>
      <ul className="flex flex-wrap gap-2">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.li
              key={item.id}
              {...itemMotion}
              className="flex max-w-full items-center gap-1 rounded-2xl bg-white/90 py-1.5 pr-1 pl-3.5 text-[0.95rem] leading-snug text-navy-800 shadow-sm"
            >
              <span className="min-w-0">{item.content}</span>
              <ForgetButton item={item} onForget={onForget} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </Group>
  );
}

function History({ journal, actions }: { journal: Journal; actions: DiscoveryActions }) {
  const name = journal.child.firstName;
  // The latest day lives on the Today page; this is everything before it.
  const shownOnToday = latestDay(journal.discoveries);
  const days = new Map<string, DiscoveryCard[]>();
  for (const card of journal.discoveries) {
    const key = dayKey(card.createdAt);
    if (key === shownOnToday || card.status === "pending") continue;
    days.set(key, [...(days.get(key) ?? []), card]);
  }

  return (
    <section aria-labelledby="history-title">
      <SectionHeader
        id="history-title"
        kicker="Journal"
        title="Earlier discoveries"
        subtitle="Tap a page to see the experiment again."
      />
      {days.size === 0 ? (
        <EmptyState title="The journal starts today">Earlier days will collect here, one page per question.</EmptyState>
      ) : (
        <div className="space-y-7">
          {[...days].map(([key, cards]) => (
            <div key={key}>
              <h3 className="mb-2.5 flex items-baseline gap-2 px-1 font-display text-lg font-semibold text-navy-800">
                {dayLabel(new Date(cards[0].createdAt))}
                <span className="text-sm font-medium text-navy-500">
                  {cards.length} {cards.length === 1 ? "discovery" : "discoveries"} · {cards.map((card) => card.emoji).join(" ")}
                </span>
              </h3>
              <ul className="grid gap-2.5 lg:grid-cols-2">
                {cards.map((card) => (
                  <li key={card.id} className="lg:has-[article]:col-span-2">
                    <DiscoveryRow card={card} childName={name} videosEnabled={journal.settings.videosEnabled} actions={actions} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
