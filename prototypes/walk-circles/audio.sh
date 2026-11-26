#!/usr/bin/env bash
# Soundtrack for this set video: voice -> score -> mix -> loudness (used by render-set.yml too).
set -euo pipefail
EP="$1"; HERE="$(cd "$(dirname "$0")" && pwd)"
python3 pipeline/tts.py "$EP"
python3 "$HERE/score.py" "$EP"
python3 "$HERE/mixcircles.py" "$EP"
ffmpeg -y -loglevel error -i "$EP/audio.mix.wav" -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 "$EP/audio.norm.wav"
