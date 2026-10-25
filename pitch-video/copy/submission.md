# Oomi: hackathon submission copy

Ready to paste into Devpost (or the organizers' form). Facts only: no necklace prototype yet (Oomi runs on a real Apple Watch and in a necklace simulator), and no real children used the prototype (adults played the kids).

---

## Project name

**Oomi**

## Tagline

1. **A little companion for big questions.** (current brand line)
2. **Every answer ends in a mission.**
3. **The AI necklace that sends kids outside.**
4. **Ask anything. Then go find out.**
5. **Less screen. More world.**

**Recommended: #2, "Every answer ends in a mission."** It says what makes Oomi different, not just what it is. Keep #1 as the brand line on the landing page and the end card.

## One-liner

Oomi is a tiny AI necklace that answers kids' questions out loud, then sends them on a real-world mission, and shares the discovery with their parents.

## 50 words

Oomi is a push-to-talk AI necklace for kids aged 6 to 10. A child asks "How do airplanes fly?" Oomi answers in three playful sentences, then sets a mission: fold two paper planes and race them. Parents get the spark, not a transcript. Every answer ends in a mission.

## 150 words

Kids are born question machines. Today, most of their answers come from a screen.

Oomi is a tiny AI necklace that does the opposite. A child holds the button and asks anything. Oomi answers in a few playful words, then turns the answer into a mission: a small experiment to do for real, in under 15 minutes, with no screen.

Every question passes a safety gate first, and gets one of three verdicts: answer, "ask a grown-up", or a gentle no. The server, not the voice model, decides what Oomi says. Oomi only listens while the button is held and never keeps the child's voice.

Parents get a journal of illustrated discoveries with something to do together, and a bedtime story made from the day.

We built all the software in 36 hours, in public. The necklace simulator already speaks the protocol of the real ESP32 necklace.

## ~400 words

Eli's little cousins never stop asking "why?". Every time he sees his aunts and uncles, they tell him about it: the endless questions, and how often the answer ends up being a screen. They wanted something better. So did we.

**Oomi is a tiny AI necklace for kids aged 6 to 10 that turns questions into real-world discoveries.**

The child holds one big button and asks: "How do airplanes fly?" Oomi's eyes go wide, then thoughtful, and it answers in a few playful sentences: "Wings push the air down, so the air pushes the plane up!" Then comes the part that matters: "Want to test it? Fold two paper planes, one with big wings, one with small ones. Which flies farther?"

**Every answer ends in a mission.** The best interaction is the one where the child puts Oomi down and goes to find out. When Leo comes back shouting "The big wings won!", Oomi remembers the mission and asks him why.

**For parents, Oomi is ultra simple.** No transcripts, no audio, no surveillance. At night, the parent journal shows what their child wondered about, as illustrated discovery cards with a "do it together" activity. Questions that deserve a grown-up show up as invitations to talk, not alerts. Then Oomi tells a bedtime story made from the day's discoveries, illustrated and narrated, with a real ending. On the family tablet, Oomi TV turns discoveries into short explainers that always end in a real-world mission. Kids can make Oomi their own in the mascot studio: its look, colour, name and voice.

**Safety is architecture, not a prompt.** Voice activity detection is off, so the voice model never speaks on its own. Each question goes through a gate (noise filter, rules, the Moderation API and a fast classifier) and gets one of three verdicts: answer, ask a grown-up, or decline. For the last two, the words are fixed by our server. Oomi's own answer is checked again before the audio ends. Oomi never says "I love you" and never asks a child to come back.

**What's real today:** all the software, end to end. Live voice with gpt-realtime, the safety gate, agentic memory, the parent journal, stories, Oomi TV and the mascot studio, in English and French. Oomi also runs on a real wrist today: a native Apple Watch app with push-to-talk, the same safety gate and the same parent journal. The necklace runs as a simulator that speaks exactly the protocol the ESP32 firmware will use. What's left is building the necklace itself.

We don't want kids spending more time with AI. We want AI to help kids spend more time discovering the world.

---

## Inspiration

Eli's little cousins ask "why?" all day long, and his aunts and uncles kept telling him the same thing: they love the questions, they don't always have the answers, and they don't want the answer to be another screen. Meanwhile, most AI toys are built to be a child's best friend: always listening, always asking them to stay. We wanted an AI that does the opposite and hands the child back to the world, and to their parents.

## What it does

- **Push-to-talk voice.** The child holds the button and asks. Oomi answers in a few short, playful sentences in the child's language (English or French), with expressive eyes that follow the real conversation state.
- **Every answer ends in a mission.** A concrete, screen-free experiment the child can do at home in under 15 minutes.
- **Memory that follows up.** Oomi remembers interests and open missions ("So, which plane flew farther?"). Parents can see and delete every item.
- **Three verdicts for every question:** answer, ask a grown-up, or a gentle decline. Distress signals always go to a trusted adult and alert the parent.
- **Parent journal.** Illustrated discovery cards, a "do it together" activity, and conversation starters for grown-up questions.
- **Bedtime stories** made from the day's discoveries, illustrated and narrated, with a real ending.
- **Oomi TV** for the family tablet: short explainers of the child's own discoveries. Nothing autoplays, and every video ends with a real-world mission.
- **Mascot studio.** Kids customize Oomi's look, colour, name and voice.
- **Necklace simulator** that speaks the same device protocol as the future ESP32 necklace.

## How we built it

- **Live voice:** the device opens a WebRTC session with `gpt-realtime` using an ephemeral key. Voice activity detection is off: on button release, the audio is committed and transcribed.
- **Server-controlled turns:** the transcript goes to our safety gate (noise filter → deterministic rules → Moderation API + a `gpt-5.4-nano` classifier with structured output). The gate returns a verdict, a face and the instructions for the reply. Only then does the device trigger a response.
- **Output check:** Oomi's answer text is moderated as soon as it's complete, before the audio ends, and swapped for a safe line if needed.
- **Brain:** a reasoning model turns each turn into a discovery card, a mission, structured memory facts and, at night, a story. Slow work runs in the background while Oomi is already talking.
- **Creative:** `gpt-image-2` for the illustrations, `gpt-4o-mini-tts` for narration.
- **Stack:** Next.js and strict TypeScript on Vercel (functions in Paris), Postgres on Supabase, Zod for every schema, Tailwind and Motion for the UI.
- **Evals:** a safety suite replays our test questions against the real gate, in both languages, and must pass 100%.
- **Fallback:** a turn-by-turn mode (transcribe → gate → Brain → TTS) behind one setting, in case the live session fails on stage.

## Challenges we ran into

- **Keeping real-time voice and real control.** Realtime models want to answer immediately. We turned VAD off and made our server trigger every response, while keeping latency low enough to feel instant.
- **Moderation in French.** Some harmless French questions got weak moderation flags. We learned to trust the classifier over weak flags, and warmed the gate up so the first question isn't slow.
- **Transcription hallucinating on silence.** Short presses and background noise produce phantom transcripts. A duration threshold and a list of known artefacts filter them out.
- **"Ask a grown-up" without sounding like a refusal.** Getting the tone warm, and turning it into a conversation starter for the parent, took many iterations.
- **Scope.** A necklace, a parent app, a tablet app, stories, videos and a mascot studio in 36 hours. We froze the MVP first and only added extras once the core loop was green.

## Accomplishments we're proud of

- The whole loop works, live: question → answer → mission → follow-up → parent card → bedtime story.
- A safety design we can show, not just describe: three verdicts, fixed words for sensitive cases, and an output check.
- An AI product for kids that is designed to be put down.
- English and French, end to end.
- About 55 commits in 36 hours, shared in public along the way.

## What we learned

- **Safety is a pipeline, not a prompt.** The model should never be the one deciding what a child hears.
- **The mission is the product.** Answering questions is easy. Getting a child to go and try something is the hard, valuable part.
- **Parents want a spark, not a transcript.** Less data made the parent experience better, not worse.
- **Build the protocol before the hardware.** Because the simulator speaks the device protocol, none of this weekend's work is lost when the necklace arrives.

## What's next

- **The real necklace:** an ESP32-S3 with a round screen, mic, speaker, one big button, a physical mic switch and a breakaway cord.
- **Families first:** families around us are already interested. We want to test with them, carefully, with parental consent and the privacy guarantees children's data requires (including zero data retention) in place first.
- **More missions:** a richer library of experiments by age, and seasonal missions to do outside.
- **A daily note** for parents by email.

---

## Why Oomi fits each track

### Hardware

Oomi is a hardware product by design: one button, a round screen showing only eyes, a mic LED, a physical mic switch and a breakaway cord. We built the software first, on purpose: the necklace simulator is a thin client that speaks exactly the protocol the ESP32-S3 firmware will use (session, gate, turn complete), and hardware devices already authenticate on the same API. The eyes are SVG/CSS animations designed to port to a small round display. And Oomi already runs on real hardware you can wear: a native Apple Watch app (on TestFlight) with hold-to-talk, haptics and the family's mascot, on the same safety gate and API. The next step is flashing the firmware onto the necklace.

### Impact

Most AI for kids is built to maximise time with the device. Oomi measures success by the time the child spends away from it. Every educational answer ends in a real-world mission. Parents get a spark and an activity to do together, not surveillance. The design rules are hard-coded: push-to-talk only, no audio stored, no "I love you", no "come back", sensitive questions sent to a grown-up, distress always escalated to an adult. It's built for curiosity, and for families spending more time together.

### Build in Public

We posted at kickoff on Saturday (first commit at 11:29) with a real question to parents: would you let your kid wear this? The spec, the sketches, the bugs and the wins were shared along the way, and the repo history tells the story in about 55 commits. The launch film itself shows the weekend: from a sketch on Saturday to live voice, memory, a parent journal and Oomi TV by Sunday.

---

## Built with

`OpenAI Realtime API` · `gpt-realtime` · `gpt-live-transcribe` · `OpenAI Moderation API` · `gpt-5.4-nano` · `gpt-6-luna` (Responses API) · `gpt-image-2` · `gpt-4o-mini-tts` · `WebRTC` · `Next.js` · `React` · `TypeScript` · `Vercel` · `Supabase` · `PostgreSQL` · `Zod` · `Tailwind CSS` · `Motion` · `Vitest` · `Remotion` (launch film) · `ESP32-S3` (planned)
