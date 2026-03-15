# V-Bounce Engine

**A structured SDLC framework for AI coding agents.**

V-Bounce Engine turns AI assistants — Claude Code, Cursor, Gemini, Copilot, Codex — into disciplined engineering teams. Instead of letting agents code in a vacuum, it enforces a planning-first workflow with automated quality gates, structured handoffs, and a persistent learning loop.

> Inspired by the work of Cory Hymel

---

## The Problem

AI coding agents are powerful — but without structure, they create expensive chaos:

- **No accountability.** The agent writes code, but nobody reviews it against requirements before it ships. Bugs that a junior engineer would catch survive to production.
- **Invisible progress.** You ask "how's the feature going?" and the only answer is "the agent is still running." No milestones, no intermediate artifacts, no way to course-correct mid-sprint.
- **No institutional memory.** Every session starts from zero. The agent makes the same architectural mistake it made last week because nothing captures what went wrong.
- **Rework cycles.** Without quality gates, bad code compounds. A missed requirement discovered late costs 10x more to fix than one caught early.
- **Risk blindness.** There's no structured way to assess what could go wrong before the agent starts building.

V-Bounce Engine solves this by wrapping AI agents in the same discipline that makes human engineering teams reliable: planning documents, role-based reviews, automated gates, and a learning loop that compounds knowledge across sprints.

---

## Built-in Guardrails

Every risk that keeps you up at night has a specific mechanism that catches it:

| Risk | What catches it |
|------|----------------|
| Agent ships code that doesn't match requirements | **QA gate** — validates every story against acceptance criteria before merge |
| Architectural drift over time | **Architect gate** — audits against your ADRs and safe-zone rules on every story |
| One bad story breaks everything | **Git worktrees** — every story is isolated; failures can't contaminate other work |
| Agent gets stuck in a loop | **3-bounce escalation** — after 3 failed attempts, the story surfaces to a human |
| Scope creep on "quick fixes" | **Hotfix hard-stop** — Developer must stop if a fix touches more than 2 files |
| Same mistakes keep happening | **LESSONS.md** — agents read accumulated mistakes before writing future code |
| Silent regressions | **Root cause tagging** — every failure is tagged and tracked across sprints |
| Framework itself becomes stale | **Self-improvement skill** — analyzes friction patterns and proposes changes (with your approval) |

---

## Planning With V-Bounce

V-Bounce separates planning into two layers: **what to build** and **how to ship it**.

### Product Planning — What to Build

A document hierarchy that mirrors how product teams already think:

```
Charter  (WHY — vision, principles, constraints)
  → Roadmap  (WHAT/WHEN — releases, milestones, architecture decisions)
    → Epic  (scoped WHAT — a feature with clear boundaries)
      → Story  (HOW — implementation spec with acceptance criteria)
```

**You write the top levels. The AI builds the bottom.**

A Product Owner authors the Charter and Roadmap. A Product Manager breaks those into Epics with Stories. The AI agent takes each Story, implements it, and submits proof that it meets the acceptance criteria — validated by QA and Architect gates before anything merges.

Every document includes an **ambiguity score**:
- 🔴 High — requirements unclear, blocked from development
- 🟡 Medium — tech TBD but logic is clear, safe to plan
- 🟢 Low — fully specified, ready to build

No level can be skipped. This prevents the most common AI failure mode: building the wrong thing because requirements were vague.

### Execution Planning — How to Ship It

Once you know *what* to build, three documents govern *how* it gets delivered:

| Document | Scope | Who uses it | What it tracks |
|----------|-------|-------------|----------------|
| **Delivery Plan** | A full release (multiple sprints) | PM | Which Epics are included, project window (start/end dates), high-level backlog prioritization, escalated/parked stories |
| **Sprint Plan** | One sprint (typically 1 week) | Team Lead + PM | Active story scope, context pack readiness checklists, execution strategy (parallel vs sequential phases), dependency chains, risk flags, and a live execution log |
| **Risk Registry** | Cross-cutting (all levels) | PM + Architect | Active risks with likelihood/impact scoring, phase-stamped analysis log, mitigations, and resolution history |

**How they connect:**

```
Delivery Plan  (the milestone — "we're shipping auth + payments by March 30")
  → Sprint Plan  (this week — "stories 01-03 in parallel, 04 depends on 01")
       ↑
  Risk Registry  (cross-cutting — reviewed at every sprint boundary)
```

The **Delivery Plan** is updated only at sprint boundaries. The **Sprint Plan** is the single source of truth during active execution — every story state transition is recorded there. At sprint end, the Sprint Plan's execution log becomes the skeleton for the Sprint Report automatically.

The **Sprint Plan** also includes a **Context Pack Readiness** checklist for each story — a preflight check ensuring the spec is complete, acceptance criteria are defined, and ambiguity is low before any code is written. If a story isn't ready, it stays in Refinement.

---

## Reports and Visibility

V-Bounce generates structured reports at every stage — designed to answer stakeholder questions without requiring anyone to read code:

| Report | When it's generated | What it answers |
|--------|-------------------|-----------------|
| **Implementation Report** | After each story is built | What was built? What decisions were made? What tests were added? |
| **QA Report** | After validation | Does the implementation match the acceptance criteria? What failed? |
| **Architect Report** | After audit | Does this align with our architecture? Any ADR violations? |
| **Sprint Report** | End of sprint | What shipped? What bounced? What's the correction tax? Lessons learned? |
| **Release Report** | After merge | What went to production? Environment changes? Post-merge validations? |
| **Scribe Report** | After documentation pass | What product docs were created, updated, or flagged as stale? |

**You don't need to read code to manage the sprint.** The reports surface exactly what a PM or PO needs to make decisions.

---

## What You Can Measure

V-Bounce tracks metrics that map directly to product and delivery health:

| Metric | What it tells you | Action when it's bad |
|--------|------------------|---------------------|
| **Bounce Rate (QA)** | How often code fails acceptance criteria | Stories may have vague requirements — tighten acceptance criteria |
| **Bounce Rate (Architect)** | How often code violates architecture rules | ADRs may be unclear, or the agent needs better context |
| **Correction Tax** | 0% = agent delivered autonomously, 100% = human rewrote everything | High tax means the agent needs better guidance (Charter, Roadmap, or Skills) |
| **Root Cause Distribution** | Why things fail — `missing_tests`, `adr_violation`, `spec_ambiguity`, etc. | Invest in the category that fails most often |
| **Escalation Rate** | How often stories hit the 3-bounce limit | Chronic escalation signals structural issues in planning docs |
| **Sprint Velocity** | Stories completed per sprint | Track trend over time — should improve as LESSONS.md grows |

Run `vbounce trends` to see cross-sprint analysis. Run `vbounce suggest` for AI-generated improvement recommendations.

---

## How a Sprint Flows

Here's what a sprint looks like from the product side — no terminal commands, no code:

**Phase 1 — Planning**
The PM reviews the Roadmap and selects which Epics to tackle. Each Epic contains Stories with acceptance criteria and complexity labels (L1 Trivial through L4 Strategic). Stories are assigned to the sprint. Each story passes a readiness checklist before any code is written.

**Phase 2 — The Bounce**
The AI team works autonomously. For each Story:
1. The **Developer** builds the feature in isolation
2. The **QA agent** checks: does the code meet the acceptance criteria?
3. The **Architect agent** checks: does the code follow our architecture rules?
4. If either check fails, the work "bounces" back to the Developer with a tagged reason
5. After 3 bounces, the story escalates to the human team

You can check progress anytime — `state.json` shows exactly which stories are in progress, passed, or stuck. No need to interrupt the agents.

**Phase 3 — Review**
The Sprint Report lands. It tells you:
- What shipped and what didn't
- How many bounces each story took (and why)
- The correction tax (how much human intervention was needed)
- Lessons the AI captured for future sprints
- Recommendations for process improvements

You review, approve the release, and the sprint archives itself. The next sprint starts smarter because the agents now carry forward everything they learned.

---

## Continuous Improvement

Most AI coding setups are stateless — every session starts from scratch. V-Bounce is the opposite.

The **Context Loop** is a closed feedback system that makes your AI team measurably better over time:

```
Plan  ──>  Build  ──>  Bounce  ──>  Document  ──>  Learn
 │                        │             │              │
 │                    QA + Arch         │          LESSONS.md
 │                    gate code     Scribe maps        │
 │                                  the codebase       │
 └─────────────────────────────────────────────────────┘
                  Next sprint reads it all
```

After each sprint:
- **LESSONS.md** captures every mistake — agents read this before writing future code
- **Trend analysis** spots recurring patterns (e.g., "auth-related stories bounce 3x more than average")
- **Self-improvement skill** proposes changes to templates, skills, and brain files
- **Scribe** keeps product documentation in sync with actual code

Sprint 1 might have a 40% bounce rate. By Sprint 5, that number drops — because the agents have accumulated context about your codebase, your architecture decisions, and your team's standards.

---

## Is V-Bounce Right For You?

**Best fit:**
- Teams using AI agents for production code (not just prototypes)
- Projects with clear requirements that can be expressed as acceptance criteria
- Codebases where architectural consistency matters
- Teams that want to scale AI usage without losing quality control

**Less ideal for:**
- One-off scripts or throwaway prototypes (overkill)
- Exploratory research with no defined requirements
- Projects where the entire team is deeply embedded in every code change anyway

**Minimum setup:** One person who can run `npx` commands + one person who can write a Charter and Epics. That's it.

---

## Roles and Responsibilities

### Human

You own the planning and the final say. The agents never ship without your approval.

| Responsibility | What it involves |
|---------------|-----------------|
| **Set vision and constraints** | Write the Charter and Roadmap — define what to build and what's off-limits |
| **Define requirements** | Break Roadmap into Epics and Stories with acceptance criteria |
| **Review and approve** | Read sprint reports, approve releases, intervene on escalations |
| **Tune agent performance** | Adjust brain files, skills, and ADRs based on trend data and bounce patterns |
| **Install and configure** | Run the installer, verify setup with `vbounce doctor` |

### Agent — Team Lead (Orchestrator)

The Team Lead reads your planning documents and coordinates the entire sprint. It never writes code — it delegates, tracks state, and generates reports.

| Responsibility | What it involves |
|---------------|-----------------|
| **Sprint orchestration** | Assigns stories, manages state transitions, enforces the bounce loop |
| **Agent delegation** | Spawns Developer, QA, Architect, DevOps, and Scribe agents as needed |
| **Report routing** | Reads each agent's output and decides the next step (pass, bounce, escalate) |
| **Escalation** | Surfaces stories to the human after 3 failed bounces |
| **Sprint reporting** | Consolidates execution data into Sprint Reports and Release Reports |

### Agent — Specialists (Developer, QA, Architect, DevOps, Scribe)

Five specialist agents, each with a single job and strict boundaries:

| Agent | What it does | Constraints |
|-------|-------------|-------------|
| **Developer** | Implements stories in isolated worktrees, submits implementation reports | Works only in its assigned worktree |
| **QA** | Validates code against acceptance criteria | Read-only — cannot modify code |
| **Architect** | Audits against ADRs, architecture rules, and safe-zone boundaries | Read-only — cannot modify code |
| **DevOps** | Merges passing stories into the sprint branch | Only acts after both gates pass |
| **Scribe** | Generates and maintains product documentation from the actual codebase | Only runs after merge |

One person can fill the entire human side. The framework scales to the team you have.

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

## Glossary

| Term | Definition |
|------|-----------|
| **Bounce** | When a story fails a quality gate (QA or Architect) and gets sent back to the Developer for fixes |
| **Bounce Rate** | Percentage of stories that fail a gate on the first attempt |
| **Context Loop** | The closed feedback cycle: Plan → Build → Bounce → Document → Learn → next sprint |
| **Correction Tax** | How much human intervention a story needed — 0% is fully autonomous, 100% means a human rewrote it |
| **Escalation** | When a story hits the 3-bounce limit and surfaces to a human for intervention |
| **Gate** | An automated quality checkpoint — QA validates requirements, Architect validates structure |
| **Hotfix Path** | A fast track for trivial (L1) changes: 1-2 files, no QA/Architect gates, human verifies directly |
| **L1–L4** | Complexity labels: L1 Trivial, L2 Standard, L3 Complex, L4 Strategic |
| **Root Cause Tag** | A label on every bounce failure (e.g., `missing_tests`, `adr_violation`) used for trend analysis |
| **Scribe** | The documentation agent that maps code into semantic product docs |
| **Sprint Report** | End-of-sprint summary: what shipped, metrics, bounce analysis, lessons, retrospective |
| **Worktree** | An isolated git checkout where a single story is implemented — prevents cross-story interference |

---

## Documentation

- [System Overview with diagrams](OVERVIEW.md)
- [Epic template and structure](templates/epic.md)
- [Hotfix edge cases](docs/HOTFIX_EDGE_CASES.md)
- [vdoc integration](https://github.com/sandrinio/vdoc)

## Contributing

Contributions, issues, and feature requests are welcome. Check the [issues page](https://github.com/sandrinio/v-bounce-engine/issues).

## License

[MIT](LICENSE)
