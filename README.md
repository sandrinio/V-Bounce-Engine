# 🎯 V-Bounce OS

**Turn your AI coding assistant into a full engineering team.**

*Stop letting your AI code in a vacuum. V-Bounce OS is a structured, agentic framework that enforces a strict Software Development Lifecycle (SDLC) on AI agents like Claude Code, Cursor, Copilot, Gemini, and Codex.*

> *Inspired by the work of Cory Hymel*

---

## 💡 The Hook: Why V-Bounce OS?

Multi-agent frameworks are everywhere. But simply putting three agents in a chatroom doesn't write scalable software. When left unchecked, AI coding teams still hallucinate requirements, introduce architectural drift, and break existing patterns because they are disconnected from the truth of what they actually built.

**The core differentiator of V-Bounce OS is the Context Loop: Requirements → Bounce Reports → Product Documentation.**

Instead of treating your AI as a solo developer, V-Bounce OS forces distinct, specialized roles (Team Lead, Developer, QA, Architect, Scribe) to communicate exclusively through structured artifacts.

1. **Requirements (`product_plans/`)**: The Team Lead defines standard, immutable templates (Charter, Epic, Story) before a single line of code is written.
2. **Bounce Reports (`.bounce/`)**: During implementation, the QA and Architect agents do not edit code. They run deep codebase audits and emit structured "Bounce Reports" summarizing anti-patterns and regressions. The Developer must fix the issues and run the loop again until the code passes validation. 
3. **Product Documentation (`product_documentation/`)**: The Scribe agent explores the *actual* codebase post-merge and uses our integrated `vdoc` tool to update feature-centric documentation and the semantic `_manifest.json` map. 

The next time an agent writes code, it reads the `_manifest.json` and the `LESSONS.md` file from previous sprints. The context loop closes. Your AI writes better code because it finally understands the reality of your evolving system.

---

## 🚀 Quick Start

One command to install the entire methodology directly into your AI assistant.

```bash
# For Claude Code
npx @sandrinio/vbounce install claude

# For Cursor
npx @sandrinio/vbounce install cursor

# For Gemini / Antigravity
npx @sandrinio/vbounce install gemini

# For Copilot / VS Code
npx @sandrinio/vbounce install vscode

# For OpenAI Codex
npx @sandrinio/vbounce install codex
```

### What gets installed?
- **Agent Instructions:** The "Brain" file (e.g., `CLAUDE.md`, `.cursor/rules/`) that teaches your AI how to follow the V-Bounce process.
- **Templates:** Markdown templates for your Charter, Roadmap, Epics, and Stories.
- **Bundled Scripts:** Our validation pipeline (`validate_report.mjs`) and RAG synchronization engine (`pre_bounce_sync.sh`).
- **Autonomous RAG Setup:** The installer automatically runs `npm install` for required libraries and initializes your local LanceDB knowledge base (`.bounce/.lancedb/`).
- **vdoc Integration:** Fully compatible with [`@sandrinio/vdoc`](https://github.com/sandrinio/vdoc) to automatically construct semantic product documentation.

### 🧰 The Bundled Skills
V-Bounce OS installs a powerful suite of specialized markdown `skills/` directly into your workspace. These act as modular capabilities you can invoke dynamically or that the Team Lead agent will invoke automatically during the SDLC process:

| Skill | Role | Purpose |
|-------|------|---------|
| `agent-team` | Lead | Spawns temporary sub-agents (Dev, QA, DevOps) to parallelize complex tasks without losing context. |
| `doc-manager` | All | Enforces the strict hierarchy for managing Epic and Story documents *(Charter is optional, used only for new projects or brainstorming)*. |
| `lesson` | Lead | Extracts mistakes made during Sprints and updates `LESSONS.md` to prevent future regressions. |
| `react-best-practices` | Developer | A strict set of frontend execution rules the Developer must follow during implementation. <mark>*(Note: This skill serves as a template and must be customized by the human according to the specific tech stack being used.)*</mark> |
| `vibe-code-review` | QA/Architect | Runs distinct review modes (Quick Scan, Deep Audit) to validate code against Acceptance Criteria and Architecture rules. |
| `write-skill` | Lead | Allows the Team Lead to autonomously write and deploy entirely *new* skills if the team repeatedly encounters a novel problem. |

---

## ⚙️ A Skill-Driven Methodology

V-Bounce OS enforces a strict hierarchy. No code is written without a plan, and no task is executed without invoking the proper skills.

### 1. Planning Layer
You use the bundled templates to define the work.
`Charter ➔ Roadmap ➔ Epic ➔ Story`

### 2. The Bounce Loop (Implementation)
Once a Story is ready, you kick off the AI sprint.
1. The **Developer** AI writes the code and submits an Implementation Report.
2. The **QA** AI reads the report and tests it against the Story's requirements. If it fails, it bounces back. (Max 3 attempts before escalating to you).
3. The **Architect** AI audits the successful QA build against your Safe Zone and Architecture Decision Records (ADRs).
4. Only when both gates pass does the **DevOps** AI merge the isolated worktree into your main branch.

### 3. End of Sprint Reports
When a sprint concludes, V-Bounce OS generates structured reports so human reviewers can audit the work without reading every line of code:
- **Sprint Report**: A comprehensive summary by the Team Lead detailing what was delivered, execution metrics, story results, and a retro of what went wrong.
- **Sprint Release Report**: The DevOps agent's log of the merge process to the main branch, environment changes, and post-merge test validations.
- **Scribe Report**: The Scribe agent's complete audit of which product documentation files were generated, updated, or removed (using `vdoc`) to map the new codebase reality.

### 4. Progressive Learning (`LESSONS.md`)
Every time the AI makes a mistake during the Bounce Loop, it flags the issue. During the sprint retrospective, these mistakes are recorded in `LESSONS.md`—a permanent project memory that all agents read *before* writing any future code. **Your AI gets smarter about your specific codebase with every single sprint.**

---

## 🔍 Keywords for Searchability
`ai coding agent` `claude code` `cursor` `github copilot` `gemini` `openai codex` `software development lifecycle` `sdlc` `ai software engineer` `autonomous coding` `agentic framework` `software architecture` `ai team` `vdoc` `ai documentation` `prompt engineering`

---

## 📖 Documentation
- [How to structure an Epic](templates/epic.md)
- [How the Bounce Loop handles Hotfixes](docs/HOTFIX_EDGE_CASES.md)
- [Integrating with vdoc](https://github.com/sandrinio/vdoc)

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page]().

## 📝 License
This project is [MIT](LICENSE) licensed.
