"use client";

import { motion } from "motion/react";
import type { DiscoveryCard } from "@/lib/contracts";
import type { DiscoveryActions } from "./discovery-card";
import { CheckIcon, ChatIcon } from "./icons";
import { Shimmer, TimeLabel } from "./ui";

/** A question Oomi handed over to a grown-up: framed as an invitation to talk, never as an alert. */
export function TalkCard({
  card,
  childName,
  onToggleDone,
}: {
  card: DiscoveryCard;
  childName: string;
  onToggleDone: DiscoveryActions["onToggleDone"];
}) {
  const talked = card.doneAt !== null;
  const starter = card.activity;

  return (
    <article className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-grape-100 via-white to-bubble-100 p-5 shadow-card ring-1 ring-grape-200 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-sm font-bold text-grape-500">
          <span aria-hidden>{card.emoji ?? "💬"}</span>
          {card.topic ?? "A big question"}
        </span>
        <span className="text-xs font-semibold text-navy-500">
          <TimeLabel iso={card.createdAt} />
        </span>
      </div>

      <p className="mt-4 text-xs font-extrabold tracking-[0.12em] text-navy-400 uppercase">{childName} wondered</p>
      <h3 className="mt-1 font-display text-xl leading-snug font-semibold tracking-tight text-balance text-navy-900">
        “{card.question}”
      </h3>

      {card.status === "pending" ? (
        <div className="mt-4 space-y-2.5" aria-busy="true">
          <Shimmer className="h-4 w-10/12" />
          <Shimmer className="h-4 w-7/12" />
        </div>
      ) : (
        <>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-navy-700">
            {card.summary ?? `Oomi told ${childName} this one deserves your warm voice.`}
          </p>
          {starter && (
            <div className="mt-4 rounded-3xl bg-white/90 p-4 shadow-sm">
              <p className="flex items-center gap-2 text-xs font-extrabold tracking-[0.12em] text-grape-500 uppercase">
                <ChatIcon size={16} /> You could start with
              </p>
              <p className="mt-1.5 font-display text-lg leading-snug font-medium text-navy-900">{starter.title}</p>
              {starter.steps.length > 0 && (
                <ul className="mt-2 space-y-1.5 text-sm leading-snug text-navy-700">
                  {starter.steps.map((step, index) => (
                    <li key={index} className="flex gap-2">
                      <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-grape-400" />
                      {step}
                    </li>
                  ))}
                </ul>
              )}
              {starter.parentTip && <p className="mt-3 text-sm leading-relaxed text-navy-500 italic">{starter.parentTip}</p>}
            </div>
          )}
          <motion.button
            type="button"
            aria-pressed={talked}
            whileTap={{ scale: 0.95 }}
            onClick={() => onToggleDone(card, !talked)}
            className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2.5 font-display text-base font-semibold transition-colors ${
              talked ? "bg-grape-400 text-white shadow-soft" : "bg-white text-navy-800 ring-2 ring-grape-200 hover:bg-grape-100"
            }`}
          >
            {talked ? <CheckIcon size={18} strokeWidth={3} /> : <ChatIcon size={18} />}
            {talked ? "We talked about it" : "Mark as talked about"}
          </motion.button>
        </>
      )}
    </article>
  );
}
