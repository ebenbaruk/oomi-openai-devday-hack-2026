import { Reveal } from "./reveal";
import { Arrow, SectionHeading } from "./ui";

const MODELS = [
  { model: "gpt-realtime-2.1", role: "Live voice" },
  { model: "gpt-live-transcribe", role: "Hears the question" },
  { model: "omni-moderation", role: "Screens questions and answers" },
  { model: "gpt-5.4-nano", role: "Safety verdict in ms" },
  { model: "gpt-6-luna", role: "The Brain: cards, memory, stories, explainers" },
  { model: "gpt-image-2", role: "Illustrations" },
  { model: "gpt-4o-mini-tts", role: "Bedtime narration" },
];

const DEVICES = ["On-screen simulator", "ESP32 necklace"];

export function UnderTheHood() {
  return (
    <section id="tech" className="scroll-mt-20 bg-navy-900 px-4 py-20 text-cream-50 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Under the hood" accent="grape" invert title="Built with OpenAI, end to end." />

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <Reveal>
            <ul className="grid grid-cols-2 gap-2.5">
              {MODELS.map((item) => (
                <li key={item.model} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 sm:px-4">
                  <p className="font-mono text-xs font-semibold sm:text-sm text-sun-300">{item.model}</p>
                  <p className="mt-0.5 text-sm text-navy-300">{item.role}</p>
                </li>
              ))}
              <li className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 sm:px-4">
                <p className="font-mono text-xs font-semibold sm:text-sm text-mint-300">Next.js + Postgres</p>
                <p className="mt-0.5 text-sm text-navy-300">App, API and journal</p>
              </li>
            </ul>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="h-full rounded-[28px] border border-white/10 bg-white/5 p-6">
              <h3 className="font-display text-xl font-semibold">One device protocol</h3>
              <p className="mt-2 text-navy-300">
                The simulator you can try today and the ESP32 necklace speak exactly the same protocol. Swapping the hardware in changes nothing on
                the server.
              </p>
              <div className="mt-6 flex flex-col items-stretch gap-3 font-display text-sm font-semibold sm:flex-row sm:items-center lg:flex-col lg:items-stretch xl:flex-row xl:items-center">
                <div className="flex flex-col gap-2">
                  {DEVICES.map((device) => (
                    <span key={device} className="rounded-xl bg-coral-400 px-3 py-2 text-center text-navy-900">
                      {device}
                    </span>
                  ))}
                </div>
                <Arrow className="mx-auto h-6 w-6 shrink-0 rotate-90 text-navy-400 sm:rotate-0 lg:rotate-90 xl:rotate-0" />
                <span className="flex-1 rounded-xl bg-mint-300 px-3 py-4 text-center text-navy-900">
                  Oomi server
                  <span className="block text-xs font-medium text-navy-700">safety gate · Brain · journal</span>
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
