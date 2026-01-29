#!/bin/bash
# This is a student test

cd "$(dirname "$0")/../.." || exit 1

in="$(mktemp)"
out="$(mktemp)"
exp="$(mktemp)"

cat >"$in" <<'EOF'
The Cafe!!! 123
RACE, track.
EOF

cat >"$exp" <<'EOF'
cafe
race
track
EOF

cat "$in" | c/process.sh >"$out"

if ! diff -u "$exp" "$out" >&2; then
  echo "$0 failure: process output mismatch"
  rm -f "$in" "$out" "$exp"
  exit 1
fi

if ! echo "the the the" | c/process.sh >/dev/null; then
  echo "$0 failure: process.sh should not exit nonzero on empty output"
  rm -f "$in" "$out" "$exp"
  exit 1
fi

echo "$0 success"
rm -f "$in" "$out" "$exp"
exit 0
