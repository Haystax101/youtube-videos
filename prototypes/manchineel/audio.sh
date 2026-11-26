#!/usr/bin/env bash
# Soundtrack for the manchineel set video (used by render-set.yml too): Kokoro narrator + Qwen character
# lines (hybrid.py, Qwen render from its release) -> score -> real CC0 sfx (release sfx-v1, if published) -> mix -> loudness.
set -euo pipefail
EP="$1"; HERE="$(cd "$(dirname "$0")" && pwd)"; REL=https://github.com/Haystax101/youtube-videos/releases/download
TAG="$(tr -d '[:space:]' < "$HERE/voice-release.txt")"
[ -f "$EP/voice_Ryan.wav" ] || curl -sSLf -o "$EP/voice_Ryan.wav" "$REL/$TAG/voice_Ryan.wav"
[ -f "$EP/timeline_Ryan.json" ] || curl -sSLf -o "$EP/timeline_Ryan.json" "$REL/$TAG/timeline_Ryan.json"
python3 "$HERE/hybrid.py" "$EP"   # Kokoro narrator + Qwen character lines; keeps the committed timeline.json
if [ ! -d assets/sfx ] && curl -sSLf -o /tmp/sfx.tar "$REL/sfx-v1/sfx.tar"; then tar -xf /tmp/sfx.tar; fi
python3 "$HERE/score.py" "$EP"
python3 "$HERE/mixman.py" "$EP"
ffmpeg -y -loglevel error -i "$EP/audio.mix.wav" -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 "$EP/audio.norm.wav"
