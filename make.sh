#!/usr/bin/env bash
# Build one episode end to end: voice -> mix -> render.
# Usage: ./make.sh episodes/<slug>
set -euo pipefail
cd "$(dirname "$0")"
EP="$1"
[ -f models/kokoro-v1.0.onnx ] || ./setup.sh
python3 pipeline/tts.py "$EP"
python3 pipeline/mix.py "$EP"
NODE_PATH="$(npm root -g)" node pipeline/render.mjs "$EP"
echo "done: $EP/video.mp4"
