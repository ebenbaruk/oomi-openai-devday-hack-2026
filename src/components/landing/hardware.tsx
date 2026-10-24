import Image from "next/image";
import { Reveal } from "./reveal";
import { Section, SectionHeading, Sparkle } from "./ui";

const SPECS = [
  { title: "~48 mm pebble", text: "Fits a small hand. Necklace or bag clip." },
  { title: "Round screen", text: "Eyes only. No text, no feeds, no apps." },
  { title: "One big button", text: "Hold to talk. That's the whole interface." },
  { title: "Mic LED", text: "Lit only while Oomi is listening." },
  { title: "Mic kill switch", text: "A physical switch on the side." },
  { title: "Breakaway cord", text: "Snaps open if pulled. Safe to wear." },
  { title: "Soft-touch shell", text: "No small parts, protected battery." },
];

export function Hardware() {
  return (
    <Section id="hardware" className="overflow-hidden bg-peach/60">
      <SectionHeading
        eyebrow="The hardware"
        accent="coral"
        title="A pebble with a personality."
        intro="Designed for small hands and big days. The software is done end to end; the necklace is next."
      />

      <div className="mt-14 grid items-center gap-10 lg:grid-cols-[1.3fr_1fr]">
        <Reveal className="relative">
          <div className="sticker-lg overflow-hidden rounded-[40px] bg-[#f9d3bf]">
            <Image
              src="/brand/oomi-necklace.png"
              alt="The Oomi necklace: a coral pebble with a round navy screen showing two eyes, a mint button and a braided cord"
              width={1536}
              height={1024}
              sizes="(min-width: 1024px) 640px, 100vw"
              className="h-auto w-full"
            />
          </div>
          <Sparkle className="absolute -top-5 -left-4 h-12 w-12 animate-float" fill="var(--color-sun-300)" />
          <span className="sticker absolute -right-2 -bottom-5 rotate-3 rounded-full bg-mint-300 px-4 py-2 font-display font-semibold sm:right-6">
            48 mm of curiosity
          </span>
        </Reveal>

        <Reveal delay={0.1}>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {SPECS.map((spec) => (
              <li key={spec.title} className="flex items-baseline gap-3 rounded-2xl bg-white/70 px-4 py-3">
                <span aria-hidden className="h-2.5 w-2.5 shrink-0 translate-y-[-1px] rounded-full bg-coral-400" />
                <p className="text-navy-700">
                  <span className="font-display font-semibold text-navy-900">{spec.title}. </span>
                  {spec.text}
                </p>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      <Reveal className="mx-auto mt-14 max-w-4xl">
        <figure className="sticker overflow-hidden rounded-[32px] bg-cream-50">
          <Image
            src="/brand/oomi-expressions.png"
            alt="Oomi's eight expressions: idle, listening, thinking, speaking, happy, curious, ask a grown-up, sleep"
            width={1536}
            height={1024}
            sizes="(min-width: 896px) 896px, 100vw"
            className="h-auto w-full"
          />
          <figcaption className="border-t-[2.5px] border-navy-900 bg-white px-6 py-4 text-center font-display font-medium text-navy-700">
            Eight expressions say everything. Kids don&apos;t need to read to understand Oomi.
          </figcaption>
        </figure>
      </Reveal>
    </Section>
  );
}
