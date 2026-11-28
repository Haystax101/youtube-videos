#!/usr/bin/env bash
# Soundtrack for the Short: Kokoro voice -> score -> recorded sfx mix -> loudness.
set -euo pipefail
EP="$1"; HERE="$(cd "$(dirname "$0")" && pwd)"; REPO="$(cd "$HERE/../.." && pwd)"
# Chatterbox narration (george 28 Nov): voice.wav + timeline.json come from the cbvoice-* release named in voice-release.txt
if [ -f "$EP/voice-release.txt" ] && [ ! -f "$EP/voice.wav" ]; then TAG=$(head -n1 "$EP/voice-release.txt" | tr -d '[:space:]')
  curl -sSLf -o "$EP/voice.wav" "https://github.com/Haystax101/youtube-videos/releases/download/$TAG/voice.wav"; fi
[ -f "$EP/voice.wav" ] || python3 "$REPO/pipeline/tts.py" "$EP"
python3 "$HERE/score.py" "$EP"
python3 "$HERE/mixep.py" "$EP"
# two-pass loudnorm to -14 LUFS
J=$(ffmpeg -hide_banner -i "$EP/audio.mix.wav" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$J" | python3 -c "import sys,json;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -y -loglevel error -i "$EP/audio.mix.wav" -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true" -ar 48000 "$EP/audio.norm.wav"
