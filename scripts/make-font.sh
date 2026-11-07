#!/bin/sh
set -e
cd "$(dirname "$0")/.."
FONT=$(find /System/Library/AssetsV2 -name 'LingWaiSC-Medium.otf' 2>/dev/null | head -1)
[ -n "$FONT" ] || { echo "找不到 LingWaiSC-Medium.otf"; exit 1; }
mkdir -p src/fonts
UV_CACHE_DIR=/tmp/bead-uv-cache uv run --with fonttools --with brotli python -I scripts/subset-font.py "$FONT" src/fonts/handnote.woff2 "To 小北慢慢来，此刻重要也只有此刻~～YG26.秋"
ls -l src/fonts/handnote.woff2
