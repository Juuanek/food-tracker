#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${ROOT}/_site"
rm -rf "$OUT"
mkdir -p "$OUT"

cp "$ROOT/index.html" \
   "$ROOT/app.js" \
   "$ROOT/bootstrap.js" \
   "$ROOT/firebase-core.js" \
   "$ROOT/firebase-auth.js" \
   "$ROOT/firebase-store.js" \
   "$ROOT/data-merge.js" \
   "$ROOT/styles.css" \
   "$ROOT/migrate-local.html" \
   "$ROOT/migrate-local.js" \
   "$OUT/"

touch "$OUT/.nojekyll"

node "$ROOT/scripts/write-firebase-config.js" "$OUT/firebase-config.js"

echo "Site ready in _site/"
