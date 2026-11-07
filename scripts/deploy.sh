#!/bin/sh
set -e
cd "$(dirname "$0")/.."
NAME="${1:-88keys-countdown}"
npm test
npm run build
[ ! -e dist/dev.js ] || { echo "dist 里不该有 dev.js"; exit 1; }
if [ -f .netlify/state.json ]; then
  netlify deploy --prod --dir dist
else
  netlify deploy --prod --dir dist --create-site "$NAME"
fi
