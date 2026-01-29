#!/bin/bash
# This is a student test

cd "$(dirname "$0")/../.." || exit 1

mkdir -p d

# create global index
cat > d/global-index.txt <<'EOF'
apple | url1 3 url2 1
apple pie | url9 2
banana | url3 5
EOF

out="$(mktemp)"
exp="$(mktemp)"

# basic query
node query.js apple >"$out"

cat >"$exp" <<'EOF'
apple | url1 3 url2 1
apple pie | url9 2
EOF

sort "$out" >"$out.sorted"
sort "$exp" >"$exp.sorted"

if ! diff -u "$exp.sorted" "$out.sorted" >&2; then
  echo "$0 failure: query output mismatch for 'apple'"
  rm -f "$out" "$exp" "$out.sorted" "$exp.sorted"
  exit 1
fi

# stopword only query should produce no output (edg case)
node query.js the >"$out"
if [ -s "$out" ]; then
  echo "$0 failure: stopword-only query should produce no output"
  rm -f "$out" "$exp" "$out.sorted" "$exp.sorted"
  exit 1
fi

echo "$0 success"
rm -f "$out" "$exp" "$out.sorted" "$exp.sorted"
exit 0
