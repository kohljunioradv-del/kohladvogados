#!/usr/bin/env bash
# Setup script for the video editor pipeline.
# Installs: ffmpeg, hyperframes (bun), video-use Python deps.

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/.."

echo "━━━ [1/3] ffmpeg ━━━"
if command -v ffmpeg &>/dev/null; then
    echo "  already installed: $(ffmpeg -version 2>&1 | head -1)"
else
    if command -v apt-get &>/dev/null; then
        apt-get update -qq && apt-get install -y -qq ffmpeg
    elif command -v brew &>/dev/null; then
        brew install ffmpeg
    else
        echo "  ⚠ ffmpeg not found — install it manually: https://ffmpeg.org/download.html"
    fi
fi

echo ""
echo "━━━ [2/3] hyperframes (bun install) ━━━"
cd "$ROOT/hyperframes"
bun install
echo "  hyperframes dependencies installed"

echo ""
echo "━━━ [3/3] Python dependencies (video-use) ━━━"
cd "$ROOT/video-use"
pip install --quiet requests librosa matplotlib pillow numpy
echo "  Python dependencies installed"

echo ""
echo "━━━ Setup complete ━━━"
echo ""
echo "Usage:"
echo "  export ELEVENLABS_API_KEY=your_key"
echo "  python editor/pipeline.py <your_video.mp4>"
echo ""
echo "Options:"
echo "  --language pt          transcript language (auto-detect if omitted)"
echo "  --silence-threshold    seconds of silence to cut (default 0.5)"
echo "  --skip-animations      cuts only, no Hyperframes overlays"
echo "  --preview              fast render for QC"
echo "  --subtitles            burn auto-generated captions"
