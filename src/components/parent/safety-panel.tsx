"use client";

import type { SafetyAlert } from "@/lib/contracts";
import { TimeLabel } from "./ui";

export function SafetyPanel({ declinedToday, alerts }: { declinedToday: number; alerts: SafetyAlert[] }) {
  return (
    <div className="space-y-3 rounded-[2rem] bg-navy-900 p-5 text-cream-50 shadow-card sm:p-7">
      <div className="flex items-center gap-4">
        <span aria-hidden className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/10 text-3xl">
          🛡️
        </span>
        <div>
          <p className="font-display text-xl font-semibold">
            {declinedToday === 0
              ? "No questions declined today"
              : `${declinedToday} question${declinedToday === 1 ? "" : "s"} declined today`}
          </p>
          <p className="mt-0.5 text-sm text-cream-200/75">
            When a question isn&apos;t right for a child, Oomi kindly says no and suggests something else to explore.
          </p>
        </div>
      </div>

      {alerts.length === 0 ? (
        <p className="flex items-center gap-2 rounded-2xl bg-mint-300/15 px-4 py-3 text-sm font-semibold text-mint-200">
          <span aria-hidden>🌿</span> No safety alerts. All calm.
        </p>
      ) : (
        <ul className="space-y-2" aria-label="Safety alerts">
          {alerts.map((alert) => (
            <li key={alert.id} className="rounded-2xl bg-coral-100 px-4 py-3 text-navy-900">
              <div className="flex items-start justify-between gap-3">
                <p className="font-display text-base font-medium">“{alert.question}”</p>
                <span className="shrink-0 pt-0.5 text-xs font-semibold text-navy-700/70">
                  <TimeLabel iso={alert.createdAt} />
                </span>
              </div>
              <p className="mt-1 text-sm text-navy-700">{alert.reason}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
