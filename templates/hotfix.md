<instructions>
FOLLOW THIS EXACT STRUCTURE. This is a lightweight alternative to the Epic/Story hierarchy for L1 (Trivial) tasks.

1. **Metadata Table**: Target Release, Status, Actor
2. **§1 The Fix**: What is broken/changing and why
3. **§2 Implementation Instructions**: Which file(s) to change and what to do
4. **§3 Verification**: Simple manual test

Output location: `product_plans/{delivery}/HOTFIX-{Date}-{Name}.md`

Document Hierarchy Position: BYPASS
This document bypasses the Roadmap → Epic → Story hierarchy. It is for L1 (Trivial) changes only (e.g., typos, CSS tweaks, single-line logic fixes).

Constraints:
- Must touch 1-2 files maximum.
- Must NOT introduce new architectural patterns.
- Must NOT require complex new testing infrastructure.
- If it violates these constraints, the Team Lead MUST escalate it to an Epic.

Do NOT output these instructions.
</instructions>

# HOTFIX: {Name}

## Metadata

| Field | Value |
|-------|-------|
| **Target Release** | `D-{NN}_{release_name}` |
| **Status** | Draft / Bouncing / Done |
| **Actor** | {Persona Name / User} |
| **Complexity Label** | L1 (Trivial) |

---

## 1. The Fix
> What needs to be changed and why.

- **Current Behavior**: {What is wrong}
- **Desired Behavior**: {What it should be}

---

## 2. Implementation Instructions
> Direct commands for the Developer Agent.

- **Files to Modify**: `{filepath}`
- **Instructions**: {e.g., "Change the padding-left from 10px to 20px" or "Fix the typo in the error message."}

> **CONSTRAINT**: If this fix requires modifying more than 2 files, STOP immediately and escalate to the Team Lead. The task must be promoted to an Epic/Story.

---

## 3. Verification
> How the Human or QA agent will quickly verify this.

- [ ] {Simple step, e.g., "Open the settings modal and verify the button is aligned."}
- [ ] Automated tests still pass (`npm test`).
- [ ] **Framework Integrity**: If `brains/` or `skills/` were modified, log to `brains/CHANGELOG.md` and run `./scripts/pre_bounce_sync.sh`.
- [ ] **Post-Fix Action**: Run `./scripts/hotfix_manager.sh ledger "HOTFIX: {Name}" "{Brief Fix Description}"`
