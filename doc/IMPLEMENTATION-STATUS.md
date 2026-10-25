# Oomi — implementation status

This document records the work integrated on `feat/parent-dashboard` before it is merged into `main`.

## What now works

### Parent experience

- A public landing page leads to the protected Oomi experience.
- The parent dashboard at `/parent` supports a child profile, daily journal, discoveries, memories, bedtime stories, alerts and family settings.
- Parents can set gentle watch topics such as family changes, adoption and grief. Oomi redirects the child with care and records a discreet parent signal.
- The dashboard creates a one-time, six-digit pairing code for the Apple Watch.
- A mascot studio lets parents choose the character, colours, face and expression. Its configuration is stored server-side and exposed to the Watch profile endpoint.

### Watch application

- `watch/OomiWatchApp/OomiWatch` is a native SwiftUI companion for watchOS 10.2 and later.
- The child holds the push-to-talk control: the Watch records a short clip, sends it to `POST /api/watch/turn`, displays a listening/thinking/speaking state, plays haptics, then plays approved OpenAI audio returned by the server.
- The Watch receives the same safety decision as the simulator. Audio and full transcripts are not kept in the database; parent-facing journal items are created from the approved turn.
- Pairing creates a device credential stored in the Apple Keychain. A later foreground refresh loads the current mascot from `/api/watch/profile`, so changes saved in the parent dashboard reach the Watch without another pairing.
- The Watch uses the demo Vercel deployment as its pre-filled server address. Settings remain available when a different environment must be used.

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

## TestFlight distribution

The TestFlight delivery is intentionally separate from the source branch:

- Build 11 is signed with an Apple Distribution profile for team `L976M3ADD6`.
- The iPhone and Watch bundles both have distribution entitlements (`get-task-allow=false`).
- The archive declares that it uses only Apple-provided encryption (`ITSAppUsesNonExemptEncryption=false`), so it does not stop in App Store Connect’s export-compliance state.
- Build 11 was accepted and processed by Apple, then added to the internal group **Oomi — test interne**.

Build 10 should be ignored: Apple lists it as **Informations manquantes** because it predates the encryption declaration. Builds marked **Expiré** reached TestFlight’s normal 90-day availability limit; this is not a source-code failure.

## Current limitation and recommended next check

The source, archive and TestFlight group configuration are now aligned. The remaining validation is installing build 11 from TestFlight on the paired iPhone and checking that its Watch companion appears in the Watch app.

If TestFlight still shows “The requested app is not available or does not exist” for build 11, capture the exact build number displayed in TestFlight and the iOS version. That would point to Apple’s delivery/client state rather than the signing, export compliance or tester assignment fixed here.

## How to continue

1. Test build 11 from TestFlight on the iPhone and install its Watch companion.
2. Open Oomi Watch, confirm the server address, enter a fresh six-digit dashboard pairing code and save.
3. Ask a short question and verify: response audio, Watch animation, new journal item in `/parent`, and mascot refresh after a dashboard change.
4. Once this passes, merge `feat/parent-dashboard` into `main` through a pull request.
