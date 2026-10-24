"use client";

import type { DiscoveryCard } from "@/lib/contracts";
import { ActivityBlock, Question } from "./discovery-card";
import { Shimmer, TimeLabel } from "./ui";

/** A question Oomi handed over to a grown-up: framed as an invitation to talk, never as an alert. */
export function GrownUpCard({ card, childName }: { card: DiscoveryCard; childName: string }) {
  return (
    <article className="rounded-[2rem] bg-gradient-to-br from-lilac-300/30 via-white to-sky-300/25 p-5 shadow-card ring-1 ring-lilac-300/50 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-display text-base font-medium text-navy-700">
          <span aria-hidden className="text-2xl">
            {card.emoji ?? "💬"}
          </span>
          {card.topic ?? `${childName} wondered…`}
        </p>
        <span className="shrink-0 text-xs font-semibold text-navy-700/60">
          <TimeLabel iso={card.createdAt} />
        </span>
      </div>
      <div className="mt-3">
        <Question text={card.question} tone="lilac" />
      </div>
      {card.status === "pending" ? (
        <div className="mt-4 space-y-2.5" aria-busy="true">
          <Shimmer className="h-4 w-10/12" />
          <Shimmer className="h-4 w-7/12" />
        </div>
      ) : (
        <>
          <p className="mt-4 text-[0.98rem] leading-relaxed text-navy-800">
            {card.summary ?? "Oomi thought this one deserves your warm voice. A lovely moment to talk it over together."}
          </p>
          {card.activity && (
            <div className="mt-4">
              <ActivityBlock activity={card.activity} label="Conversation starter" />
            </div>
          )}
        </>
      )}
    </article>
  );
}
