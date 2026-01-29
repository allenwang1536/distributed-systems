#!/bin/bash
# This is a student test

cd "$(dirname "$0")/../.." || exit 1

in="$(mktemp)"
out="$(mktemp)"
exp="$(mktemp)"

cat >"$in" <<'EOF'
a
b
c
d
EOF

cat >"$exp" <<'EOF'
a
a	b
a	b	c
b
b	c
b	c	d
c
c	d
d
EOF

cat "$in" | c/combine.sh | sort >"$out"
sort "$exp" >"$exp.sorted"

if ! diff -u "$exp.sorted" "$out" >&2; then
  echo "$0 failure: combine output mismatch"
  rm -f "$in" "$out" "$exp" "$exp.sorted"
  exit 1
fi

echo "$0 success"
rm -f "$in" "$out" "$exp" "$exp.sorted"
exit 0
