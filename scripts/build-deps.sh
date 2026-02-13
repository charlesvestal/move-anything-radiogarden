#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

OUT_DIR="$REPO_ROOT/build/deps/bin"
WORK_DIR="$REPO_ROOT/build/deps/work"

mkdir -p "$OUT_DIR" "$WORK_DIR"

echo "=== Downloading ffmpeg (arm64 static build) ==="
FFMPEG_URL="https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linuxarm64-gpl.tar.xz"
curl -fL -o "$WORK_DIR/ffmpeg.tar.xz" "$FFMPEG_URL"
rm -rf "$WORK_DIR/ffmpeg-extract"
mkdir -p "$WORK_DIR/ffmpeg-extract"
tar -xJf "$WORK_DIR/ffmpeg.tar.xz" -C "$WORK_DIR/ffmpeg-extract"
FF_DIR="$(find "$WORK_DIR/ffmpeg-extract" -maxdepth 1 -type d -name 'ffmpeg-*linuxarm64*' | head -n 1)"
if [ -z "$FF_DIR" ]; then
  echo "Failed to locate extracted ffmpeg directory"
  exit 1
fi
cp "$FF_DIR/bin/ffmpeg" "$OUT_DIR/ffmpeg"
chmod +x "$OUT_DIR/ffmpeg"

echo "=== Dependency build complete ==="
ls -lh "$OUT_DIR"
file "$OUT_DIR/ffmpeg" || true
