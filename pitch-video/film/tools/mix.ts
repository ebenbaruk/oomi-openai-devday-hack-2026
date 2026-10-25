// Mixes voice, sound effects and ducked music into public/mix.wav, from the same cues the film uses.
import { execFileSync } from "node:child_process";
import path from "node:path";
import { MUSIC, SFX, VOICE, type Cue } from "../src/cues";
import { FPS } from "../src/constants";

const pub = path.resolve(import.meta.dirname, "../public");
const inputs: string[] = [];
const filters: string[] = [];

function place(cues: Cue[], bus: string) {
  const labels = cues.map((cue, i) => {
    inputs.push("-i", path.join(pub, cue.src));
    const idx = inputs.filter((x) => x === "-i").length - 1;
    const ms = Math.round((cue.frame / FPS) * 1000);
    const trim = cue.duration ? `atrim=0:${cue.duration},afade=t=out:st=${Math.max(0, cue.duration - 0.25)}:d=0.25,` : "";
    filters.push(`[${idx}:a]${trim}volume=${cue.gain ?? 0}dB,adelay=${ms}|${ms}[${bus}${i}]`);
    return `[${bus}${i}]`;
  });
  filters.push(`${labels.join("")}amix=inputs=${labels.length}:normalize=0[${bus}]`);
}

place(VOICE, "v");
place(SFX, "s");

inputs.push("-i", path.join(pub, MUSIC.src));
const m = inputs.filter((x) => x === "-i").length - 1;
const jump = MUSIC.cutAt + MUSIC.jumpBars * MUSIC.barSeconds;
const fadeOut = MUSIC.total - 1.6;
filters.push(
  `[${m}:a]asplit=2[m1][m2]`,
  `[m1]atrim=0:${MUSIC.cutAt + 0.3},asetpts=PTS-STARTPTS[mA]`,
  `[m2]atrim=${jump - 0.3},asetpts=PTS-STARTPTS[mB]`,
  `[mA][mB]acrossfade=d=0.6:c1=tri:c2=tri,volume=-7dB,afade=t=in:st=0:d=1.2,afade=t=out:st=${fadeOut}:d=1.6[mRaw]`,
  // The key must outlast the music, or the compressor stops when the last line ends.
  `[v]apad=whole_dur=${MUSIC.total},asplit=2[vMix][vKey]`,
  `[mRaw][vKey]sidechaincompress=threshold=0.02:ratio=6:attack=30:release=500:makeup=1[mDuck]`,
  `[vMix]volume=1.5dB[vOut]`,
  `[mDuck][vOut][s]amix=inputs=3:normalize=0:duration=longest,apad,atrim=0:${MUSIC.total},loudnorm=I=-15:TP=-1.5:LRA=11[out]`,
);

const out = path.join(pub, "mix.wav");
execFileSync("ffmpeg", ["-v", "error", "-y", ...inputs, "-filter_complex", filters.join(";"), "-map", "[out]", "-ar", "48000", "-ac", "2", out], { stdio: "inherit" });
console.log(`mixed ${VOICE.length} voice lines, ${SFX.length} effects → ${out} (${MUSIC.total.toFixed(1)} s)`);
