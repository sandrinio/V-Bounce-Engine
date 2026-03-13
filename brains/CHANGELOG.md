# V-Bounce Engine Brains & Skills Changelog

This log tracks modifications to the core agentic framework (e.g., `brains/`, `skills/`). 
Per **Rule 13: Framework Integrity**, anytime an entry is made here, all tool-specific brain files must be reviewed for consistency.

## [2026-03-12] — LanceDB Removal

- **Removed**: `scripts/vbounce_ask.mjs` — LanceDB semantic query tool. Replaced by direct `LESSONS.md` reads.
- **Removed**: `scripts/vbounce_index.mjs` — LanceDB indexer. No longer needed.
- **Removed**: `scripts/pre_bounce_sync.sh` — RAG sync script. No longer needed.
- **Modified**: `package.json` — Removed `@lancedb/lancedb` and `@xenova/transformers` dependencies. Only `js-yaml`, `marked`, `commander` remain.
- **Modified**: `bin/vbounce.mjs` — Removed `vbounce sync` command; simplified `install` to not run RAG init or install embedding deps.
- **Modified**: `brains/CLAUDE.md`, `brains/AGENTS.md`, `brains/GEMINI.md`, `brains/cursor-rules/vbounce-process.mdc` — Phase 2 Step 0 now reads state.json + runs `vbounce prep sprint` instead of `pre_bounce_sync.sh`; Step 2 now says "read LESSONS.md" instead of "query LanceDB".
- **Modified**: `brains/claude-agents/developer.md`, `qa.md`, `architect.md` — "Before" steps now read LESSONS.md directly instead of calling `vbounce_ask.mjs`.
- **Modified**: `brains/SETUP.md` — Step 7 rewritten as "Initialize Your First Sprint" (`vbounce sprint init`, `vbounce doctor`, `vbounce prep sprint`).
- **Modified**: `brains/CHANGELOG.md` Rule 13 — Removed `pre_bounce_sync.sh` trigger; only CHANGELOG.md update required.
- **Modified**: `templates/story.md`, `templates/hotfix.md` — Framework Integrity checklist item no longer mentions `pre_bounce_sync.sh`.
- **Modified**: `scripts/doctor.mjs` — Removed `pre_bounce_sync.sh` from required scripts list (now 15 scripts).
- **Modified**: `skills/improve/SKILL.md` — "RAG Pipeline" area renamed to "Context Prep" pointing to prep scripts.
- **Modified**: `README.md` — Removed "Semantic Context (Local RAG)" section; updated Tech Stack to reflect file-based context model; updated CLI reference.
- **Modified**: `.gitignore` — Removed `.bounce/.lancedb/` entry.
- **Rationale**: Modern LLMs have 200K+ token context windows. The prep scripts (`vbounce prep sprint/qa/arch`) + LESSONS.md graduation provide targeted, deterministic context without embedding models, sync steps, or heavy dependencies. Removes ~50MB of node_modules and eliminates the most common setup failure point.

## [2026-03-12] — V-Bounce Engine Optimization Plan (12-Change Batch)

### State Management (Change #1)
- **Added**: `.bounce/state.json` — machine-readable sprint state snapshot for crash recovery. Tracks sprint_id, delivery_id, current_phase, last_action, and per-story state (V-Bounce state, bounce counts, worktree path, updated_at).
- **Added**: `scripts/validate_state.mjs` — schema validator for state.json; exports `validateState(obj)` function with strict checks on format, enum values, and cross-field consistency.
- **Added**: `scripts/update_state.mjs` — atomic state.json updater; supports `--qa-bounce`, `--arch-bounce`, `--set-phase`, `--set-action`, `--show` flags; calls validateState after every write.
- **Modified**: `brains/CLAUDE.md` Phase 2 Step 0 — updated to "Orient via state: Read `.bounce/state.json`" for instant context recovery.
- **Modified**: `brains/GEMINI.md` Phase 2 Step 0 — same state.json orientation update.

### Sprint Scripts (Change #2)
- **Added**: `scripts/init_sprint.mjs` — creates `.bounce/` dir, state.json (stories in Draft), sprint plan dir, copies template; prints git commands.
- **Added**: `scripts/close_sprint.mjs` — validates terminal states, archives sprint report, updates state.json, prints manual steps.
- **Added**: `scripts/complete_story.mjs` — updates state.json to Done, updates sprint plan §1 V-Bounce State, appends row to §4 Execution Log via `<!-- EXECUTION_LOG_START -->` anchor.

### Sprint Plan as Accumulator (Change #3)
- **Modified**: `templates/sprint.md` — added `delivery` frontmatter field; new §2 Execution Strategy with phase plan and risk flags; Context Pack Readiness checklists in §1; §4 Execution Log with `<!-- EXECUTION_LOG_START -->` / `<!-- EXECUTION_LOG_END -->` anchors.
- **Added**: `scripts/validate_sprint_plan.mjs` — validates sprint plan YAML frontmatter, §1 table structure, cross-checks story IDs with state.json, checks §4 on Completed sprints.

### Richer YAML in Agent Reports (Change #4)
- **Modified**: `brains/claude-agents/qa.md` — FAIL report template now includes `bugs:` array (scenario/expected/actual/files/severity) and `gold_plating:` array in YAML frontmatter; added `template_version: "2.0"` to both PASS and FAIL templates. Markdown body is now narrative-only expansion.
- **Modified**: `brains/claude-agents/architect.md` — FAIL report template now includes `failures:` array (dimension/severity/what_wrong/fix_required) in YAML frontmatter; added `template_version: "2.0"` to both PASS and FAIL templates.
- **Modified**: `scripts/validate_report.mjs` — added `validateBugsArray()` and `validateFailuresArray()` helpers; QA FAIL validates `bugs[]` structure when present; Arch FAIL validates `failures[]` structure when present; added `ROOT_CAUSE_ENUM` validation for both QA and Arch FAIL reports.

### Validation Layer (Change #9)
- **Added**: `scripts/validate_bounce_readiness.mjs` — pre-bounce gate; checks story state, sprint plan, story spec, required sections, worktree existence; exits 1 on any failure.
- **Added**: `scripts/validate_sprint_plan.mjs` — validates sprint plan structure and cross-references.

### Context Management (Change #12)
- **Added**: `scripts/prep_sprint_context.mjs` — generates `.bounce/sprint-context-S-XX.md`; reads state.json (required), sprint plan, LESSONS.md (first 50 lines), RISK_REGISTRY; MAX_CONTEXT_LINES=200.
- **Added**: `scripts/prep_qa_context.mjs` — generates `.bounce/qa-context-STORY-ID.md`; exits 1 if dev report or story spec missing; MAX_CONTEXT_LINES=300.
- **Added**: `scripts/prep_arch_context.mjs` — generates `.bounce/arch-context-STORY-ID.md`; exits 1 if dev report/story spec missing; git diff truncated at MAX_DIFF_LINES=500.
- **Added**: `scripts/prep_sprint_summary.mjs` — generates `.bounce/sprint-summary-S-XX.md` from archived reports.
- **Added**: `vbounce.config.json` — `{ maxDiffLines: 500, maxContextLines: 200, maxQaContextLines: 300, contextBudgetWarningTokens: 12000, lessonStaleDays: 90, tool: "claude" }`.
- **Modified**: `brains/CLAUDE.md` Skills section — agent-team + lesson always-loaded; other skills moved to on-demand; context budget note added.

### Self-Improvement Loop (Change #10)
- **Added**: `scripts/sprint_trends.mjs` — scans `.bounce/archive/` dirs; computes per-sprint first-pass rate, avg bounces, correction tax, root_cause breakdown; generates `.bounce/trends.md`.
- **Added**: `scripts/suggest_improvements.mjs` — reads trends.md, LESSONS.md, improvement-log.md; flags stale lessons (>90 days), low first-pass rate, high correction tax; generates `.bounce/improvement-suggestions.md`.
- **Added**: `.bounce/improvement-log.md` — Applied/Rejected/Deferred tracking table.
- **Modified**: `brains/CLAUDE.md` Phase 3 — added `vbounce trends` + `vbounce suggest S-{XX}` to end-of-sprint workflow.

### Root Cause Tagging (Change #11)
- **Modified**: `brains/claude-agents/qa.md` — added `root_cause:` enum field to FAIL report YAML template.
- **Modified**: `brains/claude-agents/architect.md` — added `root_cause:` enum field to FAIL report YAML template.
- **Modified**: `scripts/validate_report.mjs` — `root_cause` validated against 12-value enum for QA and Arch FAIL reports.

### Document Separation of Concerns (Change #7)
- **Modified**: `skills/agent-team/SKILL.md` — Sprint Plan Sync table updated to 3-column format; Delivery Plan updated ONLY at sprint close.
- **Added**: `skills/agent-team/references/delivery-sync.md` — core rule table, what each document owns, "Never Do This" list.
- **Added**: `skills/agent-team/references/report-naming.md` — canonical naming conventions for all report files.
- **Added**: `skills/agent-team/references/cleanup.md` — after-story and after-sprint cleanup procedures, retention policy table.
- **Added**: `skills/agent-team/references/git-strategy.md` — branch model, all git commands for sprint/worktree/merge/cleanup.

### Lesson Graduation (Change #6)
- **Modified**: `skills/lesson/SKILL.md` — added Lesson Graduation section: criteria (3+ sprints, triggered once, no recent recurrence), process (suggest→approve→add to config→remove→log), rationale ("LESSONS.md is a staging area, not a permanent rule store").

### Automation CLI (Change #8)
- **Modified**: `bin/vbounce.mjs` — all new commands wired: `state show/update`, `sprint init/close`, `story complete`, `validate report/state/sprint/ready`, `prep qa/arch/sprint/summary`, `sync`, `trends`, `suggest`, `doctor`.

### Framework Health (Change #8)
- **Added**: `scripts/doctor.mjs` — health check; verifies LESSONS.md, templates, .bounce/, state.json, brain files, skills, scripts; exits 1 on hard failures.

### Tier 4 Brain Files (Change #12)
- **Added**: `brains/copilot/copilot-instructions.md` — Tier 4 (Copilot/VS Code) brain file: key behaviors, CLI commands, document hierarchy, report format, critical rules.
- **Added**: `brains/windsurf/.windsurfrules` — Tier 4 (Windsurf) brain file: before-coding checklist, document rules, state management commands, critical rules.
- **Modified**: `brains/GEMINI.md` — added full `## CLI Commands` section with all 15+ vbounce commands.

---

## [2026-03-02]
- **Initialized**: Created strict Framework Integrity tracking, YAML context handoffs, and RAG validation pipeline.

## [2026-03-06] — Pre-Gate Automation
- **Added**: `scripts/pre_gate_common.sh` — shared gate check functions with auto-detection for JS/TS, Python, Rust, Go stacks.
- **Added**: `scripts/pre_gate_runner.sh` — universal pre-gate scanner. Reads `.bounce/gate-checks.json` config or falls back to auto-detected defaults. Runs before QA (`qa`) and Architect (`arch`) agents to catch mechanical failures with zero tokens.
- **Added**: `scripts/init_gate_config.sh` — auto-detects project stack (language, framework, test runner, build/lint commands) and generates `.bounce/gate-checks.json`.
- **Modified**: `brains/claude-agents/qa.md` — added Pre-Computed Scan Results section. QA skips checks covered by `pre-qa-scan.txt`.
- **Modified**: `brains/claude-agents/architect.md` — added Pre-Computed Scan Results section. Architect skips mechanical checks covered by `pre-arch-scan.txt`.
- **Modified**: `brains/claude-agents/devops.md` — added `npm run lint` (tsc --noEmit) to post-merge validation.
- **Modified**: `skills/agent-team/SKILL.md` — wired pre-gate scans into Steps 3 (QA) and 4 (Architect). Added gate config init to Step 0 sprint setup. Added lint to post-merge validation.
- **Modified**: All brain files (`CLAUDE.md`, `GEMINI.md`, `AGENTS.md`, `cursor-rules/vbounce-process.mdc`) — updated bounce sequence to include pre-gate scan steps.
- **Modified**: `skills/improve/SKILL.md` — added Gate Check Proposals section for iteratively growing project-specific checks via `gate-checks.json`.

## [2026-03-06]
- **Fixed**: All brain files (`CLAUDE.md`, `GEMINI.md`, `AGENTS.md`) incorrectly referenced `DELIVERY_PLAN.md §5 Open Questions` or `ACTIVE_SPRINT.md §3 Open Questions`. Corrected to `sprint-{XX}.md §2 Sprint Open Questions` to match the authoritative `agent-team/SKILL.md` and `sprint.md` template.
- **Fixed**: Removed duplicate "Product Plans Folder Structure" header in `doc-manager/SKILL.md`.
- **Fixed**: `cursor-rules/vbounce-process.mdc` was missing Execution Mode, Sequential Dependencies, Impact Analysis Protocol, and Strategic Freeze rules from the 2026-03-05 update. Propagated.
- **Removed**: `templates/active_sprint.md` — orphaned by the state-based refactor. Superseded by `templates/sprint.md`.
- **Modified**: `cursor-rules/vbounce-rules.mdc` — added Rule 6 (JSDoc/docstrings), Rule 13 (YAML Frontmatter), Rule 14 (Framework Integrity) to match other brains.
- **Modified**: `cursor-rules/vbounce-docs.mdc` — added Hotfix and Sprint Report entries to Document Locations table.
- **Modified**: `cursor-rules/vbounce-process.mdc` — added `pre_bounce_sync.sh` and `validate_report.mjs` steps to Phase 2.
- **Modified**: Renamed `product_documentation/` → `vdocs/` across all brains, skills, agents, templates, scripts, diagrams, README, OVERVIEW, and SETUP to align with `@sandrinio/vdoc` output conventions.
- **Modified**: `bin/vbounce.mjs` — added optional vdoc installation step that auto-maps the user's chosen platform to the corresponding `npx @sandrinio/vdoc install <platform>` command.
- **Modified**: `brains/SETUP.md` — updated folder structure diagram to reflect state-based `product_plans/` layout.
- **Added**: `skills/improve/SKILL.md` — framework self-improvement skill. Reads agent Process Feedback from sprint retros, identifies patterns, proposes changes to templates/skills/brains/scripts with human approval.
- **Modified**: All agent report templates (`developer.md`, `qa.md`, `architect.md`, `devops.md`, `scribe.md`) — added `## Process Feedback` section for framework friction signals.
- **Modified**: `templates/sprint_report.md` §5 Retrospective — restructured into categorized Framework Self-Assessment (Templates, Handoffs, RAG, Skills, Process Flow, Tooling) with severity and suggested fixes.
- **Modified**: `skills/agent-team/SKILL.md` Step 7 — added Framework Self-Assessment aggregation and `improve` skill trigger.
- **Modified**: All brain files and `README.md` — added `improve` skill to skill references.

## [2026-03-05]
- **Modified**: Added `tokens_used` tracking to all agent instructions (`brains/claude-agents/*`).
- **Modified**: Updated `skills/agent-team/SKILL.md` to consolidate tokens into `sprint_report.md`.
- **Modified**: Updated `scripts/validate_report.mjs` to enforce `tokens_used` schema presence.
- **Modified**: Refactored `STORY-{EpicID}-{StoryID}` file naming convention to `STORY-{EpicID}-{StoryID}-{StoryName}` across all templates, agent instructions, skill definitions, and architecture files for better human readability.
- **Modified**: Refactored the generic `product_plans` folder into a state-based architecture (`strategy/`, `backlog/`, `sprints/`, `hotfixes/`, `archive/`). Separated Sprint tracking logic from `DELIVERY_PLAN.md` into a new `sprint.md` template. Updated `doc-manager` and `agent-team` orchestration to adhere to these physical transition rules.
