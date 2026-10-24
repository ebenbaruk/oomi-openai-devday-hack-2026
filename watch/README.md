# Oomi Watch prototype

## Chosen stack

- **UI:** native SwiftUI for watchOS.
- **Physical interaction:** touch-and-hold push-to-talk, watch haptics, animated Oomi face.
- **MVP networking:** `URLSession` HTTPS requests to the Oomi server after the child releases the button.
- **Audio:** AVFoundation records a short bounded clip; the server performs transcription, safety checks and response generation.
- **Security:** OpenAI credentials remain server-side. The watch receives only an approved response, a face state and optional approved audio.
- **Later:** WatchConnectivity with a small iPhone companion can improve reachability, but direct HTTPS is simpler for the demo.

## Test the mascot

1. In Xcode, create a new **watchOS App** named `OomiWatch` using SwiftUI.
2. Replace its generated app and content files with `OomiWatchApp.swift` and `OomiWatchHome.swift` from this folder.
3. Run it on an Apple Watch simulator, then on the physical Apple Watch.
4. Hold the green button to preview `listening`, then release to preview `thinking`.

## Next implementation slice

Add an `AudioTurnRecorder` and one server endpoint:

`POST /api/watch/turn` → audio clip → transcription → safety verdict → approved text/audio + Oomi mood.

Use short request/response turns for the hackathon. Do not start with continuous duplex audio or a persistent WebSocket.
