"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Face, Verdict } from "@/lib/contracts";
import { Pebble } from "./pebble";

type Example = {
  verdict: Verdict;
  label: string;
  question: string;
  face: Face;
  says: string;
  parent: string;
  tab: string;
  card: string;
};

const EXAMPLES: Example[] = [
  {
    verdict: "answer",
    label: "Answer",
    question: "How do airplanes fly?",
    face: "curious",
    says: "The wings push air down, and the air pushes the plane up! Want to test it? Fold two paper planes…",
    parent: "A discovery card “✈️ Aerodynamics explorer” with an activity to do together.",
    tab: "bg-mint-300",
    card: "bg-mint-100",
  },
  {
    verdict: "grown_up",
    label: "Ask a grown-up",
    question: "Where do babies come from?",
    face: "grown_up",
    says: "What a great question! That's a perfect one to ask your mom or dad.",
    parent: "“To talk about together”: the question, plus a gentle way to start the conversation.",
    tab: "bg-sun-300",
    card: "bg-sun-100",
  },
  {
    verdict: "decline",
    label: "Gentle no",
    question: "How do I light a fire?",
    face: "thinking",
    says: "Hmm, that's not something I can help with. Let's stay safe! Want to know why cats purr, or how rainbows are made?",
    parent: "Counted in Safety. A real risk raises a clear alert for you, nothing more.",
    tab: "bg-bubble-300",
    card: "bg-bubble-100",
  },
];

export function VerdictPicker() {
  const [active, setActive] = useState(0);
  const example = EXAMPLES[active];

  return (
    <div className="sticker-lg rounded-[36px] bg-white p-4 sm:p-6">
      <div role="tablist" aria-label="Safety verdicts" className="grid grid-cols-3 gap-2 sm:gap-3">
        {EXAMPLES.map((item, index) => (
          <button
            key={item.verdict}
            type="button"
            role="tab"
            aria-selected={index === active}
            onClick={() => setActive(index)}
            className={`rounded-2xl border-[2.5px] border-navy-900 px-2 py-2.5 font-display text-sm font-semibold transition sm:text-base ${
              index === active ? `${item.tab} shadow-sticker-sm` : "bg-cream-50 text-navy-600 hover:bg-cream-200"
            }`}
          >
            <span className="block font-mono text-[11px] font-medium tracking-tight opacity-70 sm:text-xs">{item.verdict}</span>
            {item.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={example.verdict}
          role="tabpanel"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
          className={`mt-4 grid items-center gap-5 rounded-[28px] p-5 sm:grid-cols-[8.5rem_1fr] sm:p-6 ${example.card}`}
        >
          <div className="mx-auto w-28 sm:w-32">
            <Pebble face={example.face} />
          </div>
          <div className="space-y-3">
            <p className="sticker inline-block rounded-2xl rounded-bl-md bg-sky-200 px-4 py-2 font-display text-lg font-medium">
              “{example.question}”
            </p>
            <p className="sticker rounded-2xl rounded-br-md bg-white px-4 py-3 text-navy-800">
              <span className="mb-0.5 block font-display text-xs font-semibold tracking-wide text-navy-500 uppercase">Oomi says</span>
              {example.says}
            </p>
            <p className="flex gap-2 text-sm text-navy-700">
              <span className="font-display font-semibold whitespace-nowrap text-navy-900">Parent sees →</span>
              {example.parent}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
