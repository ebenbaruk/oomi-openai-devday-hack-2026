"use client";

import { AnimatePresence, MotionConfig } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import type { KidVideo, StoryCard } from "@/lib/contracts";
import { ExplainerPlayer } from "./explainer-player";
import { useKidLibrary } from "./kid-api";
import { KidsHome } from "./kids-home";
import { OomiBuddy } from "./oomi-buddy";
import { StoryReader } from "./story-reader";

type Screen = { kind: "home" } | { kind: "video"; video: KidVideo } | { kind: "story"; story: StoryCard };

/** Oomi TV: the child rewatches their own discoveries and bedtime stories, one at a time. */
export function OomiTv() {
  const { state, refresh } = useKidLibrary();
  const [screen, setScreen] = useState<Screen>({ kind: "home" });

  const goHome = () => {
    setScreen({ kind: "home" });
    // A video may have been made while watching: refresh the tiles.
    void refresh();
  };

  return (
    <MotionConfig reducedMotion="user">
      {/* Discreet way out for the demo, small and faint so a child won't wander into it. */}
      <Link
        href="/"
        aria-label="Leave Oomi TV"
        className="fixed top-2 right-2 z-[60] rounded-full px-2 py-1 text-[11px] font-semibold text-navy-900/25 hover:text-navy-900/60"
      >
        exit
      </Link>

      {state.status === "ready" ? (
        <KidsHome
          library={state.data}
          onPlayVideo={(video) => setScreen({ kind: "video", video })}
          onOpenStory={(story) => setScreen({ kind: "story", story })}
        />
      ) : (
        <main className="bg-dots grid min-h-dvh place-items-center bg-paper px-6 text-center">
          <div className="flex flex-col items-center gap-5">
            <OomiBuddy face={state.status === "error" ? "curious" : "thinking"} className="size-32" />
            {state.status === "error" && (
              <>
                <p className="font-display text-3xl font-semibold">Oomi TV is waking up…</p>
                <button
                  type="button"
                  onClick={() => void refresh()}
                  className="btn-chunky rounded-full bg-sun-300 px-8 py-3 font-display text-2xl font-bold"
                >
                  Try again
                </button>
              </>
            )}
          </div>
        </main>
      )}

      <AnimatePresence>
        {screen.kind === "video" && state.status === "ready" && (
          <ExplainerPlayer
            key={screen.video.discoveryId}
            video={screen.video}
            childName={state.data.child.firstName}
            onClose={goHome}
          />
        )}
        {screen.kind === "story" && state.status === "ready" && (
          <StoryReader key={screen.story.id} story={screen.story} childName={state.data.child.firstName} onClose={goHome} />
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
