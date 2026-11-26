#!/usr/bin/env bash
# Soundtrack for Mt. Gox (used by render-set.yml): Kokoro voice (voice.wav, made locally with
# pipeline/tts.py and fetched by the workflow if missing) -> score -> sfx mix -> loudness.
set -euo pipefail
EP="$1"; HERE="$(cd "$(dirname "$0")" && pwd)"; REPO="$(cd "$HERE/../../.." && pwd)"
if [ ! -f "$EP/voice.wav" ]; then (cd "$REPO" && python3 pipeline/tts.py "$EP"); fi
if [ ! -d "$REPO/assets/sfx" ]; then
  (cd "$REPO" && curl -sSfL -o /tmp/sfx.tar https://github.com/Haystax101/youtube-videos/releases/download/sfx-v1/sfx.tar && tar -xf /tmp/sfx.tar) || echo "no sfx release; using synthesised effects"
fi
python3 "$HERE/score.py" "$EP"
python3 "$HERE/mix.py" "$EP"
ffmpeg -y -loglevel error -i "$EP/audio.mix.wav" -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 "$EP/audio.norm.wav"
