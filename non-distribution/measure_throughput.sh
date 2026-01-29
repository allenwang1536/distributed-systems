#!/bin/bash
set -e

cd "$(dirname "$0")" || exit 1

SANDBOX_URL="https://cs.brown.edu/courses/csci1380/sandbox/1"
NUM_QUERIES=500
QUERY_TERM="the"

echo "== Sandbox throughput measurement =="

# reset state
: > d/visited.txt
: > d/global-index.txt
: > d/urls.txt

echo "$SANDBOX_URL" > d/urls.txt

echo
echo "Running engine on sandbox..."

START=$(date +%s.%N)
./engine.sh >/dev/null
END=$(date +%s.%N)

ELAPSED=$(echo "$END - $START" | bc)
PAGES=$(wc -l < d/visited.txt)

CRAWL_TP=$(echo "scale=3; $PAGES / $ELAPSED" | bc)

echo
echo "Crawler / Indexer:"
echo "  Pages processed : $PAGES"
echo "  Time (sec)      : $ELAPSED"
echo "  Throughput      : $CRAWL_TP pages/sec"

# query throughput

echo
echo "Running query workload..."

START=$(date +%s.%N)
for ((i=0; i<NUM_QUERIES; i++)); do
  node query.js "$QUERY_TERM" >/dev/null
done
END=$(date +%s.%N)

ELAPSED_Q=$(echo "$END - $START" | bc)
QUERY_TP=$(echo "scale=3; $NUM_QUERIES / $ELAPSED_Q" | bc)

echo
echo "Query:"
echo "  Queries run     : $NUM_QUERIES"
echo "  Time (sec)      : $ELAPSED_Q"
echo "  Throughput      : $QUERY_TP queries/sec"

echo
echo "== Done =="
