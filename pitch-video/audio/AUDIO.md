# Audio for the launch film

Every file has its original download (`.mp3`) and an editing copy next to it with the same name (`.wav`, 48 kHz, stereo, 16-bit PCM). Files marked *synth* were generated with numpy/ffmpeg and only exist as `.wav`.

BPM was estimated with onset-autocorrelation. Where the publisher lists a BPM it agrees with the estimate within ±1. Section timestamps come from a 1 s RMS energy curve. Mood notes combine the publisher's description with that curve. Nobody has listened to these files yet, so audition them before locking the edit.

## Recommendation

**Use `music/01-ukulele-whistle-happy-kids-playing-alex-productions` (136 BPM).**

- It matches the brief: ukulele, glockenspiel, whistling and a light beat, playful and kid-friendly.
- It has the clearest emotional arc of all five tracks: a soft intro, the full band, a real breakdown (about 10 dB quieter), a rebuild, then the loudest section as the lift.
- It runs 2:08, so it gets to about 110 s with one cut:
  - `0:00–0:20` intro (curious opening, notebook appears)
  - `0:21–0:49` full band (playful product moments)
  - `0:50–1:03` breakdown (emotional beat: the child and Oomi)
  - `1:04–1:17` build
  - `1:18–1:44` lift (hero shot / reveal)
  - cut `1:45 → 2:01` on a downbeat
  - `2:01–2:08` ending (logo)
  - Total is about 112 s. One beat is 0.441 s and one bar is 1.765 s, which is useful for syncing doodle pops to the beat.

**Runner-up: `music/02-piano-ukulele-journeys-scott-buckley` (99 BPM).** It is 1:55 long, so it already fits about 110 s with no edit. It has a gentle intro, a full stop at `0:46–0:49` (perfect for a "silence then reveal" moment) and a bigger final section from `0:50`. It is more piano/pop-folk and more "emotional brand" than "kids' notebook". It has backing vocals, so check that they don't clash with the voice-over.

## Music

| File (`music/`) | Source | License / attribution | Duration | BPM | Sections (energy curve) | Mood notes |
|---|---|---|---|---|---|---|
| `01-ukulele-whistle-happy-kids-playing-alex-productions` | https://www.free-stock-music.com/alex-productions-happy-kids-playing.html (mp3: `/music/alex-productions/mp3/alex-productions-happy-kids-playing.mp3`) | CC BY 3.0. Credit: `Happy Kids Playing by Alex-Productions \| https://onsound.eu/ Music promoted by https://www.free-stock-music.com Creative Commons / Attribution 3.0 Unported License (CC BY 3.0) https://creativecommons.org/licenses/by/3.0/` | 2:14.8 (music ends about 2:08) | 136 | `0:00–0:20` soft intro · `0:21–0:49` full · `0:50–1:03` breakdown (−10 dB) · `1:04–1:17` build · `1:18–1:44` lift (peak) · `1:45–2:00` tag · `2:01–2:08` ending, fade by 2:10 | Ukulele, glockenspiel, whistle, beat. Bright, bouncy, joyful. Has the best dynamics of the set. |
| `02-piano-ukulele-journeys-scott-buckley` | https://www.scottbuckley.com.au/library/journeys/ (mp3: `.../wp-content/uploads/2016/09/sb_journeys.mp3`) | CC BY 4.0. Credit: `'Journeys' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au` | 1:55.5 | 99 | `0:00–0:08` piano/uke intro · `0:09–0:45` groove · `0:46–0:49` stop/break (near silence) · `0:50–1:46` final, biggest section · `1:47–1:55` ring-out | Hopeful pop-folk with piano, ukulele, acoustic drums and backing vocals. Warm and emotional. Fits the length with no edit. |
| `03-ukulele-glock-claps-happy-clappy-ukulele-shane-ivers` | https://www.silvermansound.com/free-music/happy-clappy-ukulele (mp3: `/wp-content/uploads/happy-clappy-ukulele.mp3`) | CC BY 4.0. Credit: `Music: Happy Clappy Ukulele by Shane Ivers - https://www.silvermansound.com` | 3:09.4 | 89 (publisher: 90) | `0:00–0:24` light intro · `0:25` big entry (+8 dB: claps, whistle, glock) · `1:36–1:39` short break · `1:40–3:04` full · `3:05` end | Exactly the instrument list from the brief (uke, glock, bells, whistle, claps). Very catchy, but energy stays flat after 0:25, so the lift is weak. Good fallback for a purely playful cut. |
| `04-ukulele-flute-glock-little-adventures-sokolovsky` | https://www.free-stock-music.com/sokolovsky-music-little-adventures.html (mp3: `/music/sokolovsky-music/mp3/sokolovsky-music-little-adventures.mp3`) | CC BY 4.0. Credit: `Little Adventures by Sokolovsky Music \| http://sokolovskymusic.com Music promoted by https://www.free-stock-music.com Creative Commons / Attribution 4.0 International (CC BY 4.0) https://creativecommons.org/licenses/by/4.0/` | 2:33.2 | 89 (publisher: 90) | about 4 s of silence, then in at `0:04` · `0:04–0:44` A · `0:45–1:04` slight peak · `1:05–1:29` softer · `1:30–2:09` second rise · `2:30` end | Ukulele, flute, glockenspiel, bells, cello. Storybook, gentle and curious. Low dynamic range. Trim the leading silence. |
| `05-light-acoustic-life-of-riley-kevin-macleod` | https://incompetech.com/music/royalty-free/mp3-royaltyfree/Life%20of%20Riley.mp3 | CC BY 4.0. Credit: `"Life of Riley" Kevin MacLeod (incompetech.com) Licensed under Creative Commons: By Attribution 4.0 License http://creativecommons.org/licenses/by/4.0/` | 3:55.4 | 103 | `0:00–0:57` A · `0:58–1:53` quieter B (−3 dB) · `1:54–2:49` A returns (lift) · `2:50–3:09` B · `3:10–3:44` A · `3:45` end | Light, quirky, carefree acoustic piece, a classic for explainers. The B → A return at 1:54 can serve as a mild lift. |

Rejected after analysis (not kept): Kevin MacLeod *Carefree*, *Wholesome*, *Inspired*, *Sunshine A*, *Merry Go*, *Heartwarming*, *Happy Alley*, and the Mixkit ukulele tracks (*Feeling Happy*, *Owies Ukulele*, *My Pride and Joy*, *That's the Way of Life*, *Smile*, *Playground Fun*). They were either flat in energy (no swell), too short, or off-style. Bensound blocks direct downloads (403).

## SFX

Mixkit files are 128 kbps previews served publicly by Mixkit, released under the [Mixkit Sound Effects Free License](https://mixkit.co/license/#sfxFree), which allows free commercial use with no attribution. Freesound files are the public "hq" previews (128 kbps mp3) of sounds licensed CC0 1.0, so no attribution is required (crediting is still polite). Levels are from `volumedetect` on the `.wav` copies.

| File (`sfx/`) | Use | Source | License | Duration | Level (mean / max) | Notes |
|---|---|---|---|---|---|---|
| `scribble-marker-loop-6s.wav` *(derived)* | **marker scribble loop** | cut from `scribble-marker-on-paper-mania` at 0.5–6.9 s, last 0.4 s crossfaded into the head | CC0 | 6.0 s | −25 / −3 dB | Loops seamlessly. Peak-normalized. Use under drawing shots. |
| `scribble-sharpie-loop-8s.wav` *(derived)* | marker loop, denser | cut from `scribble-sharpie-fast-30s-khenshom` at 2–10.4 s, crossfaded | CC0 | 8.0 s | −25 / −3 dB | Faster, continuous writing texture. The source was very quiet, so the noise floor is raised. |
| `scribble-marker-on-paper-mania` | marker strokes | https://freesound.org/people/Mania_/sounds/832494/ | CC0 | 8.9 s | −31 / −8 dB | Clean felt-marker strokes with gaps between them. Best raw source. |
| `scribble-sharpie-fast-30s-khenshom` | long writing bed | https://freesound.org/people/khenshom/sounds/481076/ | CC0 | 30.9 s | −53 / −28 dB | Very quiet. Add about +25 dB gain or use the loop above. |
| `scribble-short-mixkit` | one quick scribble | https://mixkit.co/free-sound-effects/writing/ ("Writing scribble on paper", id 2369) | Mixkit free | 1.2 s | −28 / −7 dB | |
| `scribble-pencil-letters-mixkit` | short pencil stroke | Mixkit "Explainer video writing pencil letters" (id 3011) | Mixkit free | 1.1 s | −40 / −18 dB | Quiet. Add gain. |
| `pop-sticker-synth.wav` *(synth)* | **sticker slap / doodle pop** | sine pitch drop 1000→250 Hz plus a 2 ms noise transient | own | 0.12 s | −16 / −2 dB | Dry and punchy. Layer with `pop-light-explainer`. |
| `pop-light-explainer-mixkit` | doodle pop-in | Mixkit "Explainer video pops whoosh light pop" (id 3005) | Mixkit free | 0.18 s | −16 / −2 dB | Built for explainer motion graphics. |
| `pop-long-mixkit` | softer pop | Mixkit "Long pop" (id 2358) | Mixkit free | 0.48 s | −24 / −2 dB | Mouth-pop style, cute. |
| `pop-soap-bubble-mixkit` | bubble pop | Mixkit "Soap bubble sound" (id 2925) | Mixkit free | 1.1 s | −24 / 0 dB | |
| `page-turn-single-mixkit` | **page turn** | Mixkit "Page turn single" (id 1104) | Mixkit free | 0.45 s | −36 / −3 dB | Quick flick. |
| `page-turn-big-mixkit` | page turn (bigger) | Mixkit "Big paper page turn" (id 1105) | Mixkit free | 0.83 s | −28 / −5 dB | Good for chapter or scene transitions. |
| `paper-rustle-6s-mixkit` | **paper rustle** | Mixkit "Papers being moved or wrinkling" (id 2379) | Mixkit free | 6.5 s | −36 / −1 dB | Quiet bed with a few peaks. |
| `whoosh-air-mixkit` | **paper-plane flight** | Mixkit "Air woosh" (id 1489) | Mixkit free | 2.3 s | −23 / −2 dB | Soft and airy. The best plane pass. |
| `whoosh-arrow-mixkit` | fast pass-by | Mixkit "Arrow whoosh" (id 1491) | Mixkit free | 1.1 s | −22 / −1 dB | Sharper, for quick swipes. |
| `whoosh-paper-plane-blow-horcasitas` | paper-plane throw | https://freesound.org/people/horcasitas/sounds/445977/ | CC0 | 0.8 s | −34 / −18 dB | A real paper plane being thrown. Quiet, so add gain. Layer it at the start of `whoosh-air`. |
| `chime-fairy-sparkle-mixkit` | **sparkle / magic** | Mixkit "Fairy magic sparkle" (id 871) | Mixkit free | 1.3 s | −21 / −2 dB | Bright glittery shimmer. |
| `chime-magic-sparkle-touch-mixkit` | sparkle (longer) | Mixkit "Magic sparkle touch" (id 3083) | Mixkit free | 2.3 s | −23 / −2 dB | |
| `chime-relaxing-bell-mixkit` | soft chime | Mixkit "Relaxing bell chime" (id 3109) | Mixkit free | 1.7 s | −28 / −7 dB | Gentle, good for the emotional beat or the logo. |
| `click-select-mixkit` | **button click** | Mixkit "Select click" (id 1109) | Mixkit free | 1.1 s | −23 / −4 dB | Clean UI click. |
| `click-switch-tap-mixkit` | physical button | Mixkit "On or off light switch tap" (id 2585) | Mixkit free | 1.1 s | −32 / −1 dB | Tactile. Good for pressing the necklace. |
| `click-plastic-bubble-mixkit` | tiny click | Mixkit "Plastic bubble click" (id 1124) | Mixkit free | 0.2 s | −30 / 0 dB | |
| `click-soft-synth.wav` *(synth)* | soft click | band-passed noise burst, 4 ms decay | own | 0.03 s | −20 / −3 dB | Neutral, sits under the music. |
| `boop-wake-synth.wav` *(synth)* | **device waking** | two soft sine notes C5 → G5 (160 ms + 300 ms) with a soft attack | own | 0.46 s | −14 / −4 dB | Friendly rising "boo-op". Pitch-shift it in the editor to taste. |
| `boop-positive-beep-mixkit` | wake / confirm | Mixkit "Positive interface beep" (id 221) | Mixkit free | 0.56 s | −15 / −1 dB | |
| `boop-message-pop-mixkit` | notification boop | Mixkit "Message pop alert" (id 2354) | Mixkit free | 1.06 s | −32 / −3 dB | |
| `boop-cute-bounce-hemplock` | cute boing / boop | https://freesound.org/people/Hemplock/sounds/618961/ | CC0 | 0.34 s | −11 / −6 dB | Cartoon bounce, good for the mascot. |

## Credits block for the video description / end card

```
Music: "Happy Kids Playing" by Alex-Productions | https://onsound.eu/ | CC BY 3.0 https://creativecommons.org/licenses/by/3.0/
(if used) "Journeys" by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au
(if used) "Happy Clappy Ukulele" by Shane Ivers - https://www.silvermansound.com | CC BY 4.0
(if used) "Little Adventures" by Sokolovsky Music | http://sokolovskymusic.com | CC BY 4.0
(if used) "Life of Riley" Kevin MacLeod (incompetech.com) | CC BY 4.0
Sound effects: Mixkit (mixkit.co); Freesound CC0 (Mania_, khenshom, horcasitas, Hemplock)
```
