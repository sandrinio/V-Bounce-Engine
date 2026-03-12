#!/usr/bin/env node

/**
 * prep_sprint_context.mjs
 * Generates a sprint context pack — single file replacing 6+ separate reads.
 *
 * Usage:
 *   ./scripts/prep_sprint_context.mjs S-05
 *
 * Output: .bounce/sprint-context-S-05.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const sprintId = process.argv[2];
if (!sprintId) {
  console.error('Usage: prep_sprint_context.mjs S-XX');
  process.exit(1);
}

const MAX_CONTEXT_LINES = 200;

// 1. Read state.json (required)
const stateFile = path.join(ROOT, '.bounce', 'state.json');
if (!fs.existsSync(stateFile)) {
  console.error('ERROR: .bounce/state.json not found. Run: vbounce sprint init');
  process.exit(1);
}
const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));

// 2. Find sprint plan
const sprintNum = sprintId.replace('S-', '');
const sprintPlanPath = path.join(ROOT, 'product_plans', 'sprints', `sprint-${sprintNum}`, `sprint-${sprintNum}.md`);
if (!fs.existsSync(sprintPlanPath)) {
  console.error(`ERROR: Sprint plan not found at ${sprintPlanPath}`);
  process.exit(1);
}
const sprintPlan = fs.readFileSync(sprintPlanPath, 'utf8');

// Extract sprint goal from frontmatter
const goalMatch = sprintPlan.match(/sprint_goal:\s*"([^"]+)"/);
const sprintGoal = goalMatch ? goalMatch[1] : 'TBD';

// 3. Read LESSONS.md (first 50 lines)
const lessonsFile = path.join(ROOT, 'LESSONS.md');
let lessonsExcerpt = '_No LESSONS.md found_';
if (fs.existsSync(lessonsFile)) {
  const lines = fs.readFileSync(lessonsFile, 'utf8').split('\n');
  lessonsExcerpt = lines.slice(0, 50).join('\n');
  if (lines.length > 50) lessonsExcerpt += `\n\n_(${lines.length - 50} more lines — read LESSONS.md for full content)_`;
}

// 4. Find RISK_REGISTRY
let riskExcerpt = '_No RISK_REGISTRY.md found_';
const riskPaths = [
  path.join(ROOT, 'product_plans', 'strategy', 'RISK_REGISTRY.md'),
  path.join(ROOT, 'RISK_REGISTRY.md'),
];
for (const rp of riskPaths) {
  if (fs.existsSync(rp)) {
    const lines = fs.readFileSync(rp, 'utf8').split('\n');
    riskExcerpt = lines.slice(0, 20).join('\n');
    if (lines.length > 20) riskExcerpt += `\n\n_(${lines.length - 20} more lines — read RISK_REGISTRY.md for full content)_`;
    break;
  }
}

// 5. Build story state table from state.json
const storyRows = Object.entries(state.stories || {})
  .map(([id, s]) => `| ${id} | ${s.state} | ${s.qa_bounces} | ${s.arch_bounces} | ${s.worktree || '—'} |`)
  .join('\n');

// 6. vdoc summary (optional — graceful skip if no manifest)
let vdocSummary = '';
const manifestPath = path.join(ROOT, 'vdocs', '_manifest.json');
if (fs.existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const docCount = (manifest.documentation || []).length;
    const docList = (manifest.documentation || []).slice(0, 10)
      .map(d => `| ${d.filepath} | ${d.title} | ${(d.tags || []).slice(0, 4).join(', ')} | ${(d.deps || []).join(', ') || '—'} |`)
      .join('\n');
    vdocSummary = [
      `## Product Documentation (vdoc)`,
      `> ${docCount} feature doc(s) available in vdocs/`,
      '',
      `| Doc | Title | Tags | Dependencies |`,
      `|-----|-------|------|-------------|`,
      docList,
    ].join('\n');
  } catch { /* skip on parse error */ }
}

// 7. Assemble context pack
const lines = [
  `# Sprint Context: ${sprintId}`,
  `> Generated: ${new Date().toISOString().split('T')[0]} | Sprint: ${sprintId} | Delivery: ${state.delivery_id}`,
  '',
  `## Sprint Plan Summary`,
  `- **Goal**: ${sprintGoal}`,
  `- **Phase**: ${state.phase || 'N/A'}`,
  `- **Last action**: ${state.last_action || 'N/A'}`,
  `- **Stories**: ${Object.keys(state.stories || {}).length}`,
  '',
  `## Current State`,
  `| Story | State | QA Bounces | Arch Bounces | Worktree |`,
  `|-------|-------|------------|--------------|----------|`,
  storyRows || '| (no stories) | — | — | — | — |',
  '',
  ...(vdocSummary ? [vdocSummary, ''] : []),
  `## Relevant Lessons`,
  lessonsExcerpt,
  '',
  `## Risk Summary`,
  riskExcerpt,
];

const output = lines.join('\n');
const outputLines = output.split('\n');

let finalOutput = output;
let truncated = false;
if (outputLines.length > MAX_CONTEXT_LINES) {
  finalOutput = outputLines.slice(0, MAX_CONTEXT_LINES).join('\n');
  finalOutput += `\n\n> ⚠ Context pack truncated at ${MAX_CONTEXT_LINES} lines (was ${outputLines.length}). Read source files for complete content.`;
  truncated = true;
}

// 7. Write output
const outputFile = path.join(ROOT, '.bounce', `sprint-context-${sprintId}.md`);
fs.writeFileSync(outputFile, finalOutput);

console.log(`✓ Sprint context pack written to .bounce/sprint-context-${sprintId}.md`);
if (truncated) console.warn(`  ⚠  Content was truncated (exceeded ${MAX_CONTEXT_LINES} lines)`);
console.log(`  Stories: ${Object.keys(state.stories || {}).length} | Phase: ${state.phase || 'N/A'}`);
