# Oomi — implementation status

This document records the work integrated on `feat/parent-dashboard` before it is merged into `main`.

## What now works

### Parent experience

- A public landing page leads to the protected Oomi experience.
- The parent dashboard at `/parent` supports a child profile, daily journal, discoveries, memories, bedtime stories, alerts and family settings.
- Parents can set gentle watch topics such as family changes, adoption and grief. Oomi redirects the child with care and records a discreet parent signal.
- The dashboard creates a one-time, six-digit pairing code for the Apple Watch.
- A mascot studio lets parents choose the character, colours, face and expression. Its configuration is stored server-side and exposed to the Watch profile endpoint.
- The Apple Watch card now shows a privacy-preserving connection diagnostic: paired state and the last secure contact. It gives clear next steps when the Watch has not contacted Oomi recently.

### Watch application

- `watch/OomiWatchApp/OomiWatch` is a native SwiftUI companion for watchOS 10.2 and later.
- The child holds the push-to-talk control: the Watch records a short clip, sends it to `POST /api/watch/turn`, displays a listening/thinking/speaking state, plays haptics, then plays approved OpenAI audio returned by the server.
- The Watch receives the same safety decision as the simulator. Audio and full transcripts are not kept in the database; parent-facing journal items are created from the approved turn.
- Pairing creates a device credential stored in the Apple Keychain. A later foreground refresh loads the current mascot from `/api/watch/profile`, so changes saved in the parent dashboard reach the Watch without another pairing.
- The Watch uses the demo Vercel deployment as its pre-filled server address. Settings remain available when a different environment must be used.
- A selected Studio portrait is sent as the same image to the Watch. Otherwise, the native Watch illustration follows the saved character configuration.
- The Watch home screen keeps its space for the character and conversation: the old preview wheel is removed, the Digital Crown changes the character expression, and server responses are written as one short, complete Watch-friendly sentence.

### Server, safety and data

- Shared contracts, server domain services and transport routes are in place for the dashboard, simulator and Watch.
- The Watch routes cover pairing, profile refresh and a complete voice turn.
- The server transcribes, applies the safety gate, generates the response, synthesises OpenAI audio and returns a safe mascot state.
- The journal, discovery, memory, story and settings data is stored in Postgres. Audio and raw transcripts are deliberately excluded.
- Parent-facing mascot updates and Watch questions are persisted in the dashboard data flow.

## OpenAI services in the demo

| Capability | Service |
|---|---|
| Live simulator voice | OpenAI Realtime |
| Watch transcription | OpenAI transcription |
| Safety decisions | Moderation plus safety classifier |
| Responses, discoveries and stories | OpenAI model selected in environment variables |
| Voice played by the Watch | OpenAI text-to-speech |
| Mascot portraits and discovery illustrations | GPT Image |

## Quality checks completed locally

- JavaScript test suite: 30 passing tests.
- Production web build and TypeScript checks completed successfully.
- Watch Release archive completed successfully.
- Safety evaluation: 28/28 cases passed against the configured live services.
- `POST /api/speech` returned OpenAI MP3 audio in a live verification.

## Distribution and physical Watch status

- The current direct-development bundle is **build 15**, signed for Apple Developer team `L976M3ADD6`.
- The physical Apple Watch is included in the Watch provisioning profile and the iPhone companion was installed successfully on the paired iPhone.
- The child can complete a real turn on the physical Watch: record → OpenAI transcription and safety decision → OpenAI audio response → journal item in the parent dashboard.
- TestFlight remains useful for later distribution, but is not the delivery path for the hackathon demo. A separate minimal install-check app produced the same availability failures in TestFlight, so that client or App Store Connect state is treated separately from the source and signing work.

## How to continue

1. Open Oomi Watch and confirm the paired child appears.
2. Save a mascot change in the parent Studio while Oomi Watch is open; the Watch refreshes it within about 15 seconds.
3. Ask a short question and verify the concise on-screen text, OpenAI audio and new journal item in `/parent`.
4. Use the Apple Watch diagnostic in Settings to confirm the latest secure contact before the demo.
5. Once the team accepts the branch, merge `feat/parent-dashboard` into `main` through a pull request.
