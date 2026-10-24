"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { useMascot } from "@/components/mascot/mascot-context";
import type { KidLibrary, KidVideo, StoryCard } from "@/lib/contracts";
import { MoonShape, PlayIcon, StarShape } from "./icons";
import { OomiBuddy } from "./oomi-buddy";
import { tileSwatch } from "./palette";
import { KidImage, SpeechBubble, Twinkles } from "./ui";

type Props = {
  library: KidLibrary;
  onPlayVideo: (video: KidVideo) => void;
  onOpenStory: (story: StoryCard) => void;
};

const TILT = ["-rotate-[1.5deg]", "rotate-[1deg]", "-rotate-[0.5deg]", "rotate-[1.5deg]"];

function isToday(iso: string): boolean {
  return new Date(iso).toDateString() === new Date().toDateString();
}

export function KidsHome({ library, onPlayVideo, onOpenStory }: Props) {
  const name = library.child.firstName;
  return (
    <main className="bg-dots min-h-dvh overflow-x-hidden bg-paper pb-16">
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-8 sm:pt-10">
        <Greeting name={name} resting={!library.videosEnabled} />

        {library.videosEnabled ? (
          <section aria-labelledby="videos-title" className="mt-8 sm:mt-12">
            <SectionTitle id="videos-title" color="bg-sky-300">
              My discoveries
            </SectionTitle>
            {library.videos.length === 0 ? (
              <EmptyVideos />
            ) : (
              <ul className="mt-5 grid grid-cols-2 gap-4 sm:gap-7 lg:grid-cols-3">
                {library.videos.map((video, index) => (
                  <motion.li
                    key={video.discoveryId}
                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 + index * 0.06 }}
                  >
                    <VideoTile video={video} index={index} onPlay={() => onPlayVideo(video)} />
                  </motion.li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <RestingCard name={name} />
        )}

        {library.stories.length > 0 && <Bookshelf stories={library.stories} onOpen={onOpenStory} />}
      </div>
    </main>
  );
}

function Greeting({ name, resting }: { name: string; resting: boolean }) {
  const [waves, setWaves] = useState(0);
  const buddyName = useMascot()?.config.name ?? "Oomi";
  // A renamed companion introduces itself; the classic Oomi doesn't need to.
  const intro = buddyName === "Oomi" ? "" : `I'm ${buddyName}! `;
  return (
    <header className="flex items-center gap-5 sm:gap-8">
      <motion.button
        type="button"
        aria-label={`Say hi to ${buddyName}`}
        onClick={() => setWaves((count) => count + 1)}
        animate={waves ? { rotate: [0, -12, 10, -6, 0], scale: [1, 1.08, 1] } : undefined}
        key={waves}
        transition={{ duration: 0.6 }}
        className="rounded-full"
      >
        <OomiBuddy face={resting ? "sleep" : waves % 2 ? "happy" : "idle"} className="size-24 sm:size-36" />
      </motion.button>
      <motion.div
        initial={{ opacity: 0, x: -20, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.15 }}
      >
        <SpeechBubble className="-rotate-1">
          <h1 className="font-display text-4xl leading-none font-semibold tracking-tight sm:text-6xl">Hi {name}!</h1>
          <p className="mt-1.5 font-display text-base font-medium text-navy-600 sm:text-xl">
            {intro}
            {resting ? "Oomi TV is resting." : "Let's watch what you discovered!"}
          </p>
        </SpeechBubble>
      </motion.div>
    </header>
  );
}

function SectionTitle({ id, color, children }: { id: string; color: string; children: string }) {
  return (
    <h2 id={id} className="flex items-center gap-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
      <span className={`sticker inline-block size-5 rotate-12 rounded-md ${color}`} aria-hidden />
      {children}
    </h2>
  );
}

function VideoTile({ video, index, onPlay }: { video: KidVideo; index: number; onPlay: () => void }) {
  const swatch = tileSwatch(index);
  const tilt = TILT[index % TILT.length];
  const fresh = isToday(video.createdAt);
  const making = video.video.status === "pending";
  return (
    <motion.button
      type="button"
      onClick={onPlay}
      aria-label={`Watch: ${video.title}`}
      whileHover={{ y: -6, rotate: 0 }}
      whileTap={{ scale: 0.95, y: 2 }}
      transition={{ type: "spring", stiffness: 400, damping: 18 }}
      className={`sticker-lg group relative block w-full rounded-[1.75rem] p-2.5 text-left sm:rounded-[2.25rem] sm:p-3.5 ${swatch.bg} ${tilt}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] border-[2.5px] border-navy-900 bg-cream-50 sm:rounded-[1.6rem]">
        <KidImage
          src={video.imageUrl}
          className={`size-full ${swatch.soft}`}
          fallback={<span className="text-6xl sm:text-8xl">{video.emoji}</span>}
        />
        {video.imageUrl && (
          <span className="sticker absolute top-2 left-2 grid size-11 -rotate-6 place-items-center rounded-2xl bg-cream-50 text-2xl sm:size-14 sm:text-3xl">
            {video.emoji}
          </span>
        )}
        {fresh && (
          <span className="absolute top-2 right-2 grid size-14 rotate-12 place-items-center sm:size-16" aria-label="New">
            <StarShape className="absolute inset-0 size-full text-sun-300" />
            <span className="relative font-display text-xs font-bold tracking-wide sm:text-sm">NEW</span>
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-2 px-1 pt-2.5 sm:pt-3.5">
        <p className="line-clamp-2 font-display text-base leading-tight font-semibold sm:text-2xl">{video.title}</p>
        <span
          className={`sticker grid size-12 shrink-0 place-items-center rounded-full transition-transform group-hover:scale-110 sm:size-16 ${making ? "bg-cream-50" : "bg-mint-300"}`}
          aria-hidden
        >
          {making ? (
            <motion.span
              className="size-6 rounded-full border-4 border-navy-900 border-t-transparent sm:size-7"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          ) : (
            <PlayIcon className="size-6 translate-x-0.5 sm:size-8" />
          )}
        </span>
      </div>
    </motion.button>
  );
}

function EmptyVideos() {
  return (
    <div className="sticker mt-5 flex items-center gap-5 rounded-[2rem] bg-cream-50 p-6 sm:p-8">
      <OomiBuddy face="curious" className="size-20" />
      <p className="font-display text-xl font-medium sm:text-2xl">Ask Oomi a big question, and your video will show up here!</p>
    </div>
  );
}

function RestingCard({ name }: { name: string }) {
  return (
    <section className="sticker-lg relative mt-10 overflow-hidden rounded-[2.5rem] bg-navy-800 px-6 py-12 text-center text-cream-50 sm:py-16">
      <Twinkles />
      <MoonShape className="absolute top-8 right-10 size-16 text-sun-200 sm:size-24" />
      <OomiBuddy face="sleep" className="mx-auto size-32 sm:size-44" />
      <h2 className="mt-6 font-display text-3xl font-semibold tracking-tight sm:text-5xl">Oomi TV is resting</h2>
      <p className="mx-auto mt-3 max-w-md font-display text-lg text-cream-200/90 sm:text-2xl">
        The best adventures are outside, {name}. Go explore!
      </p>
    </section>
  );
}

const BOOK_COLORS = ["bg-grape-300", "bg-sky-300", "bg-bubble-300", "bg-mint-300", "bg-sun-300"];

function Bookshelf({ stories, onOpen }: { stories: StoryCard[]; onOpen: (story: StoryCard) => void }) {
  return (
    <section aria-labelledby="stories-title" className="mt-12 sm:mt-16">
      <SectionTitle id="stories-title" color="bg-grape-300">
        Bedtime stories
      </SectionTitle>
      <div className="sticker-lg relative mt-5 overflow-hidden rounded-[2.25rem] bg-navy-800 px-4 pt-8 sm:px-8 sm:pt-10">
        <Twinkles />
        <MoonShape className="absolute top-5 right-6 size-12 text-sun-200 sm:size-16" />
        <ul className="relative flex items-end gap-4 overflow-x-auto pb-0 sm:gap-7 [&::-webkit-scrollbar]:hidden">
          {stories.map((story, index) => (
            <li key={story.id} className="shrink-0">
              <motion.button
                type="button"
                onClick={() => onOpen(story)}
                aria-label={`Read: ${story.title}`}
                whileHover={{ y: -10, rotate: index % 2 ? 2 : -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
                className={`relative block w-36 overflow-hidden rounded-r-2xl rounded-l-md border-[3px] border-navy-900 text-left sm:w-48 lg:w-56 ${BOOK_COLORS[index % BOOK_COLORS.length]}`}
              >
                <span className="absolute inset-y-0 left-0 z-10 w-3 border-r-[2.5px] border-navy-900 bg-navy-900/25" aria-hidden />
                <div className="ml-3 p-2.5 pb-3">
                  <KidImage
                    src={story.pages[0]?.imageUrl ?? null}
                    className="aspect-[4/5] w-full rounded-xl border-2 border-navy-900 bg-cream-50"
                    fallback={<MoonShape className="size-12 text-sun-300" />}
                  />
                  <p className="mt-2 line-clamp-2 font-display text-sm leading-tight font-semibold sm:text-base">{story.title}</p>
                </div>
              </motion.button>
            </li>
          ))}
        </ul>
        {/* The shelf plank */}
        <div className="relative -mx-4 h-5 border-t-[3px] border-navy-900 bg-coral-400 sm:-mx-8" aria-hidden />
      </div>
    </section>
  );
}
