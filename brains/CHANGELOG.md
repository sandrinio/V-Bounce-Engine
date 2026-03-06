# V-Bounce OS Brains & Skills Changelog

This log tracks modifications to the core agentic framework (e.g., `brains/`, `skills/`). 
Per **Rule 13: Framework Integrity**, anytime an entry is made here, the orchestrator MUST trigger `./scripts/pre_bounce_sync.sh` to update the RAG embeddings globally.

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
