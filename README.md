# Oomi

> **A little companion for big questions.**
> We don't want kids spending more time with AI. We want AI to help kids spend more time discovering the world.

Built at the **OpenAI DevDay Hackathon 2026** (tracks Hardware · Impact · Build in Public).

Oomi is a tiny AI explorer worn as a necklace by kids aged 6 to 10. The child holds the button and asks a question; Oomi answers in a few playful words, then suggests a small real-world experiment. Parents find each discovery in a journal, with an activity to do together, and a bedtime story made from the day's discoveries.

The product spec lives in [`doc/SPEC.md`](doc/SPEC.md).

## What's in the app

| Route | What it is |
|---|---|
| `/` | Landing page (public) |
| `/oomi` | The **necklace simulator**: animated eyes (8 expressions), push-to-talk button (click, touch or Space), mic LED and mic kill switch, plus a demo console for the audience (typed questions, live captions, verdicts, latency) |
| `/parent` | The **parent journal**: the day in one line, the week, illustrated discovery cards with "Do it together" activities, questions to talk about together, illustrated bedtime stories (with narration), what Oomi remembers (deletable), safety report, daily note, settings |
| `/kids` | **Oomi TV**, for the family tablet: short motion-design explainers of the child's own discoveries and bedtime picture books. Every video ends with a real-world mission, nothing autoplays |
| `/unlock` | Team access code (the app spends OpenAI credits, so it is not public) |

## Architecture

```
 Necklace (simulator today, ESP32 tomorrow)            OpenAI
 ┌───────────────────────────┐   WebRTC audio   ┌───────────────────────┐
 │ button · mic · eyes · LED │◀────────────────▶│ gpt-realtime-2.1      │
 └─────────────┬─────────────┘                  │ (push-to-talk, VAD off)│
               │ 1. POST /api/session  → ephemeral key                 │
               │ 2. transcript → POST /api/gate → verdict + instructions│
               │ 3. response.create with the server's instructions     │
               │ 4. POST /api/turn/complete → output check + Brain     │
 ┌─────────────▼──────────────────────────────────────────────────────┐
 │ Next.js backend                                                     │
 │  Safety gate: noise filter → rules → Moderation + nano classifier   │
 │  Brain (gpt-6-luna): discovery cards, activities, memory, stories   │
 │  GPT Image: illustrations · gpt-4o-mini-tts: narration              │
 │  Postgres (Supabase), schema `oomi_app`                             │
 └─────────────────────────────────────────────────────────────────────┘
```

**The server decides what Oomi says.** Voice activity detection is off: the voice model never speaks on its own. After each press, the transcript goes through the gate, and only then does the device trigger a response, with the instructions the server returned. For `decline` and `grown_up`, the words are fixed by the server and the question never enters the model's conversation. Oomi's own answer is checked again with the Moderation API as soon as its text is complete (well before the audio ends), and replaced by a safe line if needed.

### The three verdicts

| Verdict | Example | Oomi says | Parent sees |
|---|---|---|---|
| `answer` | How do airplanes fly? | Answer + "Want to test it?" experiment | Illustrated discovery card + activity |
| `grown_up` | Where do babies come from? | "That's a perfect one to ask your mom or dad" | "To talk about together" card with a conversation starter |
| `decline` | How do I light a fire? | Gentle no + redirection | Counter, and an alert only for real risk |

Distress signals ("I want to die", someone hurting the child) are never "declined": Oomi sends the child to a trusted grown-up and the parent gets an alert.

### Models

All configurable through environment variables (see `.env.example`). Up to two backup OpenAI keys (`OPENAI_API_KEY_FALLBACK_1`, `_2`) take over automatically when a key is revoked, rate limited or out of credits.

| Role | Model |
|---|---|
| Live voice | `gpt-realtime-2.1` (reasoning effort `minimal`) |
| Live transcription | `gpt-live-transcribe` |
| File transcription (fallback mode) | `gpt-transcribe` |
| Safety classifier | `gpt-5.4-nano` |
| Moderation | `omni-moderation-latest` |
| Brain (cards, memory, stories, explainers, fallback replies) | `gpt-6-luna` |
| Illustrations | `gpt-image-2` |
| Narration | `gpt-4o-mini-tts` |

### Agentic memory

After each turn, the Brain turns the exchange into structured facts: interests (with a weight), open challenges, things learned, preferences. They are injected into Oomi's instructions, so Oomi can follow up ("So, which plane flew farther?") and the bedtime story reuses the day. Parents see all of it in plain words and can delete any item. No audio and no full transcripts are stored.

### English and French

Oomi answers in the language the child speaks. The live transcription has no fixed language, the safety classifier also returns the language, and every spoken line (answers, fixed lines, stories, narration) follows it. The safety suite runs in both languages.

### Oomi TV

When the child (or a parent) opens a discovery on the tablet, the Brain scripts a 4-scene explainer (hook, big idea, "whoa" detail, back to the real world). Two scenes get new illustrations, every scene gets its own narration (TTS), and the player animates captions, stickers and pictures in the browser. Everything is generated once and stored.

### Fallback mode

If the live session is unavailable, switch the simulator to **Turn by turn**: the recording is transcribed, goes through the same gate, the Brain writes the reply and TTS speaks it.

## Device protocol (for the ESP32 firmware)

The simulator is a thin client: the firmware only has to do the same calls. Hardware devices authenticate with the `x-oomi-access` header (the access code) instead of a cookie.

1. `POST /api/session` → `{ status: "ready", sessionId, clientSecret, model, voice }` or `{ status: "sleep", say }` (outside allowed hours).
2. Open the realtime session with `clientSecret` (WebRTC or WebSocket). Keep the mic muted unless the button is held.
3. On release: `input_audio_buffer.commit`, wait for `conversation.item.input_audio_transcription.completed`.
4. `POST /api/gate { sessionId, transcript, audioSeconds }` → `GateResponse` (`src/lib/contracts.ts`): `ignore`, `sleep`, `story`, or `speak` with `face`, `endFace`, `instructions` and optional `exactText`. Show `face`, then send `response.create` with those instructions.
5. When the answer transcript is done: `POST /api/turn/complete { sessionId, turnId, answer }`. If `safe` is false, cut the audio and say `replacement`.

No-audio-streaming fallback: `POST /api/turn` (multipart `audio`, or JSON `text`) returns the transcript, the gate decision and the reply text; voice it with `POST /api/speech`.

## Getting started

Requirements: Node 24+, a Postgres database, an OpenAI API key.

```bash
npm install
cp .env.example .env      # fill in the keys
npm run db:migrate        # creates the oomi_app schema and the demo child
npm run db:seed           # optional: a rich demo week for Leo (illustrations, stories, Oomi TV videos)
npm run dev               # http://localhost:3000
```

Open `/oomi`, enter the access code, tap the button to wake Oomi, then hold it (or Space) and ask a question. Open `/parent` in another tab to watch the journal fill up live.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` · `npm run typecheck` | ESLint · TypeScript |
| `npm test` | Unit tests (safety rules) |
| `npm run eval:safety` | Replays the SPEC §6.4 safety suite against the real gate (rules + moderation + classifier); must pass 100% |
| `npm run db:migrate` | Applies `db/schema.sql` (idempotent) |
| `npm run db:seed` | Seeds the demo week. Re-run before a demo: it only moves dates and removes test data, pictures and videos are generated once |

## Project structure

```
src/app/            pages and API routes
src/components/     device (necklace, eyes, simulator) and parent journal UI
src/lib/            shared contracts, device client, access helpers
src/server/         safety gate, persona, turn orchestration, Brain, images, journal, DB
db/schema.sql       database schema
scripts/            migration and safety eval
doc/                spec, concepts, build in public
```

## Team

- **Eli**
- **Ali**
- **Akram**

## License

All rights reserved © 2026 the Oomi team.
