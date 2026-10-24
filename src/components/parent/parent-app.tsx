"use client";

import Link from "next/link";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import type { DiscoveryCard, Journal, MemoryItem } from "@/lib/contracts";
import { MascotProvider } from "@/components/mascot/mascot-context";
import { ChildView } from "./child-view";
import type { DiscoveryActions } from "./discovery-card";
import { HeartIcon, NecklaceIcon, SlidersIcon, SunIcon, TvIcon } from "./icons";
import { MascotStudio } from "./mascot-studio";
import { SettingsView } from "./settings-view";
import { TodayView } from "./today-view";
import { OomiPebble } from "./ui";
import { callApi, useJournal, type SyncState } from "./use-journal";
import { parseView, type View } from "./views";

const TOAST_MS = 3500;

// Dates are shown in the parent's own timezone, which the server can't know: render the journal in the browser only.
const subscribeNoop = () => () => {};
function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}

function patchCard(journal: Journal, id: string, patch: (card: DiscoveryCard) => DiscoveryCard): Journal {
  const apply = (cards: DiscoveryCard[]) => cards.map((card) => (card.id === id ? patch(card) : card));
  return { ...journal, discoveries: apply(journal.discoveries), grownUp: apply(journal.grownUp) };
}

export function ParentApp({ initialJournal, initialView }: { initialJournal: Journal; initialView: View }) {
  const { journal, sync, refresh, mutate } = useJournal(initialJournal);
  const [view, setView] = useState<View>(initialView);
  const [toast, setToast] = useState<string | null>(null);
  const isClient = useIsClient();
  const name = journal.child.firstName;

  // Cards that arrive while the page is open get a "New!" sticker: that's the live moment of the demo.
  const [knownIds] = useState(() => new Set(initialJournal.discoveries.map((card) => card.id)));
  const freshIds = new Set(journal.discoveries.filter((card) => !knownIds.has(card.id)).map((card) => card.id));

  useEffect(() => {
    const onPop = () => setView(parseView(new URLSearchParams(window.location.search).get("view")));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const navigate = useCallback((next: View) => {
    setView(next);
    window.history.pushState(null, "", next === "today" ? window.location.pathname : `?view=${next}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const run = (optimistic: (current: Journal) => Journal, request: () => Promise<unknown>) =>
    mutate(optimistic, request).catch(() => setToast("That didn't go through. Please try again."));

  const actions: DiscoveryActions = {
    onToggleDone: (card, done) =>
      run(
        (current) => patchCard(current, card.id, (entry) => ({ ...entry, doneAt: done ? new Date().toISOString() : null })),
        () => callApi(`/api/discoveries/${card.id}`, { method: "PATCH", body: JSON.stringify({ done }) }),
      ),
    onMakeVideo: (card) =>
      run(
        (current) => patchCard(current, card.id, (entry) => ({ ...entry, video: { ...entry.video, status: "pending" } })),
        () => callApi("/api/explainers", { method: "POST", body: JSON.stringify({ discoveryId: card.id }) }),
      ),
  };

  const forgetMemory = (item: MemoryItem) =>
    run(
      (current) => ({ ...current, memory: current.memory.filter((entry) => entry.id !== item.id) }),
      () => callApi(`/api/memory?id=${encodeURIComponent(item.id)}`, { method: "DELETE" }),
    );

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
        digest: { headline: "", text: "" },
        week: current.week.map((day) => ({ ...day, questions: 0, emojis: [] })),
        weekTotals: { questions: 0, answered: 0, grownUp: 0, declined: 0, activitiesDone: 0 },
        discoveries: [],
        grownUp: [],
        declinedToday: 0,
        alerts: [],
        memory: [],
        stories: [],
      }),
      () => callApi("/api/erase", { method: "POST" }),
    );

  const tabs: { id: View; label: string; icon: ReactNode }[] = [
    { id: "today", label: "Today", icon: <SunIcon size={22} /> },
    { id: "child", label: name, icon: <HeartIcon size={22} /> },
    { id: "settings", label: "Settings", icon: <SlidersIcon size={22} /> },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <MascotProvider value={journal.mascot}>
        <div className="relative min-h-dvh overflow-x-clip">
          <Backdrop />
          <Header tabs={tabs} view={view} onNavigate={navigate} sync={sync} />

          <main className="relative mx-auto max-w-6xl px-4 pt-5 pb-32 sm:px-6 sm:pt-8 md:pb-20">
            {isClient ? (
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={view}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                >
                  {view === "today" && (
                    <TodayView journal={journal} freshIds={freshIds} actions={actions} onStoryWritten={refresh} />
                  )}
                  {view === "child" && (
                    <ChildView journal={journal} actions={actions} onForget={forgetMemory} onForgetAll={forgetAllMemory} />
                  )}
                  {view === "settings" && (
                    <SettingsView journal={journal} onSaved={refresh} onEraseAll={eraseAll} onOpenStudio={() => navigate("mascot")} />
                  )}
                  {view === "mascot" && <MascotStudio journal={journal} onBack={() => navigate("settings")} onSaved={refresh} />}
                </motion.div>
              </AnimatePresence>
            ) : (
              <LoadingPage />
            )}
          </main>

          <BottomTabs tabs={tabs} view={view} onNavigate={navigate} />

          <AnimatePresence>
            {toast && (
              <motion.p
                role="alert"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed inset-x-4 bottom-24 z-40 mx-auto max-w-sm rounded-2xl bg-navy-900 px-4 py-3 text-center text-sm font-semibold text-cream-50 shadow-card md:bottom-8"
              >
                {toast}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </MascotProvider>
    </MotionConfig>
  );
}

function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[560px] overflow-hidden">
      <div className="absolute -top-40 -left-24 size-96 rounded-full bg-coral-200/45 blur-3xl" />
      <div className="absolute -top-24 right-[-6rem] size-[28rem] rounded-full bg-mint-200/50 blur-3xl" />
      <div className="absolute top-72 left-1/3 size-72 rounded-full bg-sun-200/40 blur-3xl" />
    </div>
  );
}

type Tab = { id: View; label: string; icon: ReactNode };

/** The studio lives under Settings, so that tab stays lit there. */
const tabOf = (view: View): View => (view === "mascot" ? "settings" : view);

function Header({ tabs, view, onNavigate, sync }: { tabs: Tab[]; view: View; onNavigate: (view: View) => void; sync: SyncState }) {
  return (
    <header className="sticky top-0 z-30 border-b border-cream-200/70 bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <button type="button" onClick={() => onNavigate("today")} className="flex items-center gap-2.5 rounded-2xl">
          <OomiPebble face="idle" className="size-10" />
          <span className="text-left leading-none">
            <span className="block font-display text-2xl font-bold tracking-tight text-navy-900">oomi</span>
            <span className="block whitespace-nowrap text-[0.7rem] font-extrabold tracking-[0.14em] text-coral-600 uppercase">for parents</span>
          </span>
        </button>

        <nav aria-label="Main" className="mx-auto hidden md:block">
          <ul className="flex gap-1 rounded-full bg-white/80 p-1 shadow-sm ring-1 ring-cream-200">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  type="button"
                  aria-current={tabOf(view) === tab.id ? "page" : undefined}
                  onClick={() => onNavigate(tab.id)}
                  className={`relative flex items-center gap-2 rounded-full px-5 py-2 font-display text-base font-semibold transition-colors ${
                    tabOf(view) === tab.id ? "text-white" : "text-navy-600 hover:text-navy-900"
                  }`}
                >
                  {tabOf(view) === tab.id && (
                    <motion.span
                      layoutId="desktop-tab"
                      className="absolute inset-0 rounded-full bg-navy-900"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative">{tab.icon}</span>
                  <span className="relative">{tab.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <SyncDot sync={sync} />
          <DemoLink href="/oomi" label="Necklace" icon={<NecklaceIcon size={18} />} />
          <DemoLink href="/kids" label="Oomi TV" icon={<TvIcon size={18} />} />
        </div>
      </div>
    </header>
  );
}

function SyncDot({ sync }: { sync: SyncState }) {
  const live = sync === "live";
  return (
    <p
      role="status"
      title={live ? "Updates live" : "Reconnecting…"}
      className="flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-bold text-navy-600"
    >
      <span className={`relative flex size-2.5 ${live ? "text-mint-500" : "text-sun-500"}`}>
        {live && <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" />}
        <span className="relative inline-flex size-2.5 rounded-full bg-current" />
      </span>
      <span className="hidden sm:inline">{live ? "Live" : "Reconnecting…"}</span>
    </p>
  );
}

function DemoLink({ href, label, icon }: { href: string; label: string; icon: ReactNode }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex items-center gap-1.5 rounded-full bg-white/80 p-2.5 text-sm font-bold text-navy-700 shadow-sm ring-1 ring-cream-200 transition-colors hover:text-coral-600 lg:px-3.5 lg:py-2"
    >
      {icon}
      <span className="hidden lg:inline">{label}</span>
    </Link>
  );
}

function BottomTabs({ tabs, view, onNavigate }: { tabs: Tab[]; view: View; onNavigate: (view: View) => void }) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-cream-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-3 px-3 py-2">
        {tabs.map((tab) => {
          const active = tabOf(view) === tab.id;
          return (
            <li key={tab.id}>
              <button
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => onNavigate(tab.id)}
                className={`relative flex w-full flex-col items-center gap-0.5 rounded-2xl py-1.5 text-xs font-bold transition-colors ${
                  active ? "text-coral-600" : "text-navy-500"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="mobile-tab"
                    className="absolute inset-x-3 inset-y-0 rounded-2xl bg-coral-50"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">{tab.icon}</span>
                <span className="relative max-w-full truncate px-1">{tab.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function LoadingPage() {
  return (
    <div aria-busy="true" className="grid min-h-[60vh] place-items-center">
      <OomiPebble face="thinking" className="size-20" />
    </div>
  );
}
