#!/bin/sh
set -e
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
NAME="${1:-88keys-countdown}"
OUT=/tmp/88keys-deploy
mkdir -p "$OUT"

echo "$NAME" | grep -Eq '^[a-z0-9-]+$' || { echo "站名只能用小写字母、数字、连字符"; exit 1; }
[ -f dist/index.html ] || { echo "dist/index.html 不存在"; exit 1; }
[ ! -e dist/dev.js ] || { echo "dist 里不该有 dev.js"; exit 1; }

(cd dist && find . -type f | sort | xargs shasum -a 256) > "$OUT/manifest-before.txt"

netlify sites:create --name "$NAME" --disable-linking --json > "$OUT/site.json"
SITE_ID=$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).id)' "$OUT/site.json")
echo "site_id: $SITE_ID"

netlify deploy --prod --site="$SITE_ID" --dir="$ROOT/dist" --json > "$OUT/deploy.json"
node -e 'const d=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));console.log("url:",d.url||d.site_url,"\ndeploy_id:",d.deploy_id)' "$OUT/deploy.json"

(cd dist && find . -type f | sort | xargs shasum -a 256) > "$OUT/manifest-after.txt"
cmp "$OUT/manifest-before.txt" "$OUT/manifest-after.txt" && echo "dist 文件未被改动"
