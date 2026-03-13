#!/bin/bash

# V-Bounce Engine: Hotfix Manager
# Handles edge cases for L1 Trivial tasks to save tokens and ensure framework integrity.

set -euo pipefail

# Ensure we're in a git repository
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || {
    echo "❌ Error: Not inside a git repository."
    exit 1
}

COMMAND="${1:-}"

function show_help {
    echo "V-Bounce Engine — Hotfix Manager"
    echo ""
    echo "Usage: ./scripts/hotfix_manager.sh <command> [args]"
    echo ""
    echo "Commands:"
    echo "  audit               Run a lightweight static analysis on recent commits to detect architectural drift."
    echo "  sync                Rebase all active git worktrees against the current sprint branch."
    echo "  ledger <title> <desc>  Append a Hotfix entry to §8 Applied Hotfixes in the active DELIVERY_PLAN.md."
    echo ""
    echo "Examples:"
    echo "  ./scripts/hotfix_manager.sh audit"
    echo "  ./scripts/hotfix_manager.sh sync"
    echo "  ./scripts/hotfix_manager.sh ledger \"Fix Header\" \"Aligned the logo to the left\""
    exit 1
}

if [ -z "$COMMAND" ]; then
    show_help
fi

case "$COMMAND" in
    audit)
        echo "🔍 Running Token-Saving Hotfix Audit..."

        # Determine how many commits exist on the branch so we don't overshoot
        TOTAL_COMMITS=$(git rev-list --count HEAD 2>/dev/null || echo "0")
        LOOKBACK=5
        if [ "$TOTAL_COMMITS" -lt "$LOOKBACK" ]; then
            LOOKBACK="$TOTAL_COMMITS"
        fi

        if [ "$LOOKBACK" -eq 0 ]; then
            echo "✅ No commits to audit."
            exit 0
        fi

        SUSPICIOUS=$(git diff "HEAD~${LOOKBACK}" HEAD -G'style=|console\.log|// TODO' --name-only 2>/dev/null || true)

        if [ -n "$SUSPICIOUS" ]; then
            echo "⚠️  WARNING: Potential architectural drift detected in recent commits."
            echo "The following files contain inline styles, console.logs, or TODOs:"
            echo "$SUSPICIOUS"
            echo ""
            echo "Action Required: The Architect agent MUST perform a Deep Audit on these files."
            exit 1
        else
            echo "✅ No obvious architectural drift detected in recent commits."
            exit 0
        fi
        ;;

    sync)
        echo "🔄 Syncing active worktrees with the latest changes..."

        WORKTREE_DIR="${REPO_ROOT}/.worktrees"

        if [ ! -d "$WORKTREE_DIR" ]; then
            echo "✅ No active worktrees found at ${WORKTREE_DIR}. Nothing to sync."
            exit 0
        fi

        CURRENT_BRANCH=$(git branch --show-current)

        if [ -z "$CURRENT_BRANCH" ]; then
            echo "❌ Error: Detached HEAD state. Cannot determine sprint branch for sync."
            exit 1
        fi

        SYNC_COUNT=0
        FAIL_COUNT=0

        for dir in "${WORKTREE_DIR}"/*/; do
            if [ -d "$dir" ]; then
                WORKTREE_NAME=$(basename "$dir")
                echo "Syncing worktree: $WORKTREE_NAME..."

                if (cd "$dir" && git fetch origin && git rebase "origin/$CURRENT_BRANCH"); then
                    echo "  ✅ Successfully synced $WORKTREE_NAME."
                    SYNC_COUNT=$((SYNC_COUNT + 1))
                else
                    echo "  ❌ Failed to sync $WORKTREE_NAME. Manual intervention required."
                    FAIL_COUNT=$((FAIL_COUNT + 1))
                fi
            fi
        done

        echo ""
        echo "Sync complete: $SYNC_COUNT succeeded, $FAIL_COUNT failed."
        [ "$FAIL_COUNT" -gt 0 ] && exit 1 || exit 0
        ;;

    ledger)
        TITLE="${2:-}"
        DESC="${3:-}"

        if [ -z "$TITLE" ] || [ -z "$DESC" ]; then
            echo "❌ Error: Missing title or description for the ledger."
            echo "Usage: ./scripts/hotfix_manager.sh ledger \"Fix Header\" \"Aligned the logo to the left\""
            exit 1
        fi

        # Find the active delivery plan (search from repo root)
        DELIVERY_PLAN=$(find "${REPO_ROOT}/product_plans" -name "DELIVERY_PLAN.md" 2>/dev/null | head -n 1)

        if [ -z "$DELIVERY_PLAN" ]; then
            echo "❌ Error: No DELIVERY_PLAN.md found in product_plans/."
            exit 1
        fi

        echo "📝 Updating Hotfix Ledger in $DELIVERY_PLAN..."

        # Check if §8 Applied Hotfixes exists, if not, create it
        if ! grep -q "## 8. Applied Hotfixes" "$DELIVERY_PLAN"; then
            echo "" >> "$DELIVERY_PLAN"
            echo "---" >> "$DELIVERY_PLAN"
            echo "" >> "$DELIVERY_PLAN"
            echo "## 8. Applied Hotfixes" >> "$DELIVERY_PLAN"
            echo "" >> "$DELIVERY_PLAN"
            echo "> L1 Trivial fixes that bypassed the Epic/Story hierarchy. Auto-appended by \`hotfix_manager.sh ledger\`." >> "$DELIVERY_PLAN"
            echo "" >> "$DELIVERY_PLAN"
            echo "| Date | Title | Brief Description |" >> "$DELIVERY_PLAN"
            echo "|------|-------|-------------------|" >> "$DELIVERY_PLAN"
        fi

        # Append the new row
        DATE=$(date "+%Y-%m-%d")
        echo "| $DATE | $TITLE | $DESC |" >> "$DELIVERY_PLAN"

        echo "✅ Ledger updated: \"$TITLE\" added to §8 Applied Hotfixes."
        ;;

    --help|-h|help)
        show_help
        ;;

    *)
        echo "❌ Unknown command: $COMMAND"
        echo ""
        show_help
        ;;
esac
