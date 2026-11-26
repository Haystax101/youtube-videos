#!/usr/bin/env bash
# Soundtrack for this set video (used by render-set.yml too). voice-release.txt picks the voice:
#   "TAG NAME [TEMPO]"          Qwen3-TTS voice from release TAG, retimed by TEMPO (default 1.3)
#   "hybrid TAG NAME ROLES"     Kokoro narrator (script.json voices) + Qwen lines for ROLES from release TAG
# The committed timeline.json must be the timeline this produces, so the edit matches the voice.
set -euo pipefail
EP="$1"; HERE="$(cd "$(dirname "$0")" && pwd)"; REPO="$(cd "$HERE/../.." && pwd)"
read -r A B C D < "$EP/voice-release.txt"
fetch() { mkdir -p "$EP/qv"; for f in "voice_$2.wav" "timeline_$2.json"; do [ -f "$EP/qv/$f" ] ||
  curl -sSLf -o "$EP/qv/$f" "https://github.com/Haystax101/youtube-videos/releases/download/$1/$f"; done; }
if [ "$A" = hybrid ]; then
  fetch "$B" "$C"; K="$EP/qv/kokoro"; mkdir -p "$K"; cp "$EP/script.json" "$K/"
  python3 "$REPO/pipeline/tts.py" "$K"
  python3 "$REPO/tools/hybrid_voice.py" "$K/voice.wav" "$K/timeline.json" "$EP/qv/voice_$C.wav" "$EP/qv/timeline_$C.json" "$EP/voice.wav" "$EP/qv/timeline_check.json" --roles "$D"
else
  fetch "$A" "$B"
  python3 "$REPO/tools/retime_voice.py" "$EP/qv/voice_$B.wav" "$EP/qv/timeline_$B.json" "$EP/voice.wav" "$EP/qv/timeline_check.json" --tempo "${C:-1.3}" --maxp 0.25
  case "$B" in George*)  # cloned voices copy the phone recording's hiss: denoise
    ffmpeg -y -loglevel error -i "$EP/voice.wav" -af "highpass=f=70,afftdn=nr=24:nf=-40:tn=1,lowpass=f=10000" "$EP/voice.dn.wav" && mv "$EP/voice.dn.wav" "$EP/voice.wav" ;; esac
fi
python3 "$HERE/score.py" "$EP"
python3 "$HERE/mixcircles.py" "$EP"
ffmpeg -y -loglevel error -i "$EP/audio.mix.wav" -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 "$EP/audio.norm.wav"
