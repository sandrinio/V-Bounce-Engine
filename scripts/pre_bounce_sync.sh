#!/usr/bin/env bash

# pre_bounce_sync.sh
# 
# Run this before kicking off the Implementation Loop (Bounce).
# This prevents the "Stale Context" edge case by forcing the LanceDB
# index to refresh with the latest rules from LESSONS.md and ROADMAP.md.

echo "==========================================="
echo " V-Bounce OS: Pre-Bounce Sync Started"
echo "==========================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR" || exit 1

# 1. Check for Node Modules
if [ ! -d "node_modules" ]; then
    echo "Error: node_modules not found. Run 'npm install'."
    exit 1
fi

# 2. Rebuild the semantic search index
echo "Syncing V-Bounce Knowledge Base (LanceDB)..."
node ./scripts/vbounce_index.mjs --all

if [ $? -ne 0 ]; then
    echo "Error: LanceDB index sync failed."
    exit 1
fi

echo "==========================================="
echo " Pre-Bounce Sync Complete. RAG is fresh."
echo " Ready for Team Lead delegation."
echo "==========================================="
exit 0
