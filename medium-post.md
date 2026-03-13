# I Built a Framework for AI Agents to Ship Production Code. Here's How It Works.

*Why giving AI agents a process matters more than giving them better prompts.*

---

Most people using AI to write code are doing it wrong. Not because the models are bad — they're shockingly good. But because we're treating them like autocomplete with opinions, when what they actually need is structure.

I spent the last few months building **V-Bounce Engine** — a framework that turns AI coding agents into a functioning development team. Not a single agent that does everything, but six specialized agents with clear roles, strict handoffs, and a process that catches mistakes before they reach production.

This post is the story of why I built it, how it works, and what I learned about making AI agents actually reliable.

---

## The Problem: AI Code Is Fast and Fragile

Here's what happens when you ask an AI agent to build a feature: it writes code. Fast. Confidently. And about 30-40% of the time, it introduces subtle issues — wrong assumptions, architectural drift, gold-plated solutions nobody asked for, or bugs that only surface when you integrate with the rest of the codebase.

The usual fix is better prompts. More context. Longer system messages. But that's like giving a junior developer a longer briefing and hoping they'll also QA their own work, audit their own architecture, and merge their own code safely. It doesn't matter how talented they are — one person shouldn't do all of that.

What software engineering figured out decades ago applies to AI agents too: **separation of concerns isn't just for code, it's for the process.**

---

## The Idea: What If AI Agents Worked Like a Real Team?

V-Bounce Engine is built on a simple principle: **the agent that writes the code should never be the agent that validates it.**

Instead of one agent doing everything, V-Bounce Engine defines six specialized roles:

- **Team Lead** — orchestrates the process, delegates work, never writes code
- **Developer** — implements features, reads specs, writes code
- **QA** — validates against acceptance criteria, finds bugs (can't edit code — only report)
- **Architect** — audits structural integrity and standards compliance (can't edit code — only audit)
- **DevOps** — handles git operations, merges, and releases
- **Scribe** — generates product documentation after features ship

The key constraint: **agents communicate only through structured reports.** No direct agent-to-agent communication. The Developer writes an Implementation Report. QA reads that report plus the acceptance criteria and writes a Validation Report. The Architect reads everything and writes an Audit Report. Every handoff is a document, and every document has a defined structure.

This isn't just bureaucracy. It's how you make AI work auditable.

---

## The Three Phases

V-Bounce Engine runs in three phases per sprint:

**Phase 1: Verification (Planning)** — Before any code is written, the human creates a document hierarchy: Charter (why are we building this?) → Roadmap (what are we shipping?) → Epics (feature scope) → Stories (implementation contracts) → Delivery Plan (sprint execution). Each document inherits from the level above. No level can be skipped. This sounds heavy, but AI agents are remarkably good at drafting these documents — you just need to give them the right templates and upstream context.

**Phase 2: The Bounce (Implementation)** — This is where the name comes from. Each story goes through a loop: Developer implements → QA validates → if QA finds bugs, the story "bounces" back to Developer → Developer fixes → QA re-validates. If it passes QA, it goes to Architect for structural review. If Architect finds issues, it bounces back again. Three bounces on either gate and the story gets escalated to the human. This loop is the quality control mechanism. It catches issues that a single-agent approach would miss entirely.

**Phase 3: Review** — The Team Lead compiles a Sprint Report, the human reviews it, and if approved, DevOps merges to main and tags a release. Lessons are recorded. A retrospective examines what went well, what didn't, and what should change in the delivery process itself.

---

## The Bounce: Why It Works

The bounce is the core innovation. Here's what actually happens during a single story:

1. **Team Lead** reads the story spec, creates a task file, and spawns a Developer agent in an isolated git worktree
2. **Developer** reads LESSONS.md (project-specific rules from past mistakes), implements the feature, writes a report listing every file modified and why
3. **Team Lead** reads the report, spawns a **QA** agent with the Developer's report and the story's acceptance criteria
4. **QA** runs validation — tests, code review, gold-plating checks. If it fails, QA writes a Bug Report and the story bounces back to Developer
5. If QA passes, the **Architect** gets all reports plus the project's Architecture Decision Records and validates structural integrity
6. If Architect passes, **DevOps** merges the story branch into the sprint branch and runs post-merge validation

Every story runs in its own **git worktree** — a fully isolated checkout of the codebase. This means if Developer Agent A is working on authentication and Developer Agent B is working on the dashboard, they literally cannot interfere with each other's files. When both stories pass all gates, DevOps merges them into the sprint branch, and the Architect runs an integration audit to catch conflicts between the combined changes.

This isolation-plus-gates approach is what makes parallel agent work safe. Without it, you're one merge conflict away from a broken build.

---

## The State Machine

Every story has a clear state at all times:

```
Bouncing → QA Passed → Architect Passed → Sprint Review → Done
```

"QA Passed" means exactly what it says — QA cleared the story, Architect hasn't weighed in yet. "Architect Passed" means both quality gates are clear and it's ready for merge. Past-tense naming eliminates ambiguity. Anyone scanning the Delivery Plan knows exactly where every story stands.

If QA bounces a story 3 times, or the Architect bounces it 3 times, it gets escalated. The human decides: rewrite the spec, split the story, or kill it. The process doesn't get stuck — it surfaces problems early and hands them to the person who can actually resolve them.

---

## What I Learned Building This

**1. Reports are everything.** The structured report format is what makes the system work. When QA gets a Dev report that lists every file modified with a logic summary, QA can actually validate the work systematically. When the Architect gets QA's validation report plus the Dev report plus the ADRs, there's enough context for a real audit. Without structured reports, agents just guess at what the other agent did.

**2. Restricting tools is more important than adding them.** QA has no Edit or Write tools — it can only read code and write reports. This isn't a limitation; it's a feature. If QA could edit code, it would fix bugs instead of reporting them, and you'd lose the accountability trail. The Architect is read-only for the same reason. Constraints create clarity.

**3. LESSONS.md is the secret weapon.** Every agent reads a project-level LESSONS.md before doing work. It accumulates rules from past mistakes — "never use dynamic imports for this module," "the auth middleware must be called before the rate limiter," "the database connection pool has a max of 10." After a few sprints, the agents stop making the same mistakes because the lessons file encodes institutional knowledge.

**4. The human stays in control at exactly the right moments.** V-Bounce Engine doesn't try to eliminate human involvement — it moves it to where it matters most. Humans write the specs (Phase 1), approve sprint results (Phase 3), decide on escalations, and approve lessons. The boring, repetitive middle part (write code, test it, fix it, review it, merge it) is where agents excel.

**5. Correction Tax is the metric that matters.** Every Developer report includes a "Correction Tax" — what percentage of the work required human intervention. Track this across sprints and you get a real measure of agent reliability. If Correction Tax is climbing, something is wrong with the specs. If it's dropping, the LESSONS.md is working.

---

## The Document Hierarchy: Why Planning Matters

One of the most counterintuitive parts of V-Bounce Engine is how much planning infrastructure it includes. Charter, Roadmap, Epics, Stories, Delivery Plan, Risk Registry — that's six document types before a single line of code is written.

But here's why it works: AI agents are excellent at following detailed specs and terrible at inferring requirements. A Story in V-Bounce Engine has three sections designed for three different consumers: **The Spec** (human-readable requirements for the Developer), **The Truth** (Gherkin acceptance criteria for QA), and **The Implementation Guide** (AI-to-AI technical instructions). Each section is written by someone different and consumed by a different agent.

This separation means the Developer doesn't have to guess what "done" looks like — QA has an explicit checklist. The Architect doesn't have to guess what architectural decisions were made — the Roadmap has ADRs. The DevOps agent doesn't have to guess if the story is ready to merge — the gate reports are either PASS or FAIL.

Good documentation isn't overhead when agents are doing the work. It's the interface.

---

## What V-Bounce Engine Is Not

It's not a product. It's a methodology implemented as a set of markdown files — templates, skills, brain files, and agent configs — that you drop into any git repo. It works with Claude Code, Cursor, Codex CLI, Gemini CLI, and Antigravity. Each tool gets a "brain file" that teaches it the V-Bounce process, and the agents operate through the same report-driven flow regardless of which AI tool is running them.

It's also not magic. You still need a human who understands the product and can write good specs. The framework amplifies good requirements into reliable code — but it can't turn vague requirements into good software. Garbage in, garbage out, just faster.

---

## Where It's Going

V-Bounce Engine is still early. There are known limitations — the react-best-practices skill is React-specific in what's supposed to be a framework-agnostic system. The bounce loop is sequential when it could potentially parallelize QA and Architect for independent stories. The Scribe agent for documentation generation is functional but could be smarter about detecting what's changed.

But the core insight — that AI agents need process, not just prompts — has held up through every iteration. The bounce count goes down sprint over sprint. The LESSONS.md gets richer. The Correction Tax drops. The system learns.

If you're building software with AI agents and finding that the code quality isn't consistent enough for production, the answer probably isn't a better model or a longer prompt. It's a process that separates implementation from validation, makes every handoff explicit, and keeps a human in the loop at the decisions that matter.

That's what V-Bounce Engine does. Three phases, six agents, one process.

---

*V-Bounce Engine is open and available as a set of markdown files you can drop into any git repo. If you want to try it, the SETUP.md guide walks through adding it to an existing project in six steps.*
