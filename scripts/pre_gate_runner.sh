#!/usr/bin/env bash
# pre_gate_runner.sh — Runs pre-gate checks before QA or Architect agents
# Usage: ./scripts/pre_gate_runner.sh <qa|arch> [worktree-path] [base-branch]
#
# Reads .bounce/gate-checks.json for check configuration.
# If no config exists, runs universal defaults with auto-detected stack.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/pre_gate_common.sh"

# ── Arguments ────────────────────────────────────────────────────────

GATE_TYPE="${1:-}"
WORKTREE_PATH="${2:-.}"
BASE_BRANCH="${3:-}"
PLAIN_RESULTS=""

if [[ -z "$GATE_TYPE" ]] || [[ "$GATE_TYPE" != "qa" && "$GATE_TYPE" != "arch" ]]; then
  echo "Usage: ./scripts/pre_gate_runner.sh <qa|arch> [worktree-path] [base-branch]"
  echo ""
  echo "  qa    — Run QA pre-gate checks (before QA agent)"
  echo "  arch  — Run Architect pre-gate checks (before Architect agent)"
  echo ""
  echo "  worktree-path  — Path to story worktree (default: current dir)"
  echo "  base-branch    — Branch to diff against (default: auto-detect)"
  exit 1
fi

# Resolve to absolute path
WORKTREE_PATH="$(cd "$WORKTREE_PATH" && pwd)"

echo -e "${CYAN}V-Bounce OS Pre-Gate Scanner${NC}"
echo -e "Gate: ${YELLOW}${GATE_TYPE}${NC}"
echo -e "Target: ${WORKTREE_PATH}"
echo ""

# ── Auto-detect base branch if not provided ──────────────────────────

if [[ -z "$BASE_BRANCH" ]]; then
  cd "$WORKTREE_PATH"
  # Try to find the sprint branch this story branched from
  BASE_BRANCH=$(git log --oneline --merges -1 --format=%H 2>/dev/null || echo "")
  if [[ -z "$BASE_BRANCH" ]]; then
    # Fall back to parent branch detection
    BASE_BRANCH=$(git rev-parse --abbrev-ref HEAD@{upstream} 2>/dev/null || echo "")
  fi
fi

# ── Load config or use defaults ──────────────────────────────────────

CONFIG_PATH="${WORKTREE_PATH}/.bounce/gate-checks.json"
HAS_CONFIG=false

if [[ -f "$CONFIG_PATH" ]]; then
  HAS_CONFIG=true
  echo -e "Config: ${GREEN}${CONFIG_PATH}${NC}"
else
  # Check parent repo too (worktree might not have it)
  REPO_ROOT=$(cd "$WORKTREE_PATH" && git rev-parse --show-toplevel 2>/dev/null || echo "$WORKTREE_PATH")
  CONFIG_PATH="${REPO_ROOT}/.bounce/gate-checks.json"
  if [[ -f "$CONFIG_PATH" ]]; then
    HAS_CONFIG=true
    echo -e "Config: ${GREEN}${CONFIG_PATH}${NC}"
  else
    echo -e "Config: ${YELLOW}None found — using universal defaults${NC}"
  fi
fi

echo ""

# ── Get modified files ───────────────────────────────────────────────

MODIFIED_FILES=$(get_modified_files "$WORKTREE_PATH" "$BASE_BRANCH")

# ── Run checks ───────────────────────────────────────────────────────

run_checks_from_config() {
  local gate="$1"
  local checks_key="${gate}_checks"

  # Parse config with node (available since V-Bounce requires it)
  local check_ids
  check_ids=$(node -e "
    const fs = require('fs');
    const cfg = JSON.parse(fs.readFileSync('${CONFIG_PATH}', 'utf8'));
    const checks = cfg['${checks_key}'] || [];
    checks.filter(c => c.enabled !== false).forEach(c => {
      console.log(JSON.stringify(c));
    });
  " 2>/dev/null)

  while IFS= read -r check_json; do
    [[ -z "$check_json" ]] && continue

    local id cmd pattern glob should_find max_lines description
    id=$(echo "$check_json" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log(d.id||'')" 2>/dev/null)
    cmd=$(echo "$check_json" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log(d.cmd||'')" 2>/dev/null)
    pattern=$(echo "$check_json" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log(d.pattern||'')" 2>/dev/null)
    glob=$(echo "$check_json" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log(d.glob||'')" 2>/dev/null)
    should_find=$(echo "$check_json" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log(d.should_find||'false')" 2>/dev/null)
    max_lines=$(echo "$check_json" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log(d.max_lines||'500')" 2>/dev/null)
    description=$(echo "$check_json" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log(d.description||d.id||'')" 2>/dev/null)

    case "$id" in
      tests_exist)       check_tests_exist "$WORKTREE_PATH" "$MODIFIED_FILES" ;;
      tests_pass)        check_tests_pass "$WORKTREE_PATH" ;;
      build)             check_build "$WORKTREE_PATH" ;;
      lint)              check_lint "$WORKTREE_PATH" ;;
      no_debug_output)   check_no_debug_output "$WORKTREE_PATH" "$MODIFIED_FILES" ;;
      no_todo_fixme)     check_no_todo_fixme "$WORKTREE_PATH" "$MODIFIED_FILES" ;;
      exports_have_docs) check_exports_have_docs "$WORKTREE_PATH" "$MODIFIED_FILES" ;;
      no_new_deps)       check_no_new_dependencies "$WORKTREE_PATH" "$BASE_BRANCH" ;;
      file_size)         check_file_size_limit "$WORKTREE_PATH" "$MODIFIED_FILES" "$max_lines" ;;
      custom_cmd)        run_custom_check "$WORKTREE_PATH" "$description" "$cmd" "$description" ;;
      custom_grep)       run_custom_grep_check "$WORKTREE_PATH" "$description" "$pattern" "$glob" "$should_find" ;;
      *)
        # Unknown built-in — try as custom command if cmd is provided
        if [[ -n "$cmd" ]]; then
          run_custom_check "$WORKTREE_PATH" "$id" "$cmd" "$description"
        else
          record_result "$id" "SKIP" "Unknown check type"
          record_result_plain "$id" "SKIP" "Unknown check type"
        fi
        ;;
    esac
  done <<< "$check_ids"
}

run_universal_defaults() {
  local gate="$1"

  # QA-level checks (always run)
  check_tests_exist "$WORKTREE_PATH" "$MODIFIED_FILES"
  check_tests_pass "$WORKTREE_PATH"
  check_build "$WORKTREE_PATH"
  check_lint "$WORKTREE_PATH"
  check_no_debug_output "$WORKTREE_PATH" "$MODIFIED_FILES"
  check_no_todo_fixme "$WORKTREE_PATH" "$MODIFIED_FILES"
  check_exports_have_docs "$WORKTREE_PATH" "$MODIFIED_FILES"

  # Architect-level checks (only for arch gate)
  if [[ "$gate" == "arch" ]]; then
    check_no_new_dependencies "$WORKTREE_PATH" "$BASE_BRANCH"
    check_file_size_limit "$WORKTREE_PATH" "$MODIFIED_FILES" 500
  fi
}

# ── Execute ──────────────────────────────────────────────────────────

if [[ "$HAS_CONFIG" == "true" ]]; then
  run_checks_from_config "$GATE_TYPE"
else
  run_universal_defaults "$GATE_TYPE"
fi

# ── Output ───────────────────────────────────────────────────────────

print_summary

# Write report
REPORT_DIR="${WORKTREE_PATH}/.bounce/reports"
REPORT_FILE="${REPORT_DIR}/pre-${GATE_TYPE}-scan.txt"
write_report "$REPORT_FILE"
echo ""
echo -e "Report: ${CYAN}${REPORT_FILE}${NC}"

# Exit code
if [[ $FAIL_COUNT -gt 0 ]]; then
  echo -e "\n${RED}Gate check failed with ${FAIL_COUNT} failure(s).${NC}"
  exit 1
else
  echo -e "\n${GREEN}All checks passed.${NC}"
  exit 0
fi
