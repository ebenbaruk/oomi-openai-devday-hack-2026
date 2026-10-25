# Oomi: pitch & launch film kit

Everything for the submission video, the live pitch and the launch posts.

## Start here

| What | Where |
|---|---|
| **The film (1:59.6, 1080p, 30 fps, -15 LUFS)** | [YouTube (unlisted)](https://youtu.be/Sra3sk70_cg) (rendered locally to `output/oomi-launch-film.mp4`) |
| Apple Watch demo (Oomi running on real hardware) | [YouTube](https://youtu.be/RxY0-MLNtFk) |
| Vision moodboard (30 s AI-generated teaser, the feel of the finished necklace) | [YouTube Short (unlisted)](https://youtube.com/shorts/lssZKlUehTM) |
| Master script (what the film says, beat by beat) | `scripts/00-master-script.md` |
| 4 alternative film scripts (origin story, a day with Leo, manifesto, 36 hours) | `scripts/01-alt-scripts.md` |
| 30 s, 15 s and 6 s cuts, plus a 60 s vertical version | `scripts/02-short-cuts.md` |
| Submission copy (taglines, descriptions, Devpost sections, one paragraph per track) | `copy/submission.md` |
| Live pitch, 60 s and 3 min, plus Q&A prep | `copy/live-pitch.md` |
| X thread, LinkedIn, build-in-public recap, Product Hunt, waitlist hero | `copy/launch-posts.md` |
| Research behind the choices (hooks, stats that are safe to cite, competitors) | `research/pitch-best-practices.md` |
| Every feature we shipped, in plain words (for the pitch, Devpost and Q&A) | `copy/features.md` |
| Real app captures and screen recordings | `assets/screens/` (see `SCREENS.md`) |
| The team as kids wearing Oomi (generated portraits used in the weekend scene) | `assets/team/` |
| Music and sound effects, with licences | `audio/AUDIO.md` |

Media files (music, sound effects, raw voice takes, screen recordings, rendered output) are kept out of git; you need them locally to re-render.

## How the film is made

Everything is drawn and animated in code with [Remotion](https://remotion.dev) in `film/`, following the "doodle notebook" art direction. Nothing in it is AI-generated video.

- `film/src/timeline.ts`: the film is paced by its voice-over. Each line waits a gap after the previous one, so changing a line re-times everything.
- `film/src/components/`: the paper, the boiling felt-pen lines, handwriting, post-its, taped photos, Oomi (with its faces) and Leo (with his poses).
- `film/src/scenes/`: the 8 beats (hook, problem, reveal, demo, parents, trust, weekend, close).
- `film/src/cues.ts` + `film/tools/mix.ts`: sound-effect cues and the ffmpeg mix. The music is ducked under the voice (sidechain), and it jumps a whole number of bars so its ending lands on the end card.

Voices use OpenAI `gpt-4o-mini-tts`:

- Narrator: `marin`
- Oomi: `coral`, the voice the product uses
- Leo: `nova`, pitched up

The lines and their acting instructions are in `audio/vo/lines.json`.

### Re-render after a change

```bash
cd pitch-video
# 1. (optional) edit a line in audio/vo/lines.json, delete its file in audio/vo/raw/, then:
set -a && . ../.env && set +a && node tools/tts.mjs audio/vo/lines.json audio/vo/raw
./tools/process-vo.sh                       # trim, normalise, pitch, write film/src/vo.json
cd film
../../node_modules/.bin/tsx tools/mix.ts    # rebuild public/mix.wav
npx remotion studio src/index.ts            # preview in the browser
npx remotion render src/index.ts OomiLaunch ../output/oomi-launch-film.mp4 --crf=18
```

The team images in the repo README (`doc/readme/team*.jpg`) are stills from `film/src/Stills.tsx`: `npx remotion still src/index.ts ReadmeTeam out.png --frame=60`, or `ReadmeTeamCard --props='{"kid":0}'` for one portrait.

To try another narrator voice, change `"voice"` on the `n..` lines. Test samples of 8 voices are in `audio/vo/tests/`.

## Credits (required: the music is CC BY 3.0)

> Music: "Happy Kids Playing" by Alex-Productions | https://onsound.eu/ · Music promoted by https://www.free-stock-music.com · Creative Commons Attribution 3.0 Unported (CC BY 3.0) https://creativecommons.org/licenses/by/3.0/
> Sound effects: Mixkit (free licence) and Freesound (CC0).

Put this line in the video description or the submission page.
