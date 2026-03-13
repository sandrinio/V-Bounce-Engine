# Hotfix Workflow: Edge Cases & Mitigations

This document outlines the critical edge cases, failure modes, and required mitigations for the **V-Bounce Engine Hotfix (L1 Trivial)** workflow.

---

## 1. Scope Creep (The "Just one more file" Fallacy)

*   **The Edge Case**: A request triaged as a Hotfix (e.g., "Fix button color") turns out to be more complex (e.g., the component is shared across 5 views, requires updating global CSS variables, and affects existing tests).
*   **The Mitigation**: 
    *   **Mitigation — Developer Hard-Stop**: The Developer agent must stop if a fix requires touching >2 files or introduces new logic patterns.
*   **Mitigation — Escalation to Human**: The Team Lead must escalate the issue back to the Human, providing suggestions and recommendations on how to proceed (e.g., converting to a standard Epic/Story).

## 2. The "Silent Regression" (Bypassing QA)

*   **The Edge Case**: Bypassing the QA and Architect agents allows a "quick fix" to inadvertently break a downstream component that a human might miss during manual verification.
*   **The Mitigation**:
    *   **Mitigation — Automated Validation**: Mandate in `hotfix.md` that the Developer must run localized tests (`npm test`) before submission.
*   **Mitigation — Manual Human Testing**: Because the hotfix bypasses the QA agent, the Human MUST test the fix manually. This includes verifying surrounding features and the overall context, not just the isolated fix.

## 3. Architectural Drift (The "Death by a Thousand Papercuts")

*   **The Edge Case**: A series of un-audited hotfixes introduces minor anti-patterns (e.g., inline styles instead of Tailwind classes), degrading codebase integrity over time.
*   **The Mitigation**:
    *   **Mitigation — Scripted Trend Check (`hotfix-manager audit`)**: To save tokens, an automated bash script runs static analysis (grepping for inline styles, `console.log`, and bypasses) on Hotfix commits before Sprint Integration, raising flags only if anti-patterns are detected.

## 4. Merge Conflicts with Active Worktrees

*   **The Edge Case**: A hotfix merged directly to the `sprint` branch causes a collision when other agents try to merge their isolated `.worktrees/`.
*   **The Mitigation**:
    *   **Mitigation — Scripted Worktree Sync (`hotfix-manager sync`)**: After a Hotfix merge, a script safely detects all active `.worktrees/` and runs a `git pull --rebase` to ensure parallel agents are building on the latest code.

## 5. Invisible Deliverables (The Ghost Fix)

*   **The Edge Case**: Hotfixes bypass the `DELIVERY_PLAN.md`, so they are excluded from the Sprint Report and user-facing documentation.
*   **The Mitigation**:
    *   **Mitigation — Scripted Ledger (`hotfix-manager ledger`)**: An automated script appends a new row (Title and Brief Description) to the **"§8 Applied Hotfixes"** table in the `DELIVERY_PLAN.md` specifically for Scribe integration.
