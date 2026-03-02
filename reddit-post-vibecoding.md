**Title:** I merged Scrum with vibecoding and open-sourced the framework. Here's how it works.

---

**Body:**

I've been vibecoding for a while now and kept running into the same problem — AI writes code fast, but without structure you end up with spaghetti. No reviews, no architecture checks, no audit trail. Every sprint felt like starting from scratch because there was no continuous improvement loop.

So I built a framework around it. I'm calling it V-Bounce OS, inspired by Cory Hymel's theory on structured AI development.

**The core idea:** What if you applied Scrum's transparency and continuous improvement to vibecoding — but let AI agents play the roles?

Here's how it works:

**6 agent roles with strict boundaries.** Team Lead orchestrates. Developer writes code. QA reviews but can't edit — they can only "bounce" it back with a report. Same for Architect. DevOps handles merges. Scribe documents everything. The separation is what makes it work — no single agent can both write and approve its own code.

**The "bounce loop."** Code goes Dev → QA → Architect. If QA or Architect finds issues, they bounce it back with a structured report. The Developer gets the feedback and tries again. Three bounces on either side = escalated to a human. This is where the quality comes from.

**Report-driven handoffs.** Agents never talk to each other directly. Every handoff is a structured markdown report. This means every decision is traceable and you get a full audit trail per sprint.

**Retrospectives that feed back.** Every sprint produces a retro — what went well, what didn't, process improvements. These feed into a LESSONS.md file that every agent reads before starting work. So the system actually gets better over time.

**Tools used to build this:**
- Claude Code for the agent orchestration
- Markdown templates for all documents (stories, epics, delivery plans, sprint reports)
- Git worktrees for agent isolation (each story gets its own worktree so agents can't interfere with each other)
- Shell scripts for hotfix management

**What I learned:**
- The biggest unlock wasn't the code generation — it was forcing agents to communicate through documents instead of free-form chat. Structured reports eliminated most hallucination drift.
- QA and Architect not being able to edit code is counterintuitive but critical. When a reviewer can just "fix it themselves," review quality drops to zero.
- A lightweight hotfix path (bypassing the full bounce loop for 1-2 file changes) was essential. Not everything needs the full Scrum ceremony.

**What's still missing:**
I haven't figured out how to connect web design tools into the requirements phase yet. Right now the framework handles code and architecture well, but the design-to-spec pipeline (Figma → agent-readable requirements, for example) is an open problem. If anyone has ideas on bridging that gap, I'd love to hear them.

It's MIT licensed and works with Claude, Cursor, Gemini, Copilot, and Codex. If anyone wants to try it or poke holes in the approach, the repo is here: https://github.com/sandrinio/V-Bounce-OS

Happy to answer questions about the design decisions.
