#!/bin/sh
# Trim, normalise and pitch the raw TTS lines into the film's public folder, then write durations.
set -e
cd "$(dirname "$0")/.."
TRIM="silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse"
mkdir -p film/public/vo
for f in audio/vo/raw/*.wav; do
  id=$(basename "$f" .wav)
  case $id in
    leo*) PRE="asetrate=24000*1.22,aresample=24000,atempo=0.92," ;;
    n*) PRE="atempo=1.08," ;;
    *) PRE="" ;;
  esac
  ffmpeg -v error -y -i "$f" -af "${PRE}${TRIM},loudnorm=I=-16:TP=-1.5:LRA=7,aresample=48000" -ac 2 "film/public/vo/$id.wav"
done
printf '{\n' > film/src/vo.json
first=1
for f in film/public/vo/*.wav; do
  [ $first = 1 ] || printf ',\n' >> film/src/vo.json
  first=0
  printf '  "%s": %s' "$(basename "$f" .wav)" "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")" >> film/src/vo.json
done
printf '\n}\n' >> film/src/vo.json
