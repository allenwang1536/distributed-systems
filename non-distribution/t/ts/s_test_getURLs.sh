#!/bin/bash
# This is a student test

cd "$(dirname "$0")/../.." || exit 1

html="$(mktemp)"
out="$(mktemp)"
exp="$(mktemp)"

base="https://example.com/level1/index.html"

cat >"$html" <<'EOF'
<html>
  <body>
    <a href="level2a/index.html">A</a>
    <a href="/abs/path">B</a>
    <a href="https://other.com/x">C</a>
    <a>NoHref</a>
    <link href="https://should-not-appear.com/stylesheet.css" rel="stylesheet" />
  </body>
</html>
EOF

cat >"$exp" <<'EOF'
https://example.com/abs/path
https://example.com/level1/level2a/index.html
https://other.com/x
EOF

cat "$html" | c/getURLs.js "$base" | sort >"$out"

if ! diff -u <(sort "$exp") "$out" >&2; then
  echo "$0 failure: URL sets are not identical"
  rm -f "$html" "$out" "$exp"
  exit 1
fi

echo "$0 success"
rm -f "$html" "$out" "$exp"
exit 0
