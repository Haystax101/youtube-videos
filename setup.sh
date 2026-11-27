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
# orchestral soundfont (GeneralUser GS, free licence) for pipeline/sf2.py
[ -f models/GeneralUser-GS.sf2 ] || curl -sL -o models/GeneralUser-GS.sf2 https://raw.githubusercontent.com/mrbumpy409/GeneralUser-GS/main/GeneralUser-GS.sf2

# Speech recogniser for tools/align_voice.py (times an outside narration, e.g. ElevenLabs, to the script)
if [ ! -d models/sherpa-onnx-zipformer-en-2023-06-26 ]; then
  pip install -q sherpa-onnx
  curl -sL https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-zipformer-en-2023-06-26.tar.bz2 | tar xj -C models
fi
