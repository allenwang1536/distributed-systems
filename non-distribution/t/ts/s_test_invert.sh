#!/bin/bash
# This is a student test

cd "$(dirname "$0")/../.." || exit 1

in="$(mktemp)"
out="$(mktemp)"
exp="$(mktemp)"

url="http://example.com/page1"

cat >"$in" <<'EOF'
a
a
b
a	b
a	b
EOF

cat >"$exp" <<EOF
a | 2 | $url
a b | 2 | $url
b | 1 | $url
EOF

cat "$in" | c/invert.sh "$url" | sort >"$out"
sort "$exp" >"$exp.sorted"

if ! diff -u "$exp.sorted" "$out" >&2; then
  echo "$0 failure: invert output mismatch"
  rm -f "$in" "$out" "$exp" "$exp.sorted"
  exit 1
fi

echo "$0 success"
rm -f "$in" "$out" "$exp" "$exp.sorted"
exit 0
