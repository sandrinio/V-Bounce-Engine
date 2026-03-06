---
name: improve
description: "Use when the V-Bounce OS framework needs to evolve based on accumulated agent feedback. Activates after sprint retros, when recurring friction patterns emerge, or when the user explicitly asks to improve the framework. Reads Process Feedback from sprint reports, identifies patterns, proposes specific changes to templates, skills, brain files, scripts, and agent configs, and applies approved changes. This is the system's self-improvement loop."
---

# Framework Self-Improvement

## Purpose

V-Bounce OS is not static. Every sprint generates friction signals from agents who work within the framework daily. This skill closes the feedback loop: it reads what agents struggled with, identifies patterns, and proposes targeted improvements to the framework itself.

**Core principle:** No framework change happens without human approval. The system suggests — the human decides.

## When to Use

- After every 2-3 sprints (recommended cadence)
- When the same Process Feedback appears across multiple sprint reports
- When the user explicitly asks to improve templates, skills, or process
- When a sprint's Framework Self-Assessment reveals Blocker-severity findings
- When LESSONS.md contains 3+ entries pointing to the same process gap

## Trigger

`/improve` OR when the Team Lead identifies recurring framework friction during Sprint Consolidation.

## Announcement

When using this skill, state: "Using improve skill to evaluate and propose framework changes."

## Input Sources

The improve skill reads from multiple signals, in priority order:

### 1. Sprint Report §5 — Framework Self-Assessment (Primary)
The structured retro tables are the richest source. Each row has:
- Finding (what went wrong)
- Source Agent (who experienced it)
- Severity (Friction vs Blocker)
- Suggested Fix (agent's proposal)

### 2. LESSONS.md — Recurring Patterns
Lessons that point to *process* problems rather than *code* problems:
- "Always check X before Y" → the template should enforce this ordering
- "Agent kept missing Z" → the handoff report is missing a field
- Lessons that keep getting re-flagged sprint after sprint

### 3. Sprint Execution Metrics
Quantitative signals from Sprint Report §3:
- High bounce ratios → story templates may need better acceptance criteria guidance
- High correction tax → handoffs may be losing critical context
- Escalation patterns → complexity labels may need recalibration

### 4. Agent Process Feedback (Raw)
If sprint reports aren't available, read individual agent reports from `.bounce/archive/` and extract `## Process Feedback` sections directly.

## The Improvement Process

### Step 1: Gather Signals
```
1. Read the last 2-3 Sprint Reports (§5 Framework Self-Assessment)
2. Read LESSONS.md — filter for process-related entries
3. Read Sprint Execution Metrics — flag anomalies
4. If no sprint reports exist yet, read raw agent reports from .bounce/archive/
```

### Step 2: Pattern Detection
Group findings by framework area:

| Area | What to Look For | Files Affected |
|------|-----------------|----------------|
| **Templates** | Missing fields, unused sections, ambiguous instructions | `templates/*.md` |
| **Agent Handoffs** | Missing report fields, redundant data, unclear formats | `brains/claude-agents/*.md` |
| **RAG Pipeline** | Irrelevant results, missing context, stale embeddings | `scripts/vbounce_index.mjs`, `scripts/vbounce_ask.mjs`, `scripts/pre_bounce_sync.sh` |
| **Skills** | Unclear instructions, missing steps, outdated references | `skills/*/SKILL.md`, `skills/*/references/*` |
| **Process Flow** | Unnecessary steps, wrong ordering, missing gates | `skills/agent-team/SKILL.md`, `skills/doc-manager/SKILL.md` |
| **Tooling** | Script failures, validation gaps, missing automation | `scripts/*`, `bin/*` |
| **Brain Files** | Stale rules, missing rules, inconsistencies across brains | `brains/CLAUDE.md`, `brains/GEMINI.md`, `brains/AGENTS.md`, `brains/cursor-rules/*.mdc` |

Deduplicate: if 3 agents report the same issue, that's 1 finding with 3 votes — not 3 findings.

### Step 3: Prioritize
Rank findings by impact:

1. **Blockers reported by 2+ agents** — fix immediately
2. **Friction reported by 2+ agents** — fix in this improvement pass
3. **Blockers reported once** — fix if the root cause is clear
4. **Friction reported once** — note for next improvement pass (may be a one-off)

### Step 4: Propose Changes
For each finding, write a concrete proposal:

```markdown
### Proposal {N}: {Short title}

**Finding:** {What went wrong — from the retro}
**Pattern:** {How many times / sprints this appeared}
**Root Cause:** {Why the framework allowed this to happen}
**Affected Files:**
- `{file_path}` — {what changes}

**Proposed Change:**
{Describe the specific edit. Include before/after for template changes.
For skill changes, describe the new instruction or step.
For script changes, describe the new behavior.}

**Risk:** {Low / Medium — what could break if this change is wrong}
**Reversibility:** {Easy — revert the edit / Medium — downstream docs may need updating}
```

### Step 5: Present to Human
Present ALL proposals as a numbered list. The human can:
- **Approve** — apply the change
- **Reject** — skip it (optionally explain why)
- **Modify** — adjust the proposal before applying
- **Defer** — save for the next improvement pass

**Never apply changes without explicit approval.** The human owns the framework.

### Step 6: Apply Approved Changes
For each approved proposal:
1. Edit the affected file(s)
2. If brain files are affected, ensure ALL brain surfaces stay in sync (CLAUDE.md, GEMINI.md, AGENTS.md, cursor-rules/)
3. Log the change in `brains/CHANGELOG.md`
4. If skills were modified, update skill descriptions in all brain files that reference them

### Step 7: Validate
After all changes are applied:
1. Run `./scripts/pre_bounce_sync.sh` to update RAG embeddings with the new framework content
2. Verify no cross-references are broken (template paths, skill names, report field names)
3. Confirm brain file consistency — all 4 surfaces should describe the same process

## Improvement Scope

### What CAN Be Improved

| Target | Examples |
|--------|---------|
| **Templates** | Add/remove/rename sections, improve instructions, add examples, fix ambiguity |
| **Agent Report Formats** | Add/remove YAML fields, add report sections, improve handoff clarity |
| **Skills** | Update instructions, add/remove steps, improve reference docs, add new skills |
| **Brain Files** | Update rules, add missing rules, improve consistency, update skill references |
| **Scripts** | Fix bugs, add validation checks, improve error messages, add new automation |
| **Process Flow** | Reorder steps, add/remove gates, adjust thresholds (bounce limits, complexity labels) |
| **RAG Pipeline** | Adjust indexing scope, improve chunking, add new document types to index |

### What CANNOT Be Changed Without Escalation
- **Adding a new agent role** — requires human design decision + new brain config
- **Changing the V-Bounce state machine** — core process change, needs explicit human approval beyond normal improvement flow
- **Removing a gate** (QA, Architect) — safety-critical, must be a deliberate human decision
- **Changing git branching strategy** — affects all developers and CI/CD

## Output

The improve skill does not produce a standalone report file. Its output is:
1. The list of proposals presented to the human (inline during the conversation)
2. The applied changes to framework files
3. The `brains/CHANGELOG.md` entries documenting what changed and why

## Tracking Improvement Velocity

Over time, the Sprint Report §5 Framework Self-Assessment tables should shrink. If the same findings keep appearing after improvement passes, the fix didn't work — re-examine the root cause.

The Team Lead should note in the Sprint Report whether the previous improvement pass resolved the issues it targeted:
- "Improvement pass from S-03 resolved the Dev→QA handoff gap (0 handoff complaints this sprint)"
- "Improvement pass from S-03 did NOT resolve RAG relevance — same feedback from Developer"

## Critical Rules

- **Never change the framework without human approval.** Propose, don't impose.
- **Keep all brain surfaces in sync.** A change to CLAUDE.md must be reflected in GEMINI.md, AGENTS.md, and cursor-rules/.
- **Log everything.** Every change goes in `brains/CHANGELOG.md` with the finding that motivated it.
- **Run pre_bounce_sync.sh after changes.** Updated skills and rules must be re-indexed for RAG.
- **Don't over-engineer.** Fix the actual problem reported by agents. Don't add speculative improvements.
- **Respect the hierarchy.** Template changes are low-risk. Process flow changes are high-risk. Scope accordingly.
- **Skills are living documents.** If a skill's instructions consistently confuse agents, rewrite the confusing section — don't add workarounds elsewhere.

## Keywords

improve, self-improvement, framework evolution, retro, retrospective, process feedback, friction, template improvement, skill improvement, brain sync, meta-process, self-aware
