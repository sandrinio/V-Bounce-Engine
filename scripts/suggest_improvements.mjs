#!/usr/bin/env node

/**
 * suggest_improvements.mjs
 * Generates improvement suggestions from sprint trends + lessons.
 * Overwrites (not appends) to prevent stale suggestion accumulation.
 *
 * Usage:
 *   ./scripts/suggest_improvements.mjs S-05
 *
 * Output: .bounce/improvement-suggestions.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const sprintId = process.argv[2];
if (!sprintId) {
  console.error('Usage: suggest_improvements.mjs S-XX');
  process.exit(1);
}

const today = new Date().toISOString().split('T')[0];

// 1. Read trends if available
const trendsFile = path.join(ROOT, '.bounce', 'trends.md');
let trendsContent = null;
if (fs.existsSync(trendsFile)) {
  trendsContent = fs.readFileSync(trendsFile, 'utf8');
}

// 2. Read LESSONS.md
const lessonsFile = path.join(ROOT, 'LESSONS.md');
let lessonCount = 0;
let oldLessons = [];
if (fs.existsSync(lessonsFile)) {
  const lines = fs.readFileSync(lessonsFile, 'utf8').split('\n');
  // Count lessons by counting ### entries
  const lessonEntries = lines.filter(l => /^###\s+\[\d{4}-\d{2}-\d{2}\]/.test(l));
  lessonCount = lessonEntries.length;

  // Flag lessons older than 90 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  oldLessons = lessonEntries.filter(entry => {
    const dateMatch = entry.match(/\[(\d{4}-\d{2}-\d{2})\]/);
    if (dateMatch) {
      return new Date(dateMatch[1]) < cutoff;
    }
    return false;
  });
}

// 3. Read improvement-log for rejected items (to avoid re-suggesting)
const improvementLog = path.join(ROOT, '.bounce', 'improvement-log.md');
let rejectedItems = [];
if (fs.existsSync(improvementLog)) {
  const logContent = fs.readFileSync(improvementLog, 'utf8');
  // Simple extraction: look for table rows in "Rejected" section
  const rejectedMatch = logContent.match(/## Rejected\n[\s\S]*?(?=\n## |$)/);
  if (rejectedMatch) {
    rejectedItems = rejectedMatch[0].split('\n')
      .filter(l => l.startsWith('|') && !l.startsWith('| Sprint'))
      .map(l => l.split('|')[2]?.trim())
      .filter(Boolean);
  }
}

// 4. Parse sprint stats from trends
let lastSprintStats = null;
if (trendsContent) {
  const rows = trendsContent.split('\n').filter(l => l.match(/^\| S-\d{2} \|/));
  if (rows.length > 0) {
    const lastRow = rows[rows.length - 1].split('|').map(s => s.trim()).filter(Boolean);
    lastSprintStats = {
      sprintId: lastRow[0],
      stories: parseInt(lastRow[1]) || 0,
      firstPassRate: parseInt(lastRow[2]) || 100,
      avgBounces: parseFloat(lastRow[3]) || 0,
      avgTax: parseFloat(lastRow[4]) || 0,
    };
  }
}

const suggestions = [];
let itemNum = 1;

// 5. Generate suggestions based on data
if (lastSprintStats) {
  if (lastSprintStats.firstPassRate < 80) {
    suggestions.push({
      num: itemNum++,
      category: 'Process',
      title: `Low first-pass rate (${lastSprintStats.firstPassRate}%)`,
      detail: `First-pass rate was below 80% in ${lastSprintStats.sprintId}. This suggests spec ambiguity or insufficient context packs.`,
      recommendation: 'Add spec quality gate to `validate_bounce_readiness.mjs`: check Story §1 word count > 50 and §2 has ≥ 2 Gherkin scenarios.',
      target: 'scripts/validate_bounce_readiness.mjs',
      effort: 'Low',
    });
  }

  if (lastSprintStats.avgTax > 10) {
    suggestions.push({
      num: itemNum++,
      category: 'Process',
      title: `High correction tax (${lastSprintStats.avgTax}% average)`,
      detail: 'Average correction tax exceeded 10%, indicating significant human intervention was needed.',
      recommendation: 'Auto-flag stories with more than 3 files expected in Sprint Plan §2 Risk Flags. Consider splitting before bouncing.',
      target: 'skills/agent-team/SKILL.md Step 1',
      effort: 'Low',
    });
  }

  if (lastSprintStats.avgBounces > 0.5) {
    suggestions.push({
      num: itemNum++,
      category: 'Process',
      title: `High bounce rate (${lastSprintStats.avgBounces} avg per story)`,
      detail: 'Run `vbounce trends` to see root cause breakdown and identify recurring patterns.',
      recommendation: 'Review root_cause field in archived QA/Arch FAIL reports to identify systemic issues.',
      target: 'scripts/sprint_trends.mjs',
      effort: 'Low',
    });
  }
}

// Old lessons suggestion
if (oldLessons.length > 0) {
  const notRejected = oldLessons.filter(l => !rejectedItems.some(r => l.includes(r)));
  if (notRejected.length > 0) {
    suggestions.push({
      num: itemNum++,
      category: 'Framework',
      title: `${notRejected.length} lessons older than 90 days`,
      detail: notRejected.map(l => `  - ${l}`).join('\n'),
      recommendation: 'Review these lessons. Lessons not triggered in 3+ sprints should be archived to LESSONS_ARCHIVE.md. Lessons proven over 3+ sprints should be graduated to agent configs.',
      target: 'LESSONS.md',
      effort: 'Trivial',
    });
  }
}

// General framework suggestions
suggestions.push({
  num: itemNum++,
  category: 'Framework',
  title: 'Review lesson graduation candidates',
  detail: `You have ${lessonCount} lessons in LESSONS.md. Lessons proven over 3+ sprints should graduate to permanent agent config rules.`,
  recommendation: 'Run a review: which lessons have prevented recurrences for 3+ sprints? Graduate those to `.claude/agents/*.md` or `brains/claude-agents/*.md`.',
  target: 'LESSONS.md + brains/claude-agents/',
  effort: 'Low',
});

suggestions.push({
  num: itemNum++,
  category: 'Health',
  title: 'Run vbounce doctor',
  detail: 'Verify the V-Bounce Engine installation is healthy after this sprint.',
  recommendation: 'Run: `vbounce doctor` — checks brain files, templates, scripts, state.json validity.',
  target: 'scripts/doctor.mjs',
  effort: 'Trivial',
});

// 6. Format output
const suggestionBlocks = suggestions.map(s => {
  const rejectedNote = rejectedItems.some(r => s.title.includes(r)) ? '\n> ⚠ This was previously rejected — skipping.' : '';
  return `### ${s.num}. [${s.category}] ${s.title}${rejectedNote}
${s.detail}

**Recommendation:** ${s.recommendation}
**Target:** \`${s.target}\`
**Effort:** ${s.effort}`;
}).join('\n\n---\n\n');

const output = [
  `# Improvement Suggestions (post ${sprintId})`,
  `> Generated: ${today}. Review each item. Approved items are applied by the Lead at sprint boundary.`,
  `> Rejected items go to \`.bounce/improvement-log.md\` with reason.`,
  `> Applied items go to \`.bounce/improvement-log.md\` under Applied.`,
  '',
  suggestionBlocks || '_No suggestions generated — all metrics look healthy!_',
  '',
  '---',
  '',
  `## How to Apply`,
  `- **Approve** → Lead applies change, records in \`.bounce/improvement-log.md\` under Applied`,
  `- **Reject** → Record in \`.bounce/improvement-log.md\` under Rejected with reason`,
  `- **Defer** → Record in \`.bounce/improvement-log.md\` under Deferred`,
  '',
  `> Framework changes (brains/, skills/, templates/) are applied at sprint boundaries only — never mid-sprint.`,
].join('\n');

const outputFile = path.join(ROOT, '.bounce', 'improvement-suggestions.md');
fs.writeFileSync(outputFile, output); // overwrite, not append
console.log(`✓ Improvement suggestions written to .bounce/improvement-suggestions.md`);
console.log(`  ${suggestions.length} suggestion(s) generated`);
