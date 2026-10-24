import Link from "next/link";
import { LiveOomi } from "./live-oomi";
import { Arrow, Sparkle, Squiggle, Star } from "./ui";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#safety", label: "Safety" },
  { href: "#hardware", label: "Hardware" },
];

function Logo() {
  return (
    <span className="flex items-center gap-2 font-display text-2xl font-semibold tracking-tight text-navy-900">
      <span aria-hidden className="relative h-8 w-7 rounded-[50%_50%_46%_46%/56%_56%_44%_44%] bg-coral-400 shadow-[inset_-3px_-4px_6px_rgb(176_61_34/0.35)]">
        <span className="absolute top-[22%] left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-navy-900" />
      </span>
      oomi
    </span>
  );
}

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-navy-900/5 bg-paper/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Oomi home">
          <Logo />
        </Link>
        <ul className="hidden items-center gap-7 font-display font-medium text-navy-700 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="transition hover:text-coral-600">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <Link href="/oomi" className="btn-chunky rounded-full bg-coral-400 px-4 py-2 font-display text-sm font-semibold text-navy-900 sm:px-5">
          Try the demo
        </Link>
      </nav>
    </header>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-dots px-4 pt-8 pb-20 sm:px-6 sm:pt-12 sm:pb-24">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute top-10 -right-24 h-[34rem] w-[34rem] rounded-full bg-peach/80 blur-3xl" />
        <div className="absolute -bottom-40 -left-24 h-[26rem] w-[26rem] rounded-full bg-mint-100 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-8">
        <div className="text-center lg:text-left">
          <span className="sticker inline-flex -rotate-2 items-center gap-2 rounded-full bg-white px-4 py-1.5 font-display text-sm font-semibold">
            <span className="h-2.5 w-2.5 rounded-full bg-mint-400" />
            Built at OpenAI DevDay Hackathon 2026
          </span>

          <h1 className="mt-6 font-display text-[clamp(2.75rem,6vw,4.75rem)] leading-[0.95] font-semibold tracking-[-0.025em] text-balance text-navy-900">
            A little companion for{" "}
            <span className="relative inline-block whitespace-nowrap text-coral-500">
              big questions.
              <Squiggle className="absolute -bottom-3 left-0 h-4 w-full sm:-bottom-4 sm:h-5" stroke="var(--color-sun-400)" />
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-xl text-lg text-pretty text-navy-700 sm:text-xl lg:mx-0">
            Oomi is a tiny AI explorer kids wear as a necklace. Hold the button, ask anything, then go try it for real.{" "}
            <strong className="font-bold text-navy-900">
              We don&apos;t want kids spending more time with AI. We want AI to help kids spend more time discovering the world.
            </strong>
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <Link
              href="/oomi"
              className="btn-chunky group inline-flex items-center gap-2 rounded-full bg-coral-400 px-7 py-4 font-display text-lg font-semibold text-navy-900"
            >
              Try the live demo
              <Arrow className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/parent" className="btn-chunky rounded-full bg-white px-7 py-4 font-display text-lg font-semibold text-navy-900">
              See the parent app
            </Link>
          </div>

          <ul className="mt-9 flex flex-wrap justify-center gap-x-6 gap-y-2 font-display text-sm font-medium text-navy-600 lg:justify-start">
            <li>Ages 6–10</li>
            <li aria-hidden className="hidden sm:block">·</li>
            <li>Push-to-talk only</li>
            <li aria-hidden className="hidden sm:block">·</li>
            <li>No audio stored</li>
            <li aria-hidden className="hidden sm:block">·</li>
            <li>English &amp; French</li>
          </ul>
        </div>

        <div className="relative">
          <Star className="absolute top-6 left-[6%] h-10 w-10 animate-float [animation-delay:-2s] sm:h-12 sm:w-12" />
          <Sparkle className="absolute right-[4%] bottom-24 h-9 w-9 animate-float [animation-delay:-4s]" />
          <Sparkle className="absolute bottom-6 left-[12%] h-6 w-6 animate-float" fill="var(--color-grape-300)" />
          <Star className="absolute top-36 right-[8%] h-6 w-6 animate-float [animation-delay:-1s]" fill="var(--color-sky-300)" />
          <LiveOomi />
          <p className="mt-2 text-center font-display text-sm text-navy-500">Hover to say hi · tap to replay</p>
        </div>
      </div>
    </section>
  );
}
