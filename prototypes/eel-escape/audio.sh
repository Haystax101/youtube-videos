#!/usr/bin/env bash
# Soundtrack for the eel escape Short (used by render-set.yml too): Qwen voice from its release
# (voice-release.txt: "TAG NAME"), else Kokoro; CC0 sounds from release sfx-v1 if present; score; mix; loudness.
set -euo pipefail
EP="$1"; HERE="$(cd "$(dirname "$0")" && pwd)"; R=https://github.com/Haystax101/youtube-videos/releases/download
if [ -f "$HERE/voice-release.txt" ]; then read -r TAG NAME < "$HERE/voice-release.txt"
  curl -sSLf -o "$EP/voice.wav" "$R/$TAG/voice_$NAME.wav" && curl -sSLf -o "$EP/timeline.json" "$R/$TAG/timeline_$NAME.json" && python3 "$HERE/gaps.py" "$EP" || python3 pipeline/tts.py "$EP"
elif [ ! -f "$EP/voice.wav" ]; then python3 pipeline/tts.py "$EP"; fi
if [ ! -d assets/sfx ]; then curl -sSLf -o /tmp/sfx.tar "$R/sfx-v1/sfx.tar" && tar -xf /tmp/sfx.tar || echo "no sfx-v1 yet: synthesised effects"; fi
python3 "$HERE/score.py" "$EP"
python3 "$HERE/mixeel.py" "$EP"
ffmpeg -y -loglevel error -i "$EP/audio.mix.wav" -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 "$EP/audio.norm.wav"
