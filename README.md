# V-Bounce Engine

**A structured SDLC framework for AI coding agents.**

V-Bounce Engine turns AI assistants — Claude Code, Cursor, Gemini, Copilot, Codex — into disciplined engineering teams. Instead of letting agents code in a vacuum, it enforces a planning-first workflow with automated quality gates, structured handoffs, and a persistent learning loop.

> Inspired by the work of Cory Hymel

---

## How It Works

V-Bounce Engine is built around a **Context Loop** — a closed feedback system that makes agents smarter with each sprint.

```
Plan  ──>  Build  ──>  Bounce  ──>  Document  ──>  Learn
 │                        │             │              │
 │                    QA + Arch         │          LESSONS.md
 │                    gate code     Scribe maps        │
 │                                  the codebase       │
 └─────────────────────────────────────────────────────┘
                  Next sprint reads it all
```

**Plan.** The Team Lead writes requirements using structured templates (Charter, Epic, Story) before any code is written.

**Build.** The Developer agent implements each Story in an isolated git worktree and submits an Implementation Report.

**Bounce.** The QA agent validates against acceptance criteria. The Architect agent audits against your architecture rules. If either fails, the work bounces back to the Developer — up to 3 times before escalating to you. Every failure is tagged with a root cause (`missing_tests`, `adr_violation`, `spec_ambiguity`, etc.) for trend analysis.

**Document.** After merge, the Scribe agent maps the actual codebase into semantic product documentation using [vdoc](https://github.com/sandrinio/vdoc) (optional).

**Learn.** Sprint mistakes are recorded in `LESSONS.md`. All agents read it before writing future code. The framework also tracks its own performance — bounce rates, correction tax, recurring failure patterns — and suggests improvements to its own templates and skills.

---

## Quick Start

```bash
npx @sandrinio/vbounce install claude    # Claude Code
npx @sandrinio/vbounce install cursor    # Cursor
npx @sandrinio/vbounce install gemini    # Gemini CLI
npx @sandrinio/vbounce install codex     # OpenAI Codex
npx @sandrinio/vbounce install vscode    # GitHub Copilot
```

Then verify your setup:

```bash
npx vbounce doctor
```

### What gets installed

Here's what lands in your repo (example: Claude Code):

```
your-project/
├── CLAUDE.md                    # Brain file — teaches the agent the V-Bounce process
├── .claude/agents/              # Subagent instructions (Claude Code only)
│   ├── developer.md
│   ├── qa.md
│   ├── architect.md
│   ├── devops.md
│   └── scribe.md
├── templates/                   # 9 Markdown + YAML frontmatter templates
│   ├── charter.md
│   ├── roadmap.md
│   ├── epic.md
│   ├── story.md
│   ├── sprint.md
│   ├── delivery_plan.md
│   ├── sprint_report.md
│   ├── hotfix.md
│   └── risk_registry.md
├── skills/                      # 7 modular skill files (see Skills below)
│   ├── agent-team/
│   ├── doc-manager/
│   ├── lesson/
│   ├── vibe-code-review/
│   ├── write-skill/
│   ├── improve/
│   └── react-best-practices/   # Example — customize for your stack
├── scripts/                     # 23 automation scripts (validation, context prep, state)
└── package.json                 # 3 deps: js-yaml, marked, commander. Nothing else.
```

Other platforms install the same `templates/`, `skills/`, and `scripts/` — only the brain file differs (`.cursor/rules/`, `GEMINI.md`, `AGENTS.md`, or `.github/copilot-instructions.md`).

Everything is plain Markdown and Node.js. No vector DBs, no embedding models, no background services.

---

## Supported Tools

V-Bounce Engine adapts to each tool's capabilities:

| Tier | Tool | How it works |
|------|------|-------------|
| 1 | Claude Code | Full orchestration — spawns subagents for each role, manages state, runs all CLI commands |
| 2 | Gemini CLI, Codex | Single-agent mode — follows the bounce loop sequentially, full CLI access |
| 3 | Cursor | Role-specific context injection via `.cursor/rules/` MDC files |
| 4 | Copilot, Windsurf | Awareness mode — checklist-driven, reads state, safe CLI operations |

---

## The Bounce Loop

This is the core execution cycle for every Story:

```
         Developer                QA                 Architect            DevOps
            │                     │                      │                  │
  Writes code in worktree         │                      │                  │
  Submits Implementation  ──────> │                      │                  │
  Report                   Validates against       (waits for QA)          │
                           acceptance criteria           │                  │
                                  │                      │                  │
                           PASS ──────────────────────>  │                  │
                           FAIL ──> bounces back    Audits against          │
                                    to Developer    ADRs + safe zone        │
                                                         │                  │
                                                  PASS ──────────────────>  │
                                                  FAIL ──> bounces back  Merges worktree
                                                           to Developer  into main branch
```

After 3 failed bounces on either gate, the Story escalates to you for intervention.

Each FAIL report includes a `root_cause` tag that feeds into cross-sprint trend analysis via `vbounce trends`.

---

## Skills

Skills are modular markdown instructions the Team Lead invokes automatically during the SDLC:

| Skill | Purpose |
|-------|---------|
| `agent-team` | Spawns temporary sub-agents (Dev, QA, Architect, DevOps, Scribe) to parallelize work |
| `doc-manager` | Enforces the document hierarchy for Epics and Stories |
| `lesson` | Extracts mistakes from sprints into `LESSONS.md` |
| `vibe-code-review` | Runs Quick Scan or Deep Audit against acceptance criteria and architecture rules |
| `write-skill` | Allows the Team Lead to author new skills when the team encounters a recurring problem |
| `improve` | Self-improvement loop — reads agent friction signals across sprints and proposes framework changes (with your approval) |
| `react-best-practices` | Example tech-stack skill — customize this for your own stack |

---

## State Management

Sprint state lives in `.bounce/state.json` — a machine-readable snapshot that survives context resets and session interruptions:

```json
{
  "sprint_id": "S-01",
  "current_phase": "bouncing",
  "stories": {
    "STORY-001-01-login": {
      "state": "Bouncing",
      "qa_bounces": 1,
      "arch_bounces": 0,
      "worktree": ".worktrees/STORY-001-01-login"
    }
  }
}
```

When a session starts, the Team Lead reads `state.json` to resume exactly where the sprint left off.

---

## CLI Reference

```bash
# Sprint lifecycle
vbounce sprint init S-01 D-01         # Initialize sprint
vbounce sprint close S-01             # Validate, archive, close

# Story lifecycle
vbounce story complete STORY-ID       # Mark story done, update state

# State management
vbounce state show                    # Print current state
vbounce state update STORY-ID STATE   # Update story state

# Context preparation
vbounce prep sprint S-01              # Sprint context pack
vbounce prep qa STORY-ID              # QA context pack
vbounce prep arch STORY-ID            # Architect context pack

# Validation
vbounce validate report <file>        # Validate report YAML
vbounce validate state                # Validate state.json schema
vbounce validate sprint S-01          # Validate sprint plan
vbounce validate ready STORY-ID       # Pre-bounce readiness gate

# Self-improvement
vbounce trends                        # Cross-sprint trend analysis
vbounce suggest S-01                  # Generate improvement suggestions

# Health check
vbounce doctor                        # Verify setup
```

---

## Runtime Structure

As you use V-Bounce Engine, the framework creates these directories to manage your sprints:

```
product_plans/                   # Created when you start planning
  strategy/                      #   Charter, Roadmap, Risk Registry (frozen during sprints)
  backlog/                       #   Epics and Stories awaiting sprint assignment
  sprints/                       #   Active sprint workspace (one active at a time)
  hotfixes/                      #   Emergency fixes that bypass sprint cycles
  archive/                       #   Completed sprints and Epics (immutable history)

.bounce/                         # Created on first sprint init
  state.json                     #   Machine-readable sprint state (crash recovery)
  reports/                       #   QA and Architect bounce reports
  improvement-log.md             #   Tracked improvement suggestions

.worktrees/                      # Git worktrees for isolated story branches

LESSONS.md                       # Accumulated mistakes — agents read this before coding
```

---

## End-of-Sprint Reports

When a sprint concludes, V-Bounce Engine generates three structured reports:

- **Sprint Report** — what was delivered, execution metrics (tokens, cost, bounce rates), story results, lessons learned, and a retrospective.
- **Release Report** — the DevOps agent's merge log, environment changes, and post-merge validations.
- **Scribe Report** — which product documentation was created, updated, or flagged as stale.

---

## Documentation

- [Epic template and structure](templates/epic.md)
- [Hotfix edge cases](docs/HOTFIX_EDGE_CASES.md)
- [vdoc integration](https://github.com/sandrinio/vdoc)

## Contributing

Contributions, issues, and feature requests are welcome. Check the [issues page](https://github.com/sandrinio/v-bounce-engine/issues).

## License

[MIT](LICENSE)
