#!/usr/bin/env bash
# Builds this set video's soundtrack: voice -> orchestral score -> mix -> loudness.
# Used by .github/workflows/render-set.yml (and by hand: bash EP/audio.sh EP).
set -euo pipefail
EP="$1"; HERE="$(cd "$(dirname "$0")" && pwd)"
python3 pipeline/tts.py "$EP"
python3 "$HERE/score.py" "$EP"
python3 "$HERE/mixclaw.py" "$EP"
ffmpeg -y -loglevel error -i "$EP/audio.mix.wav" -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 "$EP/audio.norm.wav"
