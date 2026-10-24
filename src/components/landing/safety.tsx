import { Reveal } from "./reveal";
import { Check, Cross, Section, SectionHeading } from "./ui";
import { VerdictPicker } from "./verdict-picker";

const PIPELINE = [
  { title: "Moderation", text: "Every question is screened first." },
  { title: "House rules", text: "Hard lists of no-go and grown-up topics." },
  { title: "Verdict", text: "A fast classifier picks answer, grown-up or no in a few hundred ms." },
  { title: "Server speaks", text: "Our server triggers each reply. The voice model never talks on its own." },
  { title: "Checked again", text: "The answer is moderated as it plays, and cut if anything slips." },
];

const PROMISES = [
  {
    title: "If a child is hurting",
    text: "Oomi gently sends them to a trusted grown-up, and parents get a clear alert.",
    tone: "bg-bubble-100",
  },
  {
    title: "Private by default",
    text: "No audio stored. No full transcripts. Parents see topics, and can erase everything.",
    tone: "bg-sky-100",
  },
];

const NEVER = ["Says “I love you” or “I'm your best friend”", "Asks the child to come back", "Pretends to have feelings"];

export function Safety() {
  return (
    <Section id="safety">
      <SectionHeading
        eyebrow="Safety by design"
        accent="mint"
        title="Not a “be nice” prompt. An architecture."
        intro="Every question gets one of three verdicts before Oomi says a word. Try them."
      />

      <div className="mt-14 grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-10">
        <Reveal>
          <VerdictPicker />
        </Reveal>

        <Reveal delay={0.1}>
          <h3 className="font-display text-2xl font-semibold">The server decides what Oomi says</h3>
          <ol className="mt-5 space-y-3">
            {PIPELINE.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mint-200 font-display text-sm font-semibold text-mint-700">
                  {index + 1}
                </span>
                <p className="pt-0.5 text-navy-700">
                  <span className="font-display font-semibold text-navy-900">{step.title}. </span>
                  {step.text}
                </p>
              </li>
            ))}
          </ol>
          <p className="mt-5 rounded-2xl bg-cream-200 px-4 py-3 text-sm text-navy-700">
            Any step fails or times out? Oomi falls back to a safe sentence. Never a free answer.
          </p>
        </Reveal>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {PROMISES.map((promise, index) => (
          <Reveal key={promise.title} delay={index * 0.06}>
            <div className={`h-full rounded-[28px] p-6 ${promise.tone}`}>
              <h3 className="flex items-center gap-2 font-display text-xl font-semibold">
                <Check className="h-5 w-5 text-mint-600" />
                {promise.title}
              </h3>
              <p className="mt-2 text-navy-700">{promise.text}</p>
            </div>
          </Reveal>
        ))}
        <Reveal delay={0.12}>
          <div className="h-full rounded-[28px] bg-navy-900 p-6 text-cream-50">
            <h3 className="font-display text-xl font-semibold">Not an AI best friend</h3>
            <p className="mt-2 font-display text-sm font-semibold tracking-wide text-sun-300 uppercase">Oomi never</p>
            <ul className="mt-2 space-y-1.5 text-navy-300">
              {NEVER.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Cross className="mt-1 h-4 w-4 shrink-0 text-coral-400" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-cream-50">It always points back to the people who love them.</p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
