#!/bin/bash
# This is a student test

cd "$(dirname "$0")/../.." || exit 1

in="$(mktemp)"
out="$(mktemp)"
exp="$(mktemp)"

cat >"$in" <<'EOF'
running
runs
cats
studies
studying
happily

EOF

cat >"$exp" <<'EOF'
run
run
cat
studi
studi
happili
EOF

cat "$in" | c/stem.js >"$out"

if ! diff -u "$exp" "$out" >&2; then
  echo "$0 failure: stem output mismatch"
  rm -f "$in" "$out" "$exp"
  exit 1
fi

echo "$0 success"
rm -f "$in" "$out" "$exp"
exit 0
