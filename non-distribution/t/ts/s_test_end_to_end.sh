#!/bin/bash
# This is a student test

cd "$(dirname "$0")/../.." || exit 1

mkdir -p d

# reset data files
: > d/global-index.txt
: > d/visited.txt
: > d/urls.txt

# create local html page
page="$(mktemp --suffix=.html)"
cat >"$page" <<'EOF'
<html><body>
  <h1>Apple apple banana</h1>
  <p>Apple pie</p>
</body></html>
EOF

url="file://$page"

# crawl page
./crawl.sh "$url" > d/content.txt || { echo "$0 failure: crawl"; exit 1; }

# index content
./index.sh d/content.txt "$url" || { echo "$0 failure: index"; exit 1; }

# query global index
out="$(mktemp)"
node query.js apple >"$out"

# expect appl (stemmed) to appear in index
if ! grep -q "^appl |" "$out"; then
  echo "$0 failure: query did not return apple"
  rm -f "$page" "$out"
  exit 1
fi

echo "$0 success"

rm -f "$page" "$out"
exit 0
