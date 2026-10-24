"use client";

import type { Activity, DiscoveryCard } from "@/lib/contracts";
import { Illustration, Shimmer, TimeLabel } from "./ui";

export function ActivityBlock({ activity, label = "Do it together" }: { activity: Activity; label?: string }) {
  return (
    <div className="rounded-3xl bg-mint-100 p-5 ring-1 ring-mint-200">
      <p className="text-xs font-extrabold tracking-[0.14em] text-mint-700 uppercase">{label}</p>
      <h4 className="mt-1 font-display text-lg font-semibold text-navy-900">{activity.title}</h4>
      <ol className="mt-3 space-y-2">
        {activity.steps.map((step, index) => (
          <li key={index} className="flex gap-3 text-[0.95rem] leading-snug text-navy-800">
            <span
              aria-hidden
              className="grid size-6 shrink-0 place-items-center rounded-full bg-white font-display text-sm font-semibold text-mint-700 shadow-sm"
            >
              {index + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
      {activity.parentTip && (
        <p className="mt-4 flex gap-2 rounded-2xl bg-white/80 px-4 py-3 text-sm leading-relaxed text-navy-700">
          <span aria-hidden>💡</span>
          <span>
            <strong className="font-bold text-navy-900">Parent tip: </strong>
            {activity.parentTip}
          </span>
        </p>
      )}
    </div>
  );
}

export function Question({ text, tone = "coral" }: { text: string; tone?: "coral" | "lilac" }) {
  const colors = tone === "coral" ? "bg-coral-50 text-coral-700" : "bg-lilac-300/25 text-navy-800";
  return (
    <blockquote className={`rounded-2xl px-5 py-3 font-display text-lg leading-snug ${colors}`}>
      <p>“{text}”</p>
    </blockquote>
  );
}

export function DiscoveryCardView({ card, eager = false }: { card: DiscoveryCard; eager?: boolean }) {
  if (card.status === "pending") return <PendingCard card={card} />;
  const emoji = card.emoji ?? "✨";
  return (
    <article className="overflow-hidden rounded-[2rem] bg-white shadow-card ring-1 ring-cream-200 sm:grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:items-start">
      <Illustration
        src={card.imageUrl}
        alt={card.topic ? `Illustration about ${card.topic}` : "Illustration of the discovery"}
        seed={card.id}
        emoji={emoji}
        sizes="(min-width: 640px) 300px, 100vw"
        eager={eager}
        className="aspect-[16/9] sm:m-5 sm:mr-0 sm:aspect-square sm:rounded-3xl"
      />
      <div className="space-y-4 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl font-semibold text-navy-900 sm:text-2xl">
            <span aria-hidden className="mr-2">
              {emoji}
            </span>
            {card.topic ?? "A new discovery"}
          </h3>
          <span className="shrink-0 pt-1.5 text-xs font-semibold text-navy-700/60">
            <TimeLabel iso={card.createdAt} />
          </span>
        </div>
        <Question text={card.question} />
        {card.summary && <p className="text-[1.02rem] leading-relaxed text-navy-800">{card.summary}</p>}
        {card.activity && <ActivityBlock activity={card.activity} />}
      </div>
    </article>
  );
}

function PendingCard({ card }: { card: DiscoveryCard }) {
  return (
    <article
      aria-busy="true"
      className="overflow-hidden rounded-[2rem] bg-white/80 shadow-card ring-1 ring-cream-200 sm:grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:items-start"
    >
      <div className="relative grid aspect-[16/9] place-items-center overflow-hidden bg-gradient-to-br from-cream-200 via-cream-50 to-coral-50 sm:m-5 sm:mr-0 sm:aspect-square sm:rounded-3xl">
        <Shimmer className="absolute inset-0 rounded-none opacity-60" />
        <div className="relative flex flex-col items-center gap-2 px-4 text-center text-navy-700">
          <span aria-hidden className="animate-float text-5xl">
            ✏️
          </span>
          <p className="font-display text-lg font-medium">Oomi is writing this page…</p>
        </div>
      </div>
      <div className="space-y-4 p-5 sm:p-6">
        <Question text={card.question} />
        <div className="space-y-2.5">
          <Shimmer className="h-4 w-11/12" />
          <Shimmer className="h-4 w-8/12" />
        </div>
        <Shimmer className="h-24 w-full rounded-3xl" />
      </div>
    </article>
  );
}
