#!/usr/bin/env bash
set -e

# Check if we are inside a git repository, otherwise exit
if ! git rev-parse --is-inside-work-tree &> /dev/null; then
    echo "[setup] not insde a git repository, make sure your project is under git version control" >&2
    exit 1
fi

top=$(git rev-parse --show-toplevel)
cd "$top" || exit 1

git fetch --quiet
branch=$(git symbolic-ref --short HEAD)
upstream=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || true)

if [ -z "$upstream" ]; then
  echo "[setup] no upstream configured for $branch"
  exit 1
fi

behind=$(git rev-list --count HEAD.."$upstream")

if [ "$behind" -gt 0 ]; then
  echo "[setup] your branch '$branch' is behind '$upstream' by $behind commits. Please pull the latest changes."
  git pull --rebase
else
  echo "[setup] your branch '$branch' is up to date with '$upstream'!"
fi

npm install
( cd non-distribution && npm install )
