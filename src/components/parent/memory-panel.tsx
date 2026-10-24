"use client";

import { AnimatePresence, motion } from "motion/react";
import type { MemoryItem } from "@/lib/contracts";
import { ConfirmAction, EmptyState } from "./ui";

const MAX_HEARTS = 5;

const GROUPS: { kind: MemoryItem["kind"]; emoji: string; title: (name: string) => string; tint: string }[] = [
  { kind: "interest", emoji: "🌟", title: (name) => `${name} loves`, tint: "bg-sun-300/25 ring-sun-300/60" },
  { kind: "challenge", emoji: "🧩", title: () => "Challenges", tint: "bg-mint-100 ring-mint-200" },
  { kind: "fact", emoji: "📚", title: (name) => `${name} learned`, tint: "bg-lilac-300/20 ring-lilac-300/50" },
  { kind: "preference", emoji: "🎈", title: (name) => `${name} enjoys`, tint: "bg-coral-50 ring-coral-100" },
];

export function MemoryPanel({
  memory,
  childName,
  onForget,
  onForgetAll,
}: {
  memory: MemoryItem[];
  childName: string;
  onForget: (item: MemoryItem) => void;
  onForgetAll: () => Promise<void>;
}) {
  if (memory.length === 0) {
    return (
      <EmptyState emoji="🌱">
        Oomi doesn&apos;t remember anything about {childName} yet. It keeps small things like favorite topics and open
        challenges, never conversations.
      </EmptyState>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {GROUPS.map((group) => {
          const items = memory.filter((item) => item.kind === group.kind);
          if (items.length === 0) return null;
          return (
            <div key={group.kind} className={`rounded-[1.75rem] p-5 ring-1 ${group.tint}`}>
              <h3 className="mb-3 font-display text-lg font-semibold text-navy-900">
                <span aria-hidden className="mr-2">
                  {group.emoji}
                </span>
                {group.title(childName)}
              </h3>
              <ul className="space-y-2">
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <motion.li
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, x: 24 }}
                      className="flex items-center gap-3 rounded-2xl bg-white/90 py-2 pr-2 pl-4 shadow-sm"
                    >
                      <span className="min-w-0 flex-1 text-[0.95rem] leading-snug text-navy-800">
                        {item.kind === "challenge" && item.status === "done" ? (
                          <span className="text-navy-700/60 line-through decoration-mint-400 decoration-2">{item.content}</span>
                        ) : (
                          item.content
                        )}
                      </span>
                      <MemoryBadge item={item} />
                      <button
                        type="button"
                        onClick={() => onForget(item)}
                        aria-label={`Forget "${item.content}"`}
                        className="grid size-8 shrink-0 place-items-center rounded-full text-lg text-navy-700/50 transition-colors hover:bg-coral-50 hover:text-coral-600"
                      >
                        ×
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          );
        })}
      </div>
      <div className="flex justify-end">
        <ConfirmAction
          label="Forget everything"
          question={`Make Oomi forget everything it knows about ${childName}?`}
          confirmLabel="Yes, forget it all"
          onConfirm={onForgetAll}
        />
      </div>
    </div>
  );
}

function MemoryBadge({ item }: { item: MemoryItem }) {
  if (item.kind === "interest") {
    const hearts = Math.min(Math.max(item.weight, 1), MAX_HEARTS);
    return (
      <span className="shrink-0 text-xs tracking-tight" aria-label={`Interest level ${hearts} of ${MAX_HEARTS}`} role="img">
        {"❤️".repeat(hearts)}
        <span className="opacity-25">{"🤍".repeat(MAX_HEARTS - hearts)}</span>
      </span>
    );
  }
  if (item.kind === "challenge") {
    return item.status === "done" ? (
      <span className="shrink-0 rounded-full bg-mint-300 px-2.5 py-1 text-xs font-bold text-navy-900">Done ✓</span>
    ) : (
      <span className="shrink-0 rounded-full bg-sun-300 px-2.5 py-1 text-xs font-bold text-navy-900">In progress</span>
    );
  }
  return null;
}
