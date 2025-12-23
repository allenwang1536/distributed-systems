#!/usr/bin/env bash

set +e

kill_by_pattern() {
    local pattern="$1"
    if command -v pkill >/dev/null 2>&1; then
        pkill -f "$pattern" >/dev/null 2>&1
    fi
}

# Try to stop spawned nodes that run the project entrypoints.
kill_by_pattern "node .*distribution.js"
kill_by_pattern "node .*config.js"

exit 0
