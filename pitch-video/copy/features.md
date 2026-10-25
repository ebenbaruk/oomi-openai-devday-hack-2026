# Everything Oomi does (built in 36 hours)

Pulled from the repo (`README.md`, `doc/SPEC.md`) and the commit log of every branch. ⭐ = shown in the launch film.

## For the child: the necklace

- ⭐ **Push-to-talk.** Hold the button, ask, let go. Oomi never listens on its own (voice activity detection is off) and the mic LED shows when it is listening.
- ⭐ **Live voice.** Realtime conversation (`gpt-realtime-2.1`), with answers in a few playful words.
- ⭐ **Every answer ends in a mission.** A tiny real-world experiment ("Fold two paper planes…").
- ⭐ **Memory that follows up.** Oomi remembers interests, open challenges and what the child learned ("So, which plane flew farther?").
- ⭐ **Animated eyes.** 8 expressions: idle, listening, thinking, speaking, happy, curious, sleepy…
- **English and French.** Oomi answers in the language the child speaks, with no setting needed.
- **Bedtime hours.** Outside the allowed hours, Oomi sleeps and says so.
- **Mic kill switch** on the simulator.
- **Bedtime stories on request.**

## Safety by design

- ⭐ **Three verdicts for every question.** *Answer*, *ask a grown-up* (with fixed, kind words), or *decline kindly* with a redirection.
- **The server decides what Oomi says.** The question passes the gate (noise filter → rules → Moderation API + nano classifier) before the voice model may speak. For *grown-up* and *decline*, the question never enters the model's conversation.
- **Oomi's own answer is checked again** by the Moderation API as soon as its text is complete, and replaced if needed.
- **Distress is never just declined.** For example "someone is hurting me": the child is sent to a trusted grown-up and the parent gets an alert.
- ⭐ **No audio and no full transcripts stored.**
- **Safety test suite** in both languages, which must pass 100% before a demo (`npm run eval:safety`).

## For parents: the family journal

- ⭐ **The day in one line.** "Leo asked 7 big questions today", plus the week at a glance.
- ⭐ **Illustrated discovery cards** with a **"Do it together"** activity (illustrations by `gpt-image-2`).
- ⭐ **"Ask a grown-up" cards** with a conversation starter.
- ⭐ **Illustrated bedtime stories** starring the child and made from the day, with narration.
- **What Oomi remembers**, in plain words. Every item can be deleted.
- **Safety report**, daily note and settings (allowed hours).
- **Sign-in** for parents.

## Oomi TV (family tablet)

- ⭐ **Motion-design explainers of the child's own questions**, in 4 scenes: hook, big idea, "whoa" detail, back to the real world. They have generated pictures, per-scene narration and animated captions.
- **Every video ends with a real-world mission. Nothing autoplays.**
- Bedtime picture books.

## Mascot studio

- ⭐ **Make Oomi your own.** Pick a character, colours, name, voice and personality. The mascot follows everywhere: necklace, Oomi TV, parent app and watch.

## Apple Watch app (Akram)

- ⭐ **Push-to-talk on the wrist**, with approved OpenAI speech played on the watch.
- Persistent, automatic pairing with the parent account, and recovery when the network drops.
- The family mascot syncs to the watch.
- Watch questions show up in the parent journal.
- Shipped to TestFlight (build 2).

## Under the hood

- **Hardware-ready device protocol.** The simulator is a thin client, so ESP32 firmware only has to make the same 5 calls.
- **Fallback "turn by turn" mode** if the live session is unavailable: transcribe → same gate → Brain → TTS.
- **Automatic failover** to backup OpenAI keys when a key is rate limited or out of credits.
- **Models:**
  - `gpt-realtime-2.1` for the live voice
  - `gpt-live-transcribe` and `gpt-transcribe` for transcription
  - `gpt-5.4-nano` as the safety classifier
  - `omni-moderation-latest` for moderation
  - `gpt-6-luna` for the Brain (cards, memory, stories, explainers)
  - `gpt-image-2` for illustrations
  - `gpt-4o-mini-tts` for narration
- **Stack:** Next.js, Postgres (Supabase), Vercel (functions in Paris), CI pipelines.

## The 36-hour timeline (real commit times)

| When | Milestone |
|---|---|
| SAT 11:29 | First commit, spec, concept sketches |
| SAT 13:43 | Simulator, server-controlled voice, safety pipeline |
| SAT 15:30 | Parent dashboard redesigned as a family journal |
| SAT 15:47 | First Apple Watch mascot prototype |
| SAT 18:36 | Backend: safety gate, live voice sessions, Brain, journal API |
| SAT 19:44 | OpenAI speech delivered to the Watch |
| SAT 23:01 | Oomi TV, French, demo week, landing page |
| SAT 23:52 | Mascot studio, themed across every surface |
| SUN 12:12 | Watch TestFlight build 2 |
| SUN 14:03 | Watch questions in the parent journal |

55 commits by 3 builders, built in public.
