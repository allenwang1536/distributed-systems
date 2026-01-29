#!/bin/bash
# This is a student test

cd "$(dirname "$0")/../.." || exit 1

html="$(mktemp)"
out="$(mktemp)"

cat >"$html" <<'EOF'
<html>
  <head>
    <title>My Title</title>
    <style>.x{color:red}</style>
    <script>console.log("nope")</script>
  </head>
  <body>
    <h1>Hello</h1>
    <p>World</p>
  </body>
</html>
EOF

cat "$html" | c/getText.js >"$out"

grep -q "HELLO" "$out" || { echo "$0 failure: missing Hello"; rm -f "$html" "$out"; exit 1; }
grep -q "World" "$out" || { echo "$0 failure: missing World"; rm -f "$html" "$out"; exit 1; }
! grep -q "<h1>" "$out" || { echo "$0 failure: leaked HTML tags"; rm -f "$html" "$out"; exit 1; }

! grep -q "console\.log" "$out" || { echo "$0 failure: script content not skipped"; rm -f "$html" "$out"; exit 1; }

echo "$0 success"
rm -f "$html" "$out"
exit 0
