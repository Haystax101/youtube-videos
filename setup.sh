#!/usr/bin/env bash
# One-time setup: Node deps, Python deps, Kokoro TTS model (~350 MB, free, Apache-2.0).
set -euo pipefail
cd "$(dirname "$0")"
npm ci || npm install
pip install -q kokoro-onnx soundfile pillow
mkdir -p models
base=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
[ -f models/kokoro-v1.0.onnx ] || curl -sL -o models/kokoro-v1.0.onnx $base/kokoro-v1.0.onnx
[ -f models/voices-v1.0.bin ] || curl -sL -o models/voices-v1.0.bin $base/voices-v1.0.bin
