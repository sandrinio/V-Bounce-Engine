---
name: agent-team
description: "Use when you need to delegate implementation tasks to specialized agents (Developer, QA, Architect, DevOps, Scribe) as the Team Lead. Activates when orchestrating the Bounce phase — delegating stories, monitoring reports, merging completed work, consolidating sprint results, and generating product documentation. Uses git worktrees for story isolation. Works with Claude Code subagents natively; file-based handoffs for other tools."
---

# Agent Team Orchestration

## Overview

This skill defines how the Team Lead delegates work to specialized agents during Phase 2: The Bounce. Each story is isolated in a **git worktree** to prevent cross-contamination. Agents communicate exclusively through structured report files.

**Core principle:** The Team Lead plans and coordinates. It never writes implementation code itself.

## When to Use

- When executing the Bounce phase of a sprint.
- When delegating stories to Developer, QA, Architect, or DevOps agents.
- When consolidating agent reports into a Sprint Report.
- When a story needs to be bounced between agents.
- When merging completed stories or releasing sprints (delegate to DevOps).
- When generating or updating product documentation (delegate to Scribe).

## Agent Roster

| Agent | Config File | Role | Tools | Skills |
|-------|------------|------|-------|--------|
| Developer | `.claude/agents/developer.md` | Feature implementation and debugging | Read, Edit, Write, Bash, Glob, Grep | react-best-practices, lesson |
| QA | `.claude/agents/qa.md` | Adversarial testing and validation | Read, Bash, Glob, Grep | vibe-code-review (Quick Scan, PR Review), lesson |
| Architect | `.claude/agents/architect.md` | Structural integrity and standards | Read, Glob, Grep, Bash | vibe-code-review (Deep Audit, Trend Check), lesson |
| DevOps | `.claude/agents/devops.md` | Git operations, merges, deploys, infra | Read, Edit, Write, Bash, Glob, Grep | lesson |
| Scribe | `.claude/agents/scribe.md` | Product documentation generation | Read, Write, Bash, Glob, Grep | lesson |

---

## Git Worktree Strategy

Every story gets its own worktree. This isolates code changes so a failed fix on Story 01 never contaminates Story 02.

### Branch Model

```
main                                    ← production
└── sprint/S-01                         ← sprint branch (cut from main)
    ├── story/STORY-001-01-login        ← story branch (worktree)
    ├── story/STORY-001-02-auth         ← story branch (worktree)
    └── story/STORY-001-03-api          ← story branch (worktree)
```

### Directory Layout

```
repo/                                   ← main working directory
├── .worktrees/                         ← worktree root (GITIGNORED)
│   ├── STORY-001-01-login/             ← isolated worktree for story
│   │   ├── (full codebase checkout)
│   │   └── .bounce/                    ← reports live here during bounce
│   │       ├── tasks/
│   │       └── reports/
│   └── STORY-001-02-auth/
│       └── ...
│
└── .bounce/
    ├── reports/                        ← active working reports (GITIGNORED)
    ├── sprint-report.md                ← current sprint report (GITIGNORED)
    └── archive/                        ← completed sprint history (COMMITTED TO GIT)
        └── S-01/
            ├── STORY-001-01/           ← all agent reports for this story
            ├── sprint-report.md        ← final sprint report
            └── sprint-devops.md        ← release report
```

### V-Bounce State → Git Operations

| V-Bounce State | Git Operation |
|---------------|---------------|
| Sprint starts | `git checkout -b sprint/S-01 main` |
| Ready to Bounce | `git worktree add .worktrees/STORY-{ID}-{StoryName} -b story/STORY-{ID}-{StoryName} sprint/S-01` |
| Bouncing | All work happens inside `.worktrees/STORY-{ID}-{StoryName}/` |
| Done | Merge story branch → sprint branch, `git worktree remove` |
| Sprint Review → Done | Merge sprint branch → main |
| Escalated | Worktree kept but frozen (no new commits) |
| Parking Lot | Worktree removed, branch preserved unmerged |

### Worktree Commands

```bash
# Sprint initialization
git checkout -b sprint/S-01 main

# Create worktree for a story
git worktree add .worktrees/STORY-001-01-login -b story/STORY-001-01-login sprint/S-01
mkdir -p .worktrees/STORY-001-01-login/.bounce/{tasks,reports}

# List active worktrees
git worktree list

# Merge completed story into sprint branch
git checkout sprint/S-01
git merge story/STORY-001-01-login --no-ff -m "Merge STORY-001-01: {Story Name}"

# Remove worktree after merge
git worktree remove .worktrees/STORY-001-01-login
git branch -d story/STORY-001-01-login

# Merge sprint into main
git checkout main
git merge sprint/S-01 --no-ff -m "Sprint S-01: {Sprint Goal}"
```

---

## Orchestration Patterns

### Pattern 1: Claude Code Subagents (Primary)

The Team Lead spawns agents using Claude Code's Task tool. Each subagent works inside the story's worktree.

**Critical:** Always set the working directory to the worktree when delegating:
```
Lead: "Use the developer subagent. Working directory: .worktrees/STORY-001-01-login/
       Read the story spec at product_plans/sprints/sprint-{XX}/STORY-001-01-login.md
       and implement it.
       Write the implementation report to .bounce/reports/STORY-001-01-login-dev.md"
```

**Parallel delegation (independent stories in separate worktrees):**
```
Lead: "Use the developer subagent in .worktrees/STORY-001-01-login/"
      AND "Use the developer subagent in .worktrees/STORY-001-02-auth/"
      (safe — each worktree is fully isolated)
```

**Background delegation:**
Press Ctrl+B for long-running agent tasks. Background agents auto-deny unknown permissions.

### Pattern 2: Agent Teams (Experimental)

For sustained parallel coordination with inter-agent messaging. Enable with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. Each teammate works in a dedicated worktree.

### Pattern 3: File-Based Handoffs (Cross-Tool Fallback)

For tools without native subagent support (Cursor, Codex, Gemini, Antigravity):

1. Lead writes a task file to `.worktrees/STORY-{ID}-{StoryName}/.bounce/tasks/STORY-{ID}-{StoryName}-{agent}.md`
2. Open the worktree directory in the target tool (Cursor, Antigravity, etc.)
3. Agent reads the task file, executes, writes report to `.bounce/reports/`
4. Lead monitors reports from the main repo

---

## The Report Buffer (Hybrid Model)

**During bounce:** Reports live INSIDE the story's worktree at `.worktrees/STORY-{ID}-{StoryName}/.bounce/reports/`. This keeps reports co-located with the code they describe.

**After story completes:** Reports are archived to the shared `.bounce/archive/S-{XX}/STORY-{ID}-{StoryName}/` in the main repo before the worktree is removed.

**Sprint Report:** Always written to `.bounce/sprint-report.md` in the main repo (not in any worktree).

### Report File Naming

`STORY-{EpicID}-{StoryID}-{agent}[-bounce{N}].md`

Examples:
- `STORY-001-01-login-dev.md` — first Dev report
- `STORY-001-01-login-qa-bounce1.md` — first QA report (found bugs)
- `STORY-001-01-login-dev-bounce2.md` — Dev's fix after QA bounce
- `STORY-001-01-login-qa-bounce2.md` — second QA report (passed)
- `STORY-001-01-login-arch.md` — Architect audit
- `STORY-001-01-login-devops.md` — DevOps merge report
- `STORY-001-01-login-conflict.md` — Spec conflict (if any)
- `sprint-S-01-devops.md` — Sprint release report
- `sprint-S-01-scribe.md` — Documentation generation report

---

## The Bounce Sequence

### Step 0: Sprint Setup
```
1. Cut sprint branch from main:
   git checkout -b sprint/S-01 main
   mkdir -p .bounce/archive

2. Read RISK_REGISTRY.md — check for open risks relevant to this sprint's stories.
   If high-severity risks affect planned stories, flag to human before proceeding.

3. Read sprint-{XX}.md — check §2 Sprint Open Questions.
   If unresolved questions block stories in this sprint, flag to human.
   Do NOT start bouncing stories with unresolved blocking questions.

4. If vdocs/_manifest.json exists, read it.
   Understand what's already documented — this informs which stories
   may require doc updates after the sprint.

5. Triage Requests: If an incoming task is an L1 Trivial change (1-2 files),
   use the **Hotfix Path**:
   a. Create `HOTFIX-{Date}-{Name}.md` using the template.
   b. Delegate to Developer (no worktree needed if acting on active branch).
   c. Developer runs `hotfix_manager.sh ledger "{Title}" "{Description}"` after implementation.
   d. Human/Lead verifies manually.
   e. DevOps runs `hotfix_manager.sh sync` to update any active story worktrees.
   f. Update Delivery Plan Status to "Done".

6. **Parallel Readiness Check** (before bouncing multiple stories simultaneously):
   - Verify test runner config excludes `.worktrees/` (vitest, jest, pytest, etc.)
   - Verify no shared mutable state between worktrees (e.g., shared temp files, singletons writing to same path)
   - Verify `.gitignore` includes `.worktrees/`
   If any check fails, fix before spawning parallel stories. Intermittent test failures from worktree cross-contamination erode trust in the test suite fast.

7. **Dependency Check & Execution Mode**:
   - For each story, check the `Depends On:` field in its template.
   - If Story B depends on Story A, you MUST execute them sequentially. Do not create Story B's worktree or spawn its Developer until Story A has successfully passed the DevOps merge step.
   - Determine Execution Mode:
     - **Full Bounce (Default)**: Normal L2-L4 stories go through full Dev → QA → Architect → DevOps flow.
     - **Fast Track (L1/L2 Minor)**: For cosmetic UI tweaks or isolated refactors, execute Dev → DevOps only. Skip QA and Architect loops to save overhead. Validate manually during Sprint Review.
     
8. Update sprint-{XX}.md: Status → "Active"
```

### Step 1: Story Initialization
For each story with V-Bounce State "Ready to Bounce":
```bash
# Create isolated worktree
git worktree add .worktrees/STORY-{ID}-{StoryName} -b story/STORY-{ID}-{StoryName} sprint/S-01
mkdir -p .worktrees/STORY-{ID}-{StoryName}/.bounce/{tasks,reports}
```
- Read the full Story spec
- Read LESSONS.md
- Check RISK_REGISTRY.md for risks tagged to this story or its Epic
- If `vdocs/_manifest.json` exists, identify docs relevant to this story's scope (match against manifest descriptions/tags). Include relevant doc references in the task file so the Developer has product context.
- **Adjacent implementation check:** For stories that modify or extend modules touched by earlier stories in this sprint, identify existing implementations the Developer should reuse. Add to the task file: `"Reuse these existing modules: {list with file paths and brief description of what each provides}"`. This prevents agents from independently re-implementing logic that already exists — a common source of duplication when stories run in parallel.
- Create task file in `.worktrees/STORY-{ID}-{StoryName}/.bounce/tasks/`
- Update sprint-{XX}.md: V-Bounce State → "Bouncing"

### Step 2: Developer Pass
```
1. Spawn developer subagent in .worktrees/STORY-{ID}-{StoryName}/ with:
   - Story §1 The Spec + §3 Implementation Guide
   - LESSONS.md
   - Relevant react-best-practices rules
   - Adjacent module references (if any — "reuse src/core/X.ts for Y")
2. Developer writes code and Implementation Report to .bounce/reports/
3. Lead reads report, verifies completeness
```

### Step 3: QA Pass
```
1. Spawn qa subagent in .worktrees/STORY-{ID}-{StoryName}/ with:
   - Developer Implementation Report
   - Story §2 The Truth (acceptance criteria)
   - LESSONS.md
2. QA validates against Gherkin scenarios, runs vibe-code-review
3. If FAIL:
   - QA writes Bug Report (STORY-{ID}-{StoryName}-qa-bounce{N}.md)
   - Increment bounce counter
   - If QA bounce count >= 3 → V-Bounce State → "Escalated", STOP
   - Else → Return to Step 2 with Bug Report as input
4. If PASS:
   - QA writes Validation Report
   - V-Bounce State → "QA Passed"
```

### Step 4: Architect Pass
```
1. Spawn architect subagent in .worktrees/STORY-{ID}-{StoryName}/ with:
   - All reports for this story
   - Full Story spec + Roadmap §3 ADRs
   - LESSONS.md
2. If FAIL:
   - Increment Architect bounce counter
   - If Architect bounce count >= 3 → V-Bounce State → "Escalated", STOP
   - Else → Return to Step 2 with Architect feedback as input
3. If PASS:
   - V-Bounce State → "Architect Passed"

*(Note: If the Team Lead assigned this story to the "Fast Track" execution mode, skip Steps 3 and 4 entirely. The Developer passes directly to Step 5: DevOps Story Merge.)*
```

### Step 5: Story Merge (DevOps)
```
1. Spawn devops subagent with:
   - Story ID and sprint branch name
   - All gate reports (QA PASS + Architect PASS)
   - LESSONS.md
2. DevOps performs:
   - Pre-merge checks (worktree clean, gate reports verified)
   - Archive reports to .bounce/archive/S-{XX}/STORY-{ID}-{StoryName}/
   - Merge story branch into sprint branch (--no-ff)
   - Post-merge validation (tests + build on sprint branch)
   - Worktree removal and story branch cleanup
3. DevOps writes Merge Report to .bounce/archive/S-{XX}/STORY-{ID}-{StoryName}/STORY-{ID}-{StoryName}-devops.md
4. If merge conflicts:
   - Simple (imports, whitespace): DevOps resolves directly
   - Complex (logic): DevOps writes Conflict Report, Lead creates fix story
5. If post-merge tests fail: DevOps reverts merge, reports failure to Lead
```
Update sprint-{XX}.md: V-Bounce State → "Done"

### Step 6: Sprint Integration Audit
After ALL stories are merged into `sprint/S-01`:
```
1. Spawn architect subagent on sprint/S-01 branch
2. First, Architect runs `./scripts/hotfix_manager.sh audit` to check for hotfix drift. If it fails, perform deep audit on flagged files.
3. Run Sprint Integration Audit — Deep Audit on combined changes
4. Check for: duplicate routes, competing state, overlapping migrations
5. If issues found → create new stories to fix, bounce individually
```

### Step 7: Sprint Consolidation
```
1. Read all archived reports in .bounce/archive/S-{XX}/
2. **Sum the `tokens_used` field** from every agent report to calculate the sprint's total resource cost.
3. Generate Sprint Report to .bounce/sprint-report.md:
   - Ensure the Sprint Report starts with a YAML frontmatter block containing:
     ```yaml
     ---
     total_tokens_used: {sum of all agent tokens}
     ---
     ```
4. V-Bounce State → "Sprint Review" for all stories
4. Present Sprint Report to human
5. **BLOCKING STEP — Lesson Approval:**
   Review and approve/reject ALL flagged lessons from §4 of the Sprint Report.
   Do NOT proceed to Sprint Release until every lesson has a status of "Yes" or "No".
   Stale lessons lose context — approve them while the sprint is fresh.
   Present each lesson to the human and record approved ones to LESSONS.md immediately.
6. After approval → Spawn devops subagent for Sprint Release:
   - Merge sprint/S-01 → main (--no-ff)
   - Tag release: v{VERSION}
   - Run full test suite + build + lint on main
   - Sprint branch cleanup
   - Environment verification (if applicable)
   - DevOps writes Sprint Release Report to .bounce/archive/S-{XX}/sprint-devops.md
6. Lead finalizes:
   - Move sprint-report.md to .bounce/archive/S-{XX}/
   - Record lessons (with user approval)
   - Update delivery_plan.md to reflect the completed sprint.
7. **Framework Self-Assessment** (aggregated from agent reports):
   - Collect all `## Process Feedback` sections from agent reports in `.bounce/archive/S-{XX}/`
   - Populate §5 Framework Self-Assessment tables in the Sprint Report by category
   - If this is the 2nd or 3rd consecutive sprint, or if any Blocker-severity findings exist:
     - Offer to run the `improve` skill to propose framework changes
     - If user approves → read `skills/improve/SKILL.md` and execute the improvement process
8. Product Documentation check (runs on `main` after sprint merge):
   - If sprint delivered 3+ features, or if any Developer report flagged
     stale product docs → offer to run vdoc to generate/update
     vdocs/
   - If user approves → spawn scribe subagent on `main` branch with:
     - Sprint Report (what was built)
     - Dev reports that flagged affected product docs
     - Current _manifest.json (if exists)
     - Mode: "audit" (if docs exist) or "init" (if first time)
   - Scribe generates/updates docs and writes Scribe Report
   - Documentation is post-implementation — it reflects what was built
   - Scribe commits documentation as a follow-up commit on `main`
```

---

## Cleanup Process

### After Each Story Completes (DevOps handles via Step 5)
1. Archive reports to `.bounce/archive/S-{XX}/STORY-{ID}-{StoryName}/`
2. Merge story branch into sprint branch (--no-ff)
3. Validate tests/build on sprint branch
4. Remove worktree: `git worktree remove .worktrees/STORY-{ID}-{StoryName}`
5. Delete story branch: `git branch -d story/STORY-{ID}-{StoryName}`
6. Write DevOps Merge Report

### After Sprint Completes (DevOps handles via Step 7)
1. Merge sprint branch into main (--no-ff)
2. Tag release: `git tag -a v{VERSION}`
3. Run full validation (tests + build + lint)
4. Delete sprint branch: `git branch -d sprint/S-{XX}`
5. Verify `.worktrees/` is empty (all worktrees removed)
6. Write Sprint Release Report
7. Lead archives the sprint folder to `archive/` according to doc-manager physical move rules.

### After Delivery Completes (Team Lead handles)
When ALL sprints in a delivery (release) are done:
1. Verify all stories in the delivery are "Done" in the Delivery Plan
2. Move the entire delivery folder to archive:
   ```bash
   mv product_plans/D-{NN}_{release_name}/ product_plans/archive/D-{NN}_{release_name}/
   ```
3. Add a **Delivery Log** entry to the Roadmap (§7):
   - Delivery ID, date, release tag
   - Release Notes — summarize all sprint reports from this delivery
   - Key metrics (stories delivered, bounce ratio, correction tax averages)
4. Update Roadmap §2 Release Plan: set the release status to "Delivered"

### Retention
- `.bounce/archive/` is **committed to git** — full sprint history, all agent reports, audit trail
- `.bounce/reports/` and `.bounce/sprint-report.md` are **gitignored** — active working files only
- `product_plans/archive/` retains completed deliveries with all their epics, stories, and delivery plans
- `.worktrees/` is **gitignored** — ephemeral, exists only during active bouncing
- Story branches are deleted after merge
- Sprint branches are deleted after merge to main

---

## Sprint Plan Sync

The Team Lead MUST update the active `sprint-{XX}.md` at every state transition. This is the source of truth for execution.

| Action | Sprint Plan Update |
|--------|---------------------|
| Worktree created | §1 Active Scope: V-Bounce State → "Bouncing" |
| Dev report written | No update (still "Bouncing") |
| QA passes | §1 Active Scope: V-Bounce State → "QA Passed" |
| Architect passes | §1 Active Scope: V-Bounce State → "Architect Passed" |
| DevOps merges story | §1 Active Scope: V-Bounce State → "Done" |
| Escalated | §1 Escalated table |
| DevOps merges sprint | Update `delivery_plan.md` to flag sprint delivered |

---

## Edge Case Handling

### Spec Conflict
Developer writes a Spec Conflict Report. Lead pauses the bounce:
- Remove worktree (preserve branch for reference)
- Return story to Refinement in sprint-{XX}.md and copy it back to backlog/
- After spec is fixed, recreate worktree and restart bounce

### Escalated Stories
When QA bounce count >= 3 OR Architect bounce count >= 3:
- Worktree is kept but frozen (no new work)
- Lead writes Escalation Report to `.bounce/archive/S-{XX}/STORY-{ID}-{StoryName}/escalation.md`
- Human decides: rewrite spec → Refinement, descope → split, kill → Parking Lot
- **If returned to Refinement:** The spec has been rewritten. You MUST reset the QA and Architect bounce counters to 0 for this story.
- If killed: `git worktree remove`, branch preserved unmerged

### Mid-Sprint Strategic Changes
Charter and Roadmap are typically **frozen** during active sprints. However, if an emergency requires modifying them:
1. You MUST pause active bouncing across all stories.
2. Delegate to doc-manager to run the **Sprint Impact Analysis Protocol**.
3. Evaluate the active stories in `sprint-{XX}.md` against the new strategy to determine if they are: Unaffected, Require Scope Adjustment, or Invalidated.
4. Only abort stories that are explicitly Invalidated by the human. Unaffected stories may resume bouncing.

### Merge Conflicts
If merging story branch into sprint branch creates conflicts:
- DevOps resolves simple conflicts (import ordering, adjacent edits, whitespace)
- Complex conflicts (logic changes, competing implementations): DevOps writes a Merge Conflict Report, Lead creates a new story to resolve through the normal bounce flow

---

## Critical Rules

- **The Lead never writes code.** It plans, delegates, monitors, and consolidates.
- **Enforce Sequential Dependencies.** Never parallelize stories where one depends on the other. Wait for merge.
- **One story = one worktree.** Never mix stories in a single worktree.
- **Reports are the only handoff.** No agent communicates with another directly.
- **One bounce = one report.** Every agent pass produces exactly one report file.
- **Archive before remove.** Always copy reports to shared archive before removing a worktree.
- **Sync the Delivery Plan.** Update V-Bounce state at EVERY transition. The Delivery Plan is the source of truth.
- **Track bounce counts.** QA and Architect bounces are tracked separately per story.
- **Git tracking rules.** `.worktrees/`, `.bounce/reports/`, and `.bounce/sprint-report.md` are gitignored (ephemeral). `.bounce/archive/` is **committed to git** (permanent audit trail).
- **Check risks before bouncing.** Read RISK_REGISTRY.md at sprint start. Flag high-severity risks that affect planned stories.
- **Resolve open questions first.** Read the active `sprint-{XX}.md` §2 Sprint Open Questions at sprint start. Do not bounce stories with unresolved blocking questions.
- **Know what's documented.** If `vdocs/_manifest.json` exists, read it at sprint start. Pass relevant doc references to agents. Offer documentation updates after sprints that deliver new features.

## Keywords

delegate, orchestrate, subagent, agent team, bounce, sprint, report, worktree, git, isolation, merge, branch, cleanup, archive, delivery plan
