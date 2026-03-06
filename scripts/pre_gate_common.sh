#!/usr/bin/env bash
# pre_gate_common.sh — Shared gate check functions for V-Bounce OS
# Sourced by pre_gate_runner.sh. Never run directly.

set -euo pipefail

# ── Colors & formatting ──────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0
RESULTS=""

record_result() {
  local id="$1" status="$2" detail="$3"
  case "$status" in
    PASS) PASS_COUNT=$((PASS_COUNT + 1)); RESULTS+="| ${id} | ${GREEN}PASS${NC} | ${detail} |"$'\n' ;;
    FAIL) FAIL_COUNT=$((FAIL_COUNT + 1)); RESULTS+="| ${id} | ${RED}FAIL${NC} | ${detail} |"$'\n' ;;
    SKIP) SKIP_COUNT=$((SKIP_COUNT + 1)); RESULTS+="| ${id} | ${YELLOW}SKIP${NC} | ${detail} |"$'\n' ;;
  esac
}

record_result_plain() {
  local id="$1" status="$2" detail="$3"
  PLAIN_RESULTS+="| ${id} | ${status} | ${detail} |"$'\n'
}

print_summary() {
  echo ""
  echo -e "${CYAN}── Gate Check Results ──${NC}"
  echo "| Check | Status | Detail |"
  echo "|-------|--------|--------|"
  echo -e "$RESULTS"
  echo ""
  echo -e "PASS: ${GREEN}${PASS_COUNT}${NC}  FAIL: ${RED}${FAIL_COUNT}${NC}  SKIP: ${YELLOW}${SKIP_COUNT}${NC}"
}

write_report() {
  local output_path="$1"
  mkdir -p "$(dirname "$output_path")"
  {
    echo "# Pre-Gate Scan Results"
    echo "Date: $(date -u '+%Y-%m-%d %H:%M UTC')"
    echo "Target: ${WORKTREE_PATH}"
    echo "Gate: ${GATE_TYPE}"
    echo ""
    echo "| Check | Status | Detail |"
    echo "|-------|--------|--------|"
    echo -e "$PLAIN_RESULTS"
    echo ""
    echo "PASS: ${PASS_COUNT}  FAIL: ${FAIL_COUNT}  SKIP: ${SKIP_COUNT}"
  } > "$output_path"
}

# ── Stack detection helpers ──────────────────────────────────────────

detect_test_cmd() {
  local dir="$1"
  if [[ -f "${dir}/package.json" ]]; then
    local test_script
    test_script=$(node -e "try{const p=require('${dir}/package.json');console.log(p.scripts&&p.scripts.test||'')}catch(e){}" 2>/dev/null || echo "")
    if [[ -n "$test_script" && "$test_script" != "echo \"Error: no test specified\" && exit 1" ]]; then
      echo "npm test"
      return
    fi
  fi
  if [[ -f "${dir}/pytest.ini" || -f "${dir}/pyproject.toml" || -f "${dir}/setup.cfg" ]]; then
    echo "pytest"
    return
  fi
  if [[ -f "${dir}/Cargo.toml" ]]; then
    echo "cargo test"
    return
  fi
  if [[ -f "${dir}/go.mod" ]]; then
    echo "go test ./..."
    return
  fi
  echo ""
}

detect_build_cmd() {
  local dir="$1"
  if [[ -f "${dir}/package.json" ]]; then
    local build_script
    build_script=$(node -e "try{const p=require('${dir}/package.json');console.log(p.scripts&&p.scripts.build||'')}catch(e){}" 2>/dev/null || echo "")
    if [[ -n "$build_script" ]]; then
      echo "npm run build"
      return
    fi
  fi
  if [[ -f "${dir}/Cargo.toml" ]]; then
    echo "cargo build"
    return
  fi
  if [[ -f "${dir}/go.mod" ]]; then
    echo "go build ./..."
    return
  fi
  echo ""
}

detect_lint_cmd() {
  local dir="$1"
  if [[ -f "${dir}/package.json" ]]; then
    local lint_script
    lint_script=$(node -e "try{const p=require('${dir}/package.json');console.log(p.scripts&&p.scripts.lint||'')}catch(e){}" 2>/dev/null || echo "")
    if [[ -n "$lint_script" ]]; then
      echo "npm run lint"
      return
    fi
  fi
  if command -v ruff &>/dev/null && [[ -f "${dir}/pyproject.toml" ]]; then
    echo "ruff check ."
    return
  fi
  if [[ -f "${dir}/Cargo.toml" ]]; then
    echo "cargo clippy"
    return
  fi
  echo ""
}

detect_source_glob() {
  local dir="$1"
  if [[ -f "${dir}/tsconfig.json" ]]; then
    echo "*.{ts,tsx}"
    return
  fi
  if [[ -f "${dir}/package.json" ]]; then
    echo "*.{js,jsx}"
    return
  fi
  if [[ -f "${dir}/pyproject.toml" || -f "${dir}/setup.py" || -f "${dir}/setup.cfg" ]]; then
    echo "*.py"
    return
  fi
  if [[ -f "${dir}/Cargo.toml" ]]; then
    echo "*.rs"
    return
  fi
  if [[ -f "${dir}/go.mod" ]]; then
    echo "*.go"
    return
  fi
  echo "*"
}

detect_dep_file() {
  local dir="$1"
  if [[ -f "${dir}/package-lock.json" ]]; then echo "package.json"; return; fi
  if [[ -f "${dir}/yarn.lock" ]]; then echo "package.json"; return; fi
  if [[ -f "${dir}/pnpm-lock.yaml" ]]; then echo "package.json"; return; fi
  if [[ -f "${dir}/requirements.txt" ]]; then echo "requirements.txt"; return; fi
  if [[ -f "${dir}/Pipfile.lock" ]]; then echo "Pipfile"; return; fi
  if [[ -f "${dir}/pyproject.toml" ]]; then echo "pyproject.toml"; return; fi
  if [[ -f "${dir}/Cargo.lock" ]]; then echo "Cargo.toml"; return; fi
  if [[ -f "${dir}/go.sum" ]]; then echo "go.mod"; return; fi
  echo ""
}

detect_test_pattern() {
  local dir="$1"
  if [[ -f "${dir}/tsconfig.json" || -f "${dir}/package.json" ]]; then
    echo '\.test\.\|\.spec\.\|__tests__'
    return
  fi
  if [[ -f "${dir}/pyproject.toml" || -f "${dir}/setup.py" ]]; then
    echo 'test_\|_test\.py'
    return
  fi
  if [[ -f "${dir}/Cargo.toml" ]]; then
    echo '_test\.rs\|tests/'
    return
  fi
  echo '\.test\.\|\.spec\.\|test_'
}

detect_doc_comment_pattern() {
  local dir="$1"
  if [[ -f "${dir}/tsconfig.json" || -f "${dir}/package.json" ]]; then
    echo '/\*\*'
    return
  fi
  if [[ -f "${dir}/pyproject.toml" || -f "${dir}/setup.py" ]]; then
    echo '"""'
    return
  fi
  if [[ -f "${dir}/Cargo.toml" ]]; then
    echo '///'
    return
  fi
  echo '/\*\*\|"""\|///'
}

detect_export_pattern() {
  local dir="$1"
  if [[ -f "${dir}/tsconfig.json" || -f "${dir}/package.json" ]]; then
    echo 'export '
    return
  fi
  if [[ -f "${dir}/pyproject.toml" || -f "${dir}/setup.py" ]]; then
    echo '^def \|^class '
    return
  fi
  if [[ -f "${dir}/Cargo.toml" ]]; then
    echo '^pub '
    return
  fi
  if [[ -f "${dir}/go.mod" ]]; then
    echo '^func [A-Z]'
    return
  fi
  echo 'export \|^def \|^class \|^pub \|^func [A-Z]'
}

detect_debug_pattern() {
  local dir="$1"
  if [[ -f "${dir}/tsconfig.json" || -f "${dir}/package.json" ]]; then
    echo 'console\.log\|console\.debug'
    return
  fi
  if [[ -f "${dir}/pyproject.toml" || -f "${dir}/setup.py" ]]; then
    echo 'print(\|breakpoint()'
    return
  fi
  if [[ -f "${dir}/Cargo.toml" ]]; then
    echo 'dbg!\|println!'
    return
  fi
  if [[ -f "${dir}/go.mod" ]]; then
    echo 'fmt\.Print'
    return
  fi
  echo 'console\.log\|print(\|dbg!\|fmt\.Print'
}

# ── Get modified files from git diff ─────────────────────────────────

get_modified_files() {
  local dir="$1"
  local base_branch="${2:-}"
  cd "$dir"
  if [[ -n "$base_branch" ]]; then
    git diff --name-only "$base_branch"...HEAD -- . 2>/dev/null || git diff --name-only HEAD~1 -- . 2>/dev/null || echo ""
  else
    git diff --name-only HEAD~1 -- . 2>/dev/null || echo ""
  fi
}

# ── Universal check functions ────────────────────────────────────────

check_tests_exist() {
  local dir="$1" modified_files="$2"
  local test_pattern
  test_pattern=$(detect_test_pattern "$dir")
  local source_glob
  source_glob=$(detect_source_glob "$dir")

  if [[ -z "$modified_files" ]]; then
    record_result "tests_exist" "SKIP" "No modified files detected"
    record_result_plain "tests_exist" "SKIP" "No modified files detected"
    return
  fi

  local missing=0
  local checked=0
  while IFS= read -r file; do
    [[ -z "$file" ]] && continue
    # Skip test files themselves, configs, docs
    if echo "$file" | grep -qE '(\.test\.|\.spec\.|__tests__|test_|_test\.|\.md$|\.json$|\.yml$|\.yaml$|\.config\.)'; then
      continue
    fi
    # Only check source files
    if ! echo "$file" | grep -qE "\.(ts|tsx|js|jsx|py|rs|go)$"; then
      continue
    fi
    checked=$((checked + 1))
    local basename
    basename=$(basename "$file" | sed 's/\.[^.]*$//')
    # Look for a corresponding test file anywhere in the tree
    if ! find "$dir" -name "*${basename}*" 2>/dev/null | grep -q "$test_pattern"; then
      missing=$((missing + 1))
    fi
  done <<< "$modified_files"

  if [[ $checked -eq 0 ]]; then
    record_result "tests_exist" "SKIP" "No source files in diff"
    record_result_plain "tests_exist" "SKIP" "No source files in diff"
  elif [[ $missing -eq 0 ]]; then
    record_result "tests_exist" "PASS" "${checked} source files have tests"
    record_result_plain "tests_exist" "PASS" "${checked} source files have tests"
  else
    record_result "tests_exist" "FAIL" "${missing}/${checked} source files missing tests"
    record_result_plain "tests_exist" "FAIL" "${missing}/${checked} source files missing tests"
  fi
}

check_tests_pass() {
  local dir="$1"
  local test_cmd
  test_cmd=$(detect_test_cmd "$dir")

  if [[ -z "$test_cmd" ]]; then
    record_result "tests_pass" "SKIP" "No test runner detected"
    record_result_plain "tests_pass" "SKIP" "No test runner detected"
    return
  fi

  if (cd "$dir" && eval "$test_cmd" > /dev/null 2>&1); then
    record_result "tests_pass" "PASS" "${test_cmd}"
    record_result_plain "tests_pass" "PASS" "${test_cmd}"
  else
    record_result "tests_pass" "FAIL" "${test_cmd} failed"
    record_result_plain "tests_pass" "FAIL" "${test_cmd} failed"
  fi
}

check_build() {
  local dir="$1"
  local build_cmd
  build_cmd=$(detect_build_cmd "$dir")

  if [[ -z "$build_cmd" ]]; then
    record_result "build" "SKIP" "No build command detected"
    record_result_plain "build" "SKIP" "No build command detected"
    return
  fi

  if (cd "$dir" && eval "$build_cmd" > /dev/null 2>&1); then
    record_result "build" "PASS" "${build_cmd}"
    record_result_plain "build" "PASS" "${build_cmd}"
  else
    record_result "build" "FAIL" "${build_cmd} failed"
    record_result_plain "build" "FAIL" "${build_cmd} failed"
  fi
}

check_lint() {
  local dir="$1"
  local lint_cmd
  lint_cmd=$(detect_lint_cmd "$dir")

  if [[ -z "$lint_cmd" ]]; then
    record_result "lint" "SKIP" "No linter detected"
    record_result_plain "lint" "SKIP" "No linter detected"
    return
  fi

  if (cd "$dir" && eval "$lint_cmd" > /dev/null 2>&1); then
    record_result "lint" "PASS" "${lint_cmd}"
    record_result_plain "lint" "PASS" "${lint_cmd}"
  else
    record_result "lint" "FAIL" "${lint_cmd} failed"
    record_result_plain "lint" "FAIL" "${lint_cmd} failed"
  fi
}

check_no_debug_output() {
  local dir="$1" modified_files="$2"
  local debug_pattern
  debug_pattern=$(detect_debug_pattern "$dir")

  if [[ -z "$modified_files" ]]; then
    record_result "no_debug_output" "SKIP" "No modified files"
    record_result_plain "no_debug_output" "SKIP" "No modified files"
    return
  fi

  local found=0
  while IFS= read -r file; do
    [[ -z "$file" ]] && continue
    [[ ! -f "${dir}/${file}" ]] && continue
    # Skip test files and configs
    if echo "$file" | grep -qE '(\.test\.|\.spec\.|__tests__|test_|_test\.|\.config\.|\.md$|\.json$)'; then
      continue
    fi
    if grep -qE "$debug_pattern" "${dir}/${file}" 2>/dev/null; then
      found=$((found + 1))
    fi
  done <<< "$modified_files"

  if [[ $found -eq 0 ]]; then
    record_result "no_debug_output" "PASS" "No debug statements in modified files"
    record_result_plain "no_debug_output" "PASS" "No debug statements in modified files"
  else
    record_result "no_debug_output" "FAIL" "${found} files contain debug statements"
    record_result_plain "no_debug_output" "FAIL" "${found} files contain debug statements"
  fi
}

check_no_todo_fixme() {
  local dir="$1" modified_files="$2"

  if [[ -z "$modified_files" ]]; then
    record_result "no_todo_fixme" "SKIP" "No modified files"
    record_result_plain "no_todo_fixme" "SKIP" "No modified files"
    return
  fi

  local found=0
  while IFS= read -r file; do
    [[ -z "$file" ]] && continue
    [[ ! -f "${dir}/${file}" ]] && continue
    if grep -qiE '(TODO|FIXME|HACK|XXX)' "${dir}/${file}" 2>/dev/null; then
      found=$((found + 1))
    fi
  done <<< "$modified_files"

  if [[ $found -eq 0 ]]; then
    record_result "no_todo_fixme" "PASS" "No TODO/FIXME in modified files"
    record_result_plain "no_todo_fixme" "PASS" "No TODO/FIXME in modified files"
  else
    record_result "no_todo_fixme" "FAIL" "${found} files contain TODO/FIXME"
    record_result_plain "no_todo_fixme" "FAIL" "${found} files contain TODO/FIXME"
  fi
}

check_exports_have_docs() {
  local dir="$1" modified_files="$2"
  local export_pattern doc_pattern
  export_pattern=$(detect_export_pattern "$dir")
  doc_pattern=$(detect_doc_comment_pattern "$dir")

  if [[ -z "$modified_files" ]]; then
    record_result "exports_have_docs" "SKIP" "No modified files"
    record_result_plain "exports_have_docs" "SKIP" "No modified files"
    return
  fi

  local missing=0
  local total=0
  while IFS= read -r file; do
    [[ -z "$file" ]] && continue
    [[ ! -f "${dir}/${file}" ]] && continue
    # Skip test files and configs
    if echo "$file" | grep -qE '(\.test\.|\.spec\.|__tests__|test_|_test\.|\.config\.|\.md$|\.json$)'; then
      continue
    fi
    if ! echo "$file" | grep -qE "\.(ts|tsx|js|jsx|py|rs|go)$"; then
      continue
    fi
    # Count exports without preceding doc comments
    local exports_in_file
    exports_in_file=$(grep -c "$export_pattern" "${dir}/${file}" 2>/dev/null || echo 0)
    if [[ $exports_in_file -gt 0 ]]; then
      total=$((total + exports_in_file))
      local docs_in_file
      docs_in_file=$(grep -c "$doc_pattern" "${dir}/${file}" 2>/dev/null || echo 0)
      if [[ $docs_in_file -lt $exports_in_file ]]; then
        missing=$((missing + (exports_in_file - docs_in_file)))
      fi
    fi
  done <<< "$modified_files"

  if [[ $total -eq 0 ]]; then
    record_result "exports_have_docs" "SKIP" "No exports in modified files"
    record_result_plain "exports_have_docs" "SKIP" "No exports in modified files"
  elif [[ $missing -eq 0 ]]; then
    record_result "exports_have_docs" "PASS" "${total} exports documented"
    record_result_plain "exports_have_docs" "PASS" "${total} exports documented"
  else
    record_result "exports_have_docs" "FAIL" "${missing}/${total} exports missing doc comments"
    record_result_plain "exports_have_docs" "FAIL" "${missing}/${total} exports missing doc comments"
  fi
}

check_no_new_dependencies() {
  local dir="$1" base_branch="${2:-}"
  local dep_file
  dep_file=$(detect_dep_file "$dir")

  if [[ -z "$dep_file" ]]; then
    record_result "no_new_deps" "SKIP" "No dependency file detected"
    record_result_plain "no_new_deps" "SKIP" "No dependency file detected"
    return
  fi

  if [[ -z "$base_branch" ]]; then
    record_result "no_new_deps" "SKIP" "No base branch to compare"
    record_result_plain "no_new_deps" "SKIP" "No base branch to compare"
    return
  fi

  cd "$dir"
  local diff_output
  diff_output=$(git diff "$base_branch"...HEAD -- "$dep_file" 2>/dev/null || echo "")

  if [[ -z "$diff_output" ]]; then
    record_result "no_new_deps" "PASS" "No changes to ${dep_file}"
    record_result_plain "no_new_deps" "PASS" "No changes to ${dep_file}"
  else
    local added
    added=$(echo "$diff_output" | grep -c "^+" | head -1 || echo "0")
    record_result "no_new_deps" "FAIL" "${dep_file} modified — review new dependencies"
    record_result_plain "no_new_deps" "FAIL" "${dep_file} modified — review new dependencies"
  fi
}

check_file_size_limit() {
  local dir="$1" modified_files="$2" max_lines="${3:-500}"

  if [[ -z "$modified_files" ]]; then
    record_result "file_size" "SKIP" "No modified files"
    record_result_plain "file_size" "SKIP" "No modified files"
    return
  fi

  local oversized=0
  local details=""
  while IFS= read -r file; do
    [[ -z "$file" ]] && continue
    [[ ! -f "${dir}/${file}" ]] && continue
    if ! echo "$file" | grep -qE "\.(ts|tsx|js|jsx|py|rs|go|swift|kt|java)$"; then
      continue
    fi
    local lines
    lines=$(wc -l < "${dir}/${file}" | tr -d ' ')
    if [[ $lines -gt $max_lines ]]; then
      oversized=$((oversized + 1))
      details="${details}${file}(${lines}L) "
    fi
  done <<< "$modified_files"

  if [[ $oversized -eq 0 ]]; then
    record_result "file_size" "PASS" "All files under ${max_lines} lines"
    record_result_plain "file_size" "PASS" "All files under ${max_lines} lines"
  else
    record_result "file_size" "FAIL" "${oversized} files over ${max_lines}L: ${details}"
    record_result_plain "file_size" "FAIL" "${oversized} files over ${max_lines}L: ${details}"
  fi
}

# ── Custom check runner ──────────────────────────────────────────────

run_custom_check() {
  local dir="$1" id="$2" cmd="$3" description="${4:-Custom check}"

  if (cd "$dir" && eval "$cmd" > /dev/null 2>&1); then
    record_result "$id" "PASS" "$description"
    record_result_plain "$id" "PASS" "$description"
  else
    record_result "$id" "FAIL" "$description"
    record_result_plain "$id" "FAIL" "$description"
  fi
}

run_custom_grep_check() {
  local dir="$1" id="$2" pattern="$3" glob="$4" should_find="${5:-false}"

  local count
  count=$(find "$dir" -name "$glob" -not -path '*/node_modules/*' -not -path '*/.git/*' -exec grep -l "$pattern" {} \; 2>/dev/null | wc -l | tr -d ' ')

  if [[ "$should_find" == "true" ]]; then
    if [[ $count -gt 0 ]]; then
      record_result "$id" "PASS" "Pattern found in ${count} files"
      record_result_plain "$id" "PASS" "Pattern found in ${count} files"
    else
      record_result "$id" "FAIL" "Expected pattern not found"
      record_result_plain "$id" "FAIL" "Expected pattern not found"
    fi
  else
    if [[ $count -eq 0 ]]; then
      record_result "$id" "PASS" "Pattern not found (good)"
      record_result_plain "$id" "PASS" "Pattern not found (good)"
    else
      record_result "$id" "FAIL" "Unwanted pattern in ${count} files"
      record_result_plain "$id" "FAIL" "Unwanted pattern in ${count} files"
    fi
  fi
}
