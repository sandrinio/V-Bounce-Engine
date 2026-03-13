# V-Bounce Engine — GitHub Copilot Instructions

This project uses **V-Bounce Engine** — a structured AI-agent development framework.

## What This Means for You

You are operating in Tier 4 (Awareness) mode. You understand the project uses V-Bounce Engine but you do not orchestrate agents.

## Key Behaviors

1. **When editing planning documents** (`product_plans/**/*.md`): follow the templates in `templates/`. Do not change section numbering or YAML frontmatter structure.

2. **When editing agent reports** (`.bounce/reports/**/*.md`): YAML frontmatter is mandatory. Never remove it.

3. **When asked about project state**: suggest running `vbounce state show` or reading `.bounce/state.json`.

4. **When creating new stories or epics**: use `templates/story.md` and `templates/epic.md`.

## CLI Commands

```bash
vbounce state show            # current sprint state
vbounce validate report <f>   # validate a report file
vbounce doctor                # project health check
vbounce prep qa STORY-ID      # generate QA context
```

## Document Hierarchy

Charter → Roadmap → Epic → Story → Sprint Plan → Delivery Plan

Never skip levels. Stories must trace back to an Epic. Sprints must reference a Delivery Plan.

## Report Format

All agent reports must start with YAML frontmatter:
```yaml
---
status: "PASS" | "FAIL"
tokens_used: {number}
# ... agent-specific fields
---
```

## Critical Rules

- Read `LESSONS.md` before modifying code in this project
- No gold-plating — implement exactly what the Story specifies
- Follow the Safe Zone — no new patterns without Architect approval
