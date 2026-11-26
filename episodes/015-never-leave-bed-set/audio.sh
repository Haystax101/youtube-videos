#!/usr/bin/env bash
# Soundtrack for 015 (used by render-set.yml): Qwen voice from its release -> score -> CC0 sfx mix -> loudness.
set -euo pipefail
EP="$1"; HERE="$(cd "$(dirname "$0")" && pwd)"; REPO="$(cd "$HERE/../.." && pwd)"
if [ ! -f "$EP/voice.wav" ]; then
  TAG="$(head -n1 "$HERE/voice-tag.txt" | tr -d '[:space:]')"; NAME="$(sed -n 2p "$HERE/voice-tag.txt" | tr -d '[:space:]')"
  curl -sSfL -o "$EP/voice.wav" "https://github.com/Haystax101/youtube-videos/releases/download/$TAG/voice_$NAME.wav"
fi
if [ ! -d "$REPO/assets/sfx" ]; then
  (cd "$REPO" && curl -sSfL -o /tmp/sfx.tar https://github.com/Haystax101/youtube-videos/releases/download/sfx-v1/sfx.tar && tar -xf /tmp/sfx.tar) || echo "no sfx release; using synthesised fallbacks"
fi
python3 "$HERE/score.py" "$EP"
python3 "$HERE/mixbed.py" "$EP"
ffmpeg -y -loglevel error -i "$EP/audio.mix.wav" -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 "$EP/audio.norm.wav"
