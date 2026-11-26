#!/usr/bin/env bash
# Soundtrack for the beet-juice tyres Short: Kokoro voice -> orchestral score -> recorded sfx mix -> loudness.
set -euo pipefail
EP="$1"; HERE="$(cd "$(dirname "$0")" && pwd)"; REPO="$(cd "$HERE/../.." && pwd)"
python3 "$REPO/pipeline/tts.py" "$EP"
python3 "$HERE/score.py" "$EP"
python3 "$HERE/mixbeet.py" "$EP"
ffmpeg -y -loglevel error -i "$EP/audio.mix.wav" -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 "$EP/audio.norm.wav"
