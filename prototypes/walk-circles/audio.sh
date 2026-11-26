#!/usr/bin/env bash
# Soundtrack for this set video (used by render-set.yml too):
# Qwen3-TTS voice from its release (voice-release.txt: "TAG NAME") -> retime -> score -> mix -> loudness.
# The committed timeline.json is the retimed timeline of that same voice, so the edit matches it.
set -euo pipefail
EP="$1"; HERE="$(cd "$(dirname "$0")" && pwd)"; REPO="$(cd "$HERE/../.." && pwd)"
read -r TAG NAME TEMPO < "$EP/voice-release.txt"; TEMPO="${TEMPO:-1.3}"
if [ ! -f "$EP/qv/voice_$NAME.wav" ]; then
  mkdir -p "$EP/qv"
  for f in "voice_$NAME.wav" "timeline_$NAME.json"; do
    curl -sSLf -o "$EP/qv/$f" "https://github.com/Haystax101/youtube-videos/releases/download/$TAG/$f"
  done
fi
python3 "$REPO/tools/retime_voice.py" "$EP/qv/voice_$NAME.wav" "$EP/qv/timeline_$NAME.json" "$EP/voice.wav" "$EP/qv/timeline_check.json" --tempo "$TEMPO" --maxp 0.25
python3 "$HERE/score.py" "$EP"
python3 "$HERE/mixcircles.py" "$EP"
ffmpeg -y -loglevel error -i "$EP/audio.mix.wav" -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 "$EP/audio.norm.wav"
