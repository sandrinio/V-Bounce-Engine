#!/usr/bin/env bash
# init_gate_config.sh — Auto-detect project stack and generate .bounce/gate-checks.json
# Usage: ./scripts/init_gate_config.sh [project-path]
#
# Run once during project setup or when the improve skill suggests new checks.
# Safe to re-run — merges with existing config (preserves custom checks).

set -euo pipefail

PROJECT_PATH="${1:-.}"
PROJECT_PATH="$(cd "$PROJECT_PATH" && pwd)"
CONFIG_PATH="${PROJECT_PATH}/.bounce/gate-checks.json"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}V-Bounce Engine Gate Config Initializer${NC}"
echo -e "Project: ${PROJECT_PATH}"
echo ""

# ── Detect stack ─────────────────────────────────────────────────────

LANGUAGE="unknown"
FRAMEWORK="unknown"
TEST_RUNNER="unknown"
BUILD_CMD=""
LINT_CMD=""
TEST_CMD=""

# Language detection
if [[ -f "${PROJECT_PATH}/tsconfig.json" ]]; then
  LANGUAGE="typescript"
elif [[ -f "${PROJECT_PATH}/package.json" ]]; then
  LANGUAGE="javascript"
elif [[ -f "${PROJECT_PATH}/pyproject.toml" || -f "${PROJECT_PATH}/setup.py" || -f "${PROJECT_PATH}/requirements.txt" ]]; then
  LANGUAGE="python"
elif [[ -f "${PROJECT_PATH}/Cargo.toml" ]]; then
  LANGUAGE="rust"
elif [[ -f "${PROJECT_PATH}/go.mod" ]]; then
  LANGUAGE="go"
elif [[ -f "${PROJECT_PATH}/build.gradle" || -f "${PROJECT_PATH}/pom.xml" ]]; then
  LANGUAGE="java"
elif [[ -f "${PROJECT_PATH}/Package.swift" ]]; then
  LANGUAGE="swift"
fi

echo -e "Language: ${GREEN}${LANGUAGE}${NC}"

# Framework detection (JS/TS ecosystem)
if [[ -f "${PROJECT_PATH}/package.json" ]]; then
  PKG_CONTENT=$(cat "${PROJECT_PATH}/package.json")

  if echo "$PKG_CONTENT" | grep -q '"next"'; then FRAMEWORK="nextjs"
  elif echo "$PKG_CONTENT" | grep -q '"react"'; then FRAMEWORK="react"
  elif echo "$PKG_CONTENT" | grep -q '"vue"'; then FRAMEWORK="vue"
  elif echo "$PKG_CONTENT" | grep -q '"svelte"'; then FRAMEWORK="svelte"
  elif echo "$PKG_CONTENT" | grep -q '"express"'; then FRAMEWORK="express"
  elif echo "$PKG_CONTENT" | grep -q '"fastify"'; then FRAMEWORK="fastify"
  elif echo "$PKG_CONTENT" | grep -q '"@angular/core"'; then FRAMEWORK="angular"
  fi

  # Test runner
  if echo "$PKG_CONTENT" | grep -q '"vitest"'; then TEST_RUNNER="vitest"
  elif echo "$PKG_CONTENT" | grep -q '"jest"'; then TEST_RUNNER="jest"
  elif echo "$PKG_CONTENT" | grep -q '"mocha"'; then TEST_RUNNER="mocha"
  elif echo "$PKG_CONTENT" | grep -q '"ava"'; then TEST_RUNNER="ava"
  fi

  # Commands from scripts
  BUILD_CMD=$(node -e "try{const p=require('${PROJECT_PATH}/package.json');console.log(p.scripts&&p.scripts.build||'')}catch(e){}" 2>/dev/null || echo "")
  LINT_CMD=$(node -e "try{const p=require('${PROJECT_PATH}/package.json');console.log(p.scripts&&p.scripts.lint||'')}catch(e){}" 2>/dev/null || echo "")
  TEST_CMD=$(node -e "try{const p=require('${PROJECT_PATH}/package.json');const t=p.scripts&&p.scripts.test||'';if(t&&!t.includes('no test specified'))console.log(t);else console.log('')}catch(e){}" 2>/dev/null || echo "")
elif [[ "$LANGUAGE" == "python" ]]; then
  if command -v pytest &>/dev/null; then TEST_RUNNER="pytest"; fi
  if command -v ruff &>/dev/null; then LINT_CMD="ruff check ."; fi
elif [[ "$LANGUAGE" == "rust" ]]; then
  TEST_RUNNER="cargo"
  BUILD_CMD="cargo build"
  LINT_CMD="cargo clippy"
elif [[ "$LANGUAGE" == "go" ]]; then
  TEST_RUNNER="go"
  BUILD_CMD="go build ./..."
  LINT_CMD="golangci-lint run"
fi

echo -e "Framework: ${GREEN}${FRAMEWORK}${NC}"
echo -e "Test runner: ${GREEN}${TEST_RUNNER}${NC}"
[[ -n "$BUILD_CMD" ]] && echo -e "Build: ${GREEN}${BUILD_CMD}${NC}"
[[ -n "$LINT_CMD" ]] && echo -e "Lint: ${GREEN}${LINT_CMD}${NC}"
echo ""

# ── Generate config ──────────────────────────────────────────────────

# Build QA checks array
QA_CHECKS='[
    { "id": "tests_exist", "enabled": true, "description": "Verify test files exist for modified source files" },
    { "id": "tests_pass", "enabled": true, "description": "Run test suite" },
    { "id": "build", "enabled": true, "description": "Run build command" },
    { "id": "lint", "enabled": true, "description": "Run linter" },
    { "id": "no_debug_output", "enabled": true, "description": "No debug statements in modified files" },
    { "id": "no_todo_fixme", "enabled": true, "description": "No TODO/FIXME in modified files" },
    { "id": "exports_have_docs", "enabled": true, "description": "Exported symbols have doc comments" }
  ]'

# Build Architect checks array
ARCH_CHECKS='[
    { "id": "tests_exist", "enabled": true, "description": "Verify test files exist for modified source files" },
    { "id": "tests_pass", "enabled": true, "description": "Run test suite" },
    { "id": "build", "enabled": true, "description": "Run build command" },
    { "id": "lint", "enabled": true, "description": "Run linter" },
    { "id": "no_debug_output", "enabled": true, "description": "No debug statements in modified files" },
    { "id": "no_todo_fixme", "enabled": true, "description": "No TODO/FIXME in modified files" },
    { "id": "exports_have_docs", "enabled": true, "description": "Exported symbols have doc comments" },
    { "id": "no_new_deps", "enabled": true, "description": "No new dependencies without review" },
    { "id": "file_size", "enabled": true, "max_lines": 500, "description": "Source files under 500 lines" }
  ]'

# Write config
mkdir -p "$(dirname "$CONFIG_PATH")"

cat > "$CONFIG_PATH" << HEREDOC
{
  "version": 1,
  "detected_stack": {
    "language": "${LANGUAGE}",
    "framework": "${FRAMEWORK}",
    "test_runner": "${TEST_RUNNER}",
    "build_cmd": "${BUILD_CMD}",
    "lint_cmd": "${LINT_CMD}",
    "test_cmd": "${TEST_CMD}"
  },
  "qa_checks": ${QA_CHECKS},
  "arch_checks": ${ARCH_CHECKS},
  "custom_checks": []
}
HEREDOC

echo -e "${GREEN}Generated: ${CONFIG_PATH}${NC}"
echo ""
echo "Universal checks enabled. To add project-specific checks:"
echo "  1. Run sprints and let agents collect Process Feedback"
echo "  2. Use the 'improve' skill to propose new checks"
echo "  3. Or manually add entries to the custom_checks array"
echo ""
echo -e "Example custom check (add to custom_checks):"
echo '  { "id": "custom_grep", "gate": "arch", "enabled": true,'
echo '    "pattern": "var\\(--my-prefix-", "glob": "*.tsx",'
echo '    "should_find": false, "description": "No raw CSS vars in components" }'
