#!/bin/bash
# This is a student test

cd "$(dirname "$0")/../.." || exit 1

local_in="$(mktemp)"
global_file="$(mktemp)"
out="$(mktemp)"
exp="$(mktemp)"

cat >"$local_in" <<'EOF'
apple | 2 | url1
apple | 1 | url2
banana | 5 | url9
EOF

cat >"$global_file" <<'EOF'
apple | url2 7 url3 1
carrot | url5 4
EOF

cat >"$exp" <<'EOF'
apple | url2 8 url1 2 url3 1
banana | url9 5
carrot | url5 4
EOF

cat "$local_in" | c/merge.js "$global_file" | sort >"$out"
sort "$exp" >"$exp.sorted"

if ! diff -u "$exp.sorted" "$out" >&2; then
  echo "$0 failure: merge output mismatch"
  rm -f "$local_in" "$global_file" "$out" "$exp" "$exp.sorted"
  exit 1
fi

# missing file should not crash (edge case)
missing="$(mktemp)"
rm -f "$missing"
out2="$(mktemp)"

cat "$local_in" | c/merge.js "$missing" >"$out2"
grep -q "^apple |" "$out2" || { echo "$0 failure: missing-global did not output apple"; exit 1; }
grep -q "^banana |" "$out2" || { echo "$0 failure: missing-global did not output banana"; exit 1; }

echo "$0 success"
rm -f "$local_in" "$global_file" "$out" "$exp" "$exp.sorted" "$out2"
exit 0
