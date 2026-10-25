# Oomi Watch companion

## Chosen stack

- **UI:** native SwiftUI for watchOS.
- **Physical interaction:** touch-and-hold push-to-talk, watch haptics, animated Oomi face.
- **MVP networking:** `URLSession` HTTPS requests to the Oomi server after the child releases the button.
- **Audio:** AVFoundation records a short bounded clip; the server performs transcription, safety checks and response generation.
- **Security:** OpenAI credentials remain server-side. The watch receives only an approved response, a face state and optional approved audio.
- **Later:** WatchConnectivity with a small iPhone companion can improve reachability, but direct HTTPS is simpler for the demo.

## Current implementation

The Xcode project is [`OomiWatchApp/OomiWatch`](OomiWatchApp/OomiWatch). It includes an iPhone companion and the watchOS app.

- Hold the push-to-talk control to record a maximum ten-second turn.
- On release, the Watch sends the clip to `POST /api/watch/turn`.
- The server transcribes it, applies the safety gate, obtains an approved OpenAI answer and returns OpenAI audio.
- The Watch plays that audio at its maximum app-level volume and stores its device credential in the Keychain.
- A paired Watch refreshes the parent-selected mascot profile from `POST /api/watch/profile` while Oomi is open.
- The Digital Crown changes the expression when Oomi is idle; it does not expose the internal preview picker.

## Pair and test

1. In the parent dashboard, open **Settings → Connect Oomi** and create a six-digit code.
2. On the Watch, open Oomi’s settings, enter the code and save. The demo server is pre-filled.
3. Return to Oomi, hold the microphone control, ask a question and release it.
4. Verify the short on-screen answer, OpenAI audio, a new parent journal item and the last-contact time in the dashboard diagnostic.
