#!/bin/sh
set -e
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
SITE_ID=670329cd-9248-4d76-93b5-6e76569d621c
npm test
npm run build
[ ! -e dist/dev.js ] || { echo "dist 里不该有 dev.js"; exit 1; }
netlify deploy --prod --site="$SITE_ID" --dir="$ROOT/dist"
