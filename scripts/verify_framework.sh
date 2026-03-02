#!/usr/bin/env bash

# verify_framework.sh
# 
# Wrapper script to execute the Framework Integrity Check.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR" || exit 1

node ./scripts/verify_framework.mjs
exit $?
