#!/usr/bin/env node

/**
 * validate_bounce_readiness.mjs
 * Pre-bounce gate check — verifies a story is ready to bounce.
 *
 * Usage:
 *   ./scripts/validate_bounce_readiness.mjs STORY-005-02
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const storyId = process.argv[2];
if (!storyId) {
  console.error('Usage: validate_bounce_readiness.mjs STORY-ID');
  process.exit(1);
}

const errors = [];
const warnings = [];

// 1. Check state.json
const stateFile = path.join(ROOT, '.bounce', 'state.json');
if (!fs.existsSync(stateFile)) {
  errors.push('.bounce/state.json not found — run: vbounce sprint init S-XX D-XX');
} else {
  const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  if (!state.stories[storyId]) {
    errors.push(`Story "${storyId}" not found in state.json`);
  } else {
    const story = state.stories[storyId];
    if (story.state !== 'Ready to Bounce') {
      errors.push(`Story state is "${story.state}" — must be "Ready to Bounce" before bouncing`);
    }
  }
}

// 2. Find sprint plan
const sprintsDir = path.join(ROOT, 'product_plans', 'sprints');
let sprintPlanFound = false;
if (fs.existsSync(sprintsDir)) {
  const sprintDirs = fs.readdirSync(sprintsDir);
  for (const dir of sprintDirs) {
    const planFile = path.join(sprintsDir, dir, `${dir}.md`);
    if (fs.existsSync(planFile)) {
      sprintPlanFound = true;
      break;
    }
  }
}
if (!sprintPlanFound) {
  warnings.push('No active Sprint Plan found in product_plans/sprints/');
}

// 3. Find story spec
let storyFile = null;
function findFile(dir, id) {
  if (!fs.existsSync(dir)) return null;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      const found = findFile(path.join(dir, e.name), id);
      if (found) return found;
    } else if (e.name.includes(id)) {
      return path.join(dir, e.name);
    }
  }
  return null;
}

storyFile = findFile(path.join(ROOT, 'product_plans'), storyId);
if (!storyFile) {
  errors.push(`Story spec not found for "${storyId}" in product_plans/`);
} else {
  const storyContent = fs.readFileSync(storyFile, 'utf8');

  // Check for §1, §2, §3
  const hasSpec = /##\s*(1\.|§1|The Spec)/i.test(storyContent);
  const hasCriteria = /##\s*(2\.|§2|The Truth|Acceptance)/i.test(storyContent);
  const hasGuide = /##\s*(3\.|§3|Implementation)/i.test(storyContent);

  if (!hasSpec) errors.push(`Story ${storyId}: §1 (spec) section not found`);
  if (!hasCriteria) errors.push(`Story ${storyId}: §2 (acceptance criteria) section not found`);
  if (!hasGuide) errors.push(`Story ${storyId}: §3 (implementation guide) section not found`);

  // Check for minimum content in each section
  const specMatch = storyContent.match(/##\s*(1\.|§1|The Spec)[^\n]*\n([\s\S]*?)(?=\n##|\n---|\Z)/i);
  if (specMatch && specMatch[2].trim().length < 30) {
    warnings.push(`Story ${storyId}: §1 spec section appears very short — verify it's complete`);
  }
}

// 4. Check worktree
const worktreeDir = path.join(ROOT, '.worktrees', storyId);
if (!fs.existsSync(worktreeDir)) {
  warnings.push(`.worktrees/${storyId}/ not found — create with: git worktree add .worktrees/${storyId} -b story/${storyId} sprint/S-XX`);
}

// 5. vdoc impact check (warning only — never blocks bounce)
const manifestPath = path.join(ROOT, 'vdocs', '_manifest.json');
if (fs.existsSync(manifestPath) && storyFile) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const docs = manifest.documentation || [];
    const storyLower = fs.readFileSync(storyFile, 'utf8').toLowerCase();

    // Extract file paths mentioned in the story
    const storyFileRefs = storyLower.match(/(?:src|lib|app|pages|components|api|services|scripts)\/[^\s,)'"]+/g) || [];

    for (const doc of docs) {
      const docKeyFiles = (doc.keyFiles || []).map(f => f.toLowerCase());
      const overlap = docKeyFiles.filter(kf =>
        storyFileRefs.some(sf => sf.includes(kf) || kf.includes(sf))
      );
      if (overlap.length > 0) {
        warnings.push(`vdoc impact: ${doc.filepath} — key files overlap with story scope (${overlap.slice(0, 3).join(', ')}). Doc may need updating post-sprint.`);
        const deps = doc.deps || [];
        if (deps.length > 0) {
          warnings.push(`  ↳ Blast radius: ${deps.join(', ')} may also be affected`);
        }
      }
    }
  } catch { /* skip on manifest parse error */ }
}

// Print results
console.log(`Bounce readiness check: ${storyId}`);
console.log('');

if (errors.length === 0 && warnings.length === 0) {
  console.log(`✓ ${storyId} is READY TO BOUNCE`);
  process.exit(0);
}

if (warnings.length > 0) {
  warnings.forEach(w => console.warn(`  ⚠  ${w}`));
}

if (errors.length > 0) {
  errors.forEach(e => console.error(`  ✗ ${e}`));
  console.error(`\nNOT READY: Fix ${errors.length} error(s) before bouncing ${storyId}`);
  process.exit(1);
} else {
  console.log(`  ✓ ${storyId} is ready (with warnings)`);
  process.exit(0);
}
