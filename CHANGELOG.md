# Changelog

All notable changes to the V-Bounce Engine framework and its CLI installer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-03-01
### Added
- Hotfix Path for L1 Trivial tasks — bypasses Epic/Story hierarchy and QA/Architect bounce loop.
- `templates/hotfix.md` — lightweight template for 1-2 file fixes with Developer hard-stop constraint.
- `scripts/hotfix_manager.sh` — automation script with `audit`, `sync`, and `ledger` commands.
- `docs/HOTFIX_EDGE_CASES.md` — five edge cases (scope creep, silent regression, architectural drift, merge conflicts, invisible deliverables) with mitigations.
- §8 Applied Hotfixes section in `delivery_plan.md` template.
- Product Docs Affected subsection in Sprint Report §1.
- Correction Tax metric clarification (0% = autonomous, 100% = human rewrote).

### Fixed
- Hardened `hotfix_manager.sh`: git repo guard, dynamic commit lookback (no more `HEAD~5`), absolute worktree paths via `git rev-parse`, proper `--help` flag.
- Removed phantom "Sync" pseudo-state from doc-manager hotfix transitions — folded into "Done" transition.
- Clarified OVERVIEW.md hotfix path: Developer still implements (Phase 2 work), only QA/Architect gates are skipped.

### Changed
- OVERVIEW.md: Step 0 is now "Triage" (Standard vs Hotfix path), sprint lifecycle diagram updated.
- `package.json`: Added `scripts/` and `docs/` to npm `files` array.

## [1.0.1] - 2026-03-01
### Added
- Added `--version` and `-v` flags to the `npx vbounce` CLI to allow users to readily check their framework version.
- Created `CHANGELOG.md` file to track framework updates over time.

## [1.0.0] - 2026-03-01
### Added
- Initial release of the V-Bounce Engine framework.
- Packaged SDLC skills including `agent-team`, `doc-manager`, `lesson`, `react-best-practices`, `vibe-code-review`, and `write-skill`.
- Established the `product_plans/` template hierarchy (Charter, Roadmap, Epic, Story, Delivery Plan, Risk Registry).
- Created the Node.js CLI installer for targeting Claude, Cursor, Gemini, Copilot, and Codex workspaces.
- Bundled complete markdown "Brain" files for context injection.
