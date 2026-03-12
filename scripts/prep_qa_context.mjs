#!/usr/bin/env node

/**
 * prep_qa_context.mjs
 * Generates a QA context pack for a story.
 *
 * Usage:
 *   ./scripts/prep_qa_context.mjs STORY-005-02
 *
 * Output: .bounce/qa-context-STORY-005-02.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const storyId = process.argv[2];
if (!storyId) {
  console.error('Usage: prep_qa_context.mjs STORY-ID');
  process.exit(1);
}

const MAX_CONTEXT_LINES = 300;

function findFilesMatching(dir, pattern) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) results.push(...findFilesMatching(full, pattern));
    else if (pattern.test(e.name)) results.push(full);
  }
  return results;
}

// 1. Find dev report (required)
const devReportPattern = new RegExp(`${storyId.replace(/[-]/g, '[-]')}.*-dev\\.md$`);
const searchDirs = [
  path.join(ROOT, '.worktrees', storyId, '.bounce', 'reports'),
  path.join(ROOT, '.bounce', 'reports'),
  path.join(ROOT, '.bounce', 'archive'),
];
let devReport = null;
for (const dir of searchDirs) {
  const matches = findFilesMatching(dir, devReportPattern);
  if (matches.length > 0) { devReport = matches[0]; break; }
}

if (!devReport) {
  console.error(`ERROR: Dev report not found for ${storyId}. Searched in:`);
  searchDirs.forEach(d => console.error(`  - ${d}`));
  process.exit(1);
}

// Parse dev report frontmatter
let devFm = {};
try {
  const devContent = fs.readFileSync(devReport, 'utf8');
  const fmMatch = devContent.match(/^---\s*\n([\s\S]*?)\n---/);
  if (fmMatch) devFm = yaml.load(fmMatch[1]) || {};
} catch (e) {
  console.error(`ERROR: Dev report has invalid YAML frontmatter — ${e.message}`);
  process.exit(1);
}

// 2. Find story spec (required)
const storySpecPattern = new RegExp(`${storyId.replace(/[-]/g, '[-]')}.*\\.md$`);
const storySpecMatches = findFilesMatching(path.join(ROOT, 'product_plans'), storySpecPattern);
if (storySpecMatches.length === 0) {
  console.error(`ERROR: Story spec not found for ${storyId} in product_plans/`);
  process.exit(1);
}
const storySpecFile = storySpecMatches[0];
const storyContent = fs.readFileSync(storySpecFile, 'utf8');

// Extract §2 acceptance criteria
const criteriaMatch = storyContent.match(/##\s*(2\.|§2|The Truth|Acceptance)[^\n]*\n([\s\S]*?)(?=\n##|\n---|\Z)/i);
const criteriaSection = criteriaMatch ? criteriaMatch[2].trim().split('\n').slice(0, 30).join('\n') : '_Could not extract §2 — read story spec directly_';

// 3. Read LESSONS.md
const lessonsFile = path.join(ROOT, 'LESSONS.md');
let lessonsExcerpt = '_No LESSONS.md found_';
if (fs.existsSync(lessonsFile)) {
  const lines = fs.readFileSync(lessonsFile, 'utf8').split('\n');
  lessonsExcerpt = lines.slice(0, 30).join('\n');
  if (lines.length > 30) lessonsExcerpt += `\n_(+${lines.length - 30} more lines)_`;
}

// 4. Format files modified list
const filesModified = Array.isArray(devFm.files_modified)
  ? devFm.files_modified.map(f => `- ${f}`).join('\n')
  : '_Not specified in dev report_';

// 5. vdoc context (optional — graceful skip if no manifest)
let vdocSection = '';
const vdocMatchScript = path.join(__dirname, 'vdoc_match.mjs');
if (fs.existsSync(vdocMatchScript) && fs.existsSync(path.join(ROOT, 'vdocs', '_manifest.json'))) {
  try {
    const modifiedFiles = Array.isArray(devFm.files_modified) ? devFm.files_modified.join(',') : '';
    const vdocArgs = [`--story`, storyId];
    if (modifiedFiles) vdocArgs.push('--files', modifiedFiles);
    vdocArgs.push('--context');
    const vdocOutput = execSync(`node "${vdocMatchScript}" ${vdocArgs.map(a => `"${a}"`).join(' ')}`, { cwd: ROOT, encoding: 'utf8', timeout: 10000 }).trim();
    if (vdocOutput && !vdocOutput.includes('No vdoc matches')) {
      vdocSection = vdocOutput;
    }
  } catch { /* vdoc matching failed — skip silently */ }
}

// 6. Assemble context pack
const lines = [
  `# QA Context: ${storyId}`,
  `> Generated: ${new Date().toISOString().split('T')[0]}`,
  `> Dev report: ${path.relative(ROOT, devReport)}`,
  `> Story spec: ${path.relative(ROOT, storySpecFile)}`,
  '',
  `## Dev Report Summary`,
  `| Field | Value |`,
  `|-------|-------|`,
  `| Status | ${devFm.status || '—'} |`,
  `| Correction Tax | ${devFm.correction_tax || '—'} |`,
  `| Tests Written | ${devFm.tests_written ?? '—'} |`,
  `| Lessons Flagged | ${devFm.lessons_flagged || 'none'} |`,
  '',
  `## Story Acceptance Criteria (§2)`,
  criteriaSection,
  '',
  `## Files Modified`,
  filesModified,
  '',
  ...(vdocSection ? [vdocSection, ''] : []),
  `## Relevant Lessons`,
  lessonsExcerpt,
];

const output = lines.join('\n');
const outputLines = output.split('\n');
let finalOutput = output;
if (outputLines.length > MAX_CONTEXT_LINES) {
  finalOutput = outputLines.slice(0, MAX_CONTEXT_LINES).join('\n');
  finalOutput += `\n\n> ⚠ Truncated at ${MAX_CONTEXT_LINES} lines. Read source files for complete content.`;
}

const outputFile = path.join(ROOT, '.bounce', `qa-context-${storyId}.md`);
fs.writeFileSync(outputFile, finalOutput);
console.log(`✓ QA context pack written to .bounce/qa-context-${storyId}.md`);
