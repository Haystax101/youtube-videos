#!/bin/bash
# Soundtrack for an aligned outside narration (voice.wav + timeline.json from tools/align_voice.py)
set -e
EP="${1:-$(dirname "$0")}"
python3 "$EP/sound.py" "$EP"
