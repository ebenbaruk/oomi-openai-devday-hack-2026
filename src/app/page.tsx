import Image from "next/image";
import Link from "next/link";

const LOOP = [
  { emoji: "❓", title: "A big question", text: "Press, ask, and Oomi answers in a few playful words." },
  { emoji: "✂️", title: "A real experiment", text: "Every answer ends with something to try for real, no screen." },
  { emoji: "🏡", title: "A shared moment", text: "Parents find the discovery and an activity to do together." },
];

export default function Home() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-cream-100">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-coral-200/60 blur-3xl" />
        <div className="absolute -right-32 top-24 h-[26rem] w-[26rem] rounded-full bg-mint-200/70 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/3 h-80 w-80 rounded-full bg-sun-300/30 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 pt-14 pb-16 text-center sm:px-6 sm:pt-20">
        <Image src="/brand/oomi-mascot.png" alt="Oomi" width={144} height={144} priority className="h-28 w-28 animate-float rounded-[32px] shadow-soft sm:h-36 sm:w-36" />
        <h1 className="mt-8 font-display text-6xl font-semibold tracking-tight text-navy-900 sm:text-7xl">oomi</h1>
        <p className="mt-3 font-display text-2xl text-coral-600 sm:text-3xl">A little companion for big questions.</p>
        <p className="mt-5 max-w-xl text-lg text-navy-700">
          We don&apos;t want kids spending more time with AI. We want AI to help kids spend more time discovering the world.
        </p>

        <div className="mt-10 grid w-full max-w-3xl gap-4 sm:grid-cols-2">
          <Link
            href="/oomi"
            className="group rounded-[28px] bg-gradient-to-br from-coral-300 to-coral-500 p-6 text-left text-white shadow-soft transition hover:-translate-y-1"
          >
            <span className="text-4xl">🧒</span>
            <h2 className="mt-3 font-display text-2xl font-semibold">The necklace</h2>
            <p className="mt-1 text-white/90">Hold the button, ask anything. This is what kids see.</p>
            <span className="mt-4 inline-block font-display font-semibold transition group-hover:translate-x-1">Meet Oomi →</span>
          </Link>
          <Link
            href="/parent"
            className="group rounded-[28px] bg-navy-900 p-6 text-left text-cream-50 shadow-soft transition hover:-translate-y-1"
          >
            <span className="text-4xl">📔</span>
            <h2 className="mt-3 font-display text-2xl font-semibold">The parent journal</h2>
            <p className="mt-1 text-cream-100/80">Today&apos;s discoveries, activities to share, bedtime stories and controls.</p>
            <span className="mt-4 inline-block font-display font-semibold text-mint-300 transition group-hover:translate-x-1">Open the journal →</span>
          </Link>
        </div>

        <ol className="mt-14 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
          {LOOP.map((step, index) => (
            <li key={step.title} className="rounded-[24px] bg-white/70 p-5 text-left shadow-card backdrop-blur">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-mint-200 font-display text-sm font-semibold text-mint-700">
                  {index + 1}
                </span>
                <span className="text-2xl">{step.emoji}</span>
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold text-navy-900">{step.title}</h3>
              <p className="mt-1 text-sm text-navy-700">{step.text}</p>
            </li>
          ))}
        </ol>

        <p className="mt-12 font-display text-navy-700/70">Not an AI best friend. A little companion for big discoveries.</p>
      </div>
    </main>
  );
}
