#!/usr/bin/env node

/**
 * vdoc_match.mjs
 * Reads vdocs/_manifest.json and matches story scope against doc tags,
 * descriptions, and key files. Returns relevant doc paths and blast radius.
 *
 * Usage:
 *   ./scripts/vdoc_match.mjs --story STORY-005-02
 *   ./scripts/vdoc_match.mjs --files "src/auth/index.ts,src/middleware/auth.ts"
 *   ./scripts/vdoc_match.mjs --keywords "authentication,jwt,login"
 *
 * Output: JSON to stdout, human-readable to stderr
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ── Config ────────────────────────────────────────────────────────

const configPath = path.join(ROOT, 'vbounce.config.json');
const config = fs.existsSync(configPath)
  ? JSON.parse(fs.readFileSync(configPath, 'utf8'))
  : {};

const MAX_MATCHES = config.vdocMaxMatches || 3;
const VDOCS_DIR = path.join(ROOT, 'vdocs');
const MANIFEST_PATH = path.join(VDOCS_DIR, '_manifest.json');
const SLICES_DIR = path.join(VDOCS_DIR, '_slices');

// ── Parse args ────────────────────────────────────────────────────

const args = process.argv.slice(2);
let storyId = null;
let inputFiles = [];
let inputKeywords = [];
let outputFormat = 'human'; // human | json | context

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--story':   storyId = args[++i]; break;
    case '--files':   inputFiles = args[++i].split(',').map(f => f.trim()); break;
    case '--keywords': inputKeywords = args[++i].split(',').map(k => k.trim().toLowerCase()); break;
    case '--json':    outputFormat = 'json'; break;
    case '--context': outputFormat = 'context'; break;
  }
}

if (!storyId && inputFiles.length === 0 && inputKeywords.length === 0) {
  console.error('Usage: vdoc_match.mjs --story STORY-ID | --files "f1,f2" | --keywords "k1,k2"');
  console.error('  --json     Output JSON to stdout');
  console.error('  --context  Output context-pack markdown to stdout');
  process.exit(1);
}

// ── Load manifest ─────────────────────────────────────────────────

if (!fs.existsSync(MANIFEST_PATH)) {
  if (outputFormat === 'json') {
    console.log(JSON.stringify({ matches: [], blastRadius: [], reason: 'no_manifest' }));
  } else {
    console.error('No vdocs/_manifest.json found — skipping vdoc matching');
  }
  process.exit(0); // Graceful no-op
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
const docs = manifest.documentation || [];

// ── Extract search terms from story ───────────────────────────────

if (storyId) {
  // Find story spec to extract keywords and file references
  const storyPattern = new RegExp(storyId.replace(/[-]/g, '[-]'));
  const storyFiles = findFiles(path.join(ROOT, 'product_plans'), storyPattern);

  if (storyFiles.length > 0) {
    const storyContent = fs.readFileSync(storyFiles[0], 'utf8').toLowerCase();

    // Extract file paths mentioned in the story
    const fileRefs = storyContent.match(/(?:src|lib|app|pages|components|api|services|scripts)\/[^\s,)'"]+/g) || [];
    inputFiles.push(...fileRefs);

    // Extract tags from story frontmatter
    const tagMatch = storyContent.match(/tags:\s*\[([^\]]+)\]/);
    if (tagMatch) {
      inputKeywords.push(...tagMatch[1].split(',').map(t => t.trim().replace(/['"]/g, '')));
    }

    // Use story name parts as keywords
    const nameParts = storyId.split('-').slice(3).join('-').replace(/_/g, ' ').split(/\s+/);
    inputKeywords.push(...nameParts.filter(p => p.length > 2));
  }
}

// ── Score each doc ────────────────────────────────────────────────

const scored = docs.map(doc => {
  let score = 0;
  const reasons = [];

  // 1. File path overlap (strongest signal)
  const docKeyFiles = extractKeyFiles(doc);
  const fileOverlap = inputFiles.filter(f => docKeyFiles.some(kf => kf.includes(f) || f.includes(kf)));
  if (fileOverlap.length > 0) {
    score += fileOverlap.length * 10;
    reasons.push(`file overlap: ${fileOverlap.join(', ')}`);
  }

  // 2. Tag match
  const docTags = (doc.tags || []).map(t => t.toLowerCase());
  const tagOverlap = inputKeywords.filter(k => docTags.includes(k));
  if (tagOverlap.length > 0) {
    score += tagOverlap.length * 5;
    reasons.push(`tag match: ${tagOverlap.join(', ')}`);
  }

  // 3. Description keyword match
  const desc = (doc.description || '').toLowerCase();
  const descMatches = inputKeywords.filter(k => desc.includes(k));
  if (descMatches.length > 0) {
    score += descMatches.length * 3;
    reasons.push(`description match: ${descMatches.join(', ')}`);
  }

  // 4. Title keyword match
  const title = (doc.title || '').toLowerCase();
  const titleMatches = inputKeywords.filter(k => title.includes(k));
  if (titleMatches.length > 0) {
    score += titleMatches.length * 2;
    reasons.push(`title match: ${titleMatches.join(', ')}`);
  }

  return { ...doc, score, reasons };
}).filter(d => d.score > 0).sort((a, b) => b.score - a.score);

// ── Top matches ───────────────────────────────────────────────────

const topMatches = scored.slice(0, MAX_MATCHES);

// ── Blast radius (deps of matched docs) ──────────────────────────

const matchedFeatures = new Set(topMatches.map(d => d.title));
const blastRadius = [];

for (const match of topMatches) {
  const deps = match.deps || [];
  for (const dep of deps) {
    if (!matchedFeatures.has(dep)) {
      const depDoc = docs.find(d => d.title === dep || d.filepath.toLowerCase().includes(dep.toLowerCase().replace(/\s+/g, '_')));
      if (depDoc) {
        blastRadius.push({ feature: dep, doc: depDoc.filepath, triggeredBy: match.title });
      } else {
        blastRadius.push({ feature: dep, doc: null, triggeredBy: match.title });
      }
    }
  }
}

// ── Output ────────────────────────────────────────────────────────

const result = {
  matches: topMatches.map(d => ({
    filepath: d.filepath,
    title: d.title,
    score: d.score,
    reasons: d.reasons,
    deps: d.deps || [],
  })),
  blastRadius,
};

if (outputFormat === 'json') {
  console.log(JSON.stringify(result, null, 2));
} else if (outputFormat === 'context') {
  // Output context-pack markdown using slices where available
  if (topMatches.length === 0) {
    console.log('<!-- No vdoc matches found -->');
  } else {
    console.log('## vdoc Context');
    console.log('');
    for (const match of topMatches) {
      const sliceName = match.filepath.replace(/_DOC\.md$/, '_SLICE.md').replace(/\.md$/, '_SLICE.md');
      const slicePath = path.join(SLICES_DIR, sliceName);
      const fullPath = path.join(VDOCS_DIR, match.filepath);

      if (fs.existsSync(slicePath)) {
        console.log(fs.readFileSync(slicePath, 'utf8'));
      } else if (fs.existsSync(fullPath)) {
        // Fallback: extract Overview section from full doc
        const content = fs.readFileSync(fullPath, 'utf8');
        const overviewMatch = content.match(/## Overview\s*\n(?:<!--[^>]*-->\s*\n)?\s*([\s\S]*?)(?=\n---|\n##)/);
        if (overviewMatch) {
          console.log(`### ${match.title}`);
          console.log(overviewMatch[1].trim().split('\n').slice(0, 5).join('\n'));
          console.log('');
        }
      }
      console.log('');
    }

    if (blastRadius.length > 0) {
      console.log('### Blast Radius Warning');
      console.log('Changes to matched features may also affect:');
      for (const br of blastRadius) {
        console.log(`- **${br.feature}** (triggered by ${br.triggeredBy})${br.doc ? ` — see ${br.doc}` : ''}`);
      }
      console.log('');
    }
  }
} else {
  // Human-readable to stderr
  if (topMatches.length === 0) {
    console.error('No vdoc matches found for the given scope.');
  } else {
    console.error(`\n✓ ${topMatches.length} vdoc match(es) found:\n`);
    for (const match of topMatches) {
      console.error(`  ${match.filepath} (score: ${match.score})`);
      console.error(`    ${match.reasons.join(' | ')}`);
    }
    if (blastRadius.length > 0) {
      console.error(`\n⚠ Blast radius — also affected:`);
      for (const br of blastRadius) {
        console.error(`  ${br.feature} (via ${br.triggeredBy})`);
      }
    }
    console.error('');
  }
}

// ── Helpers ───────────────────────────────────────────────────────

function findFiles(dir, pattern) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) results.push(...findFiles(full, pattern));
    else if (pattern.test(e.name)) results.push(full);
  }
  return results;
}

function extractKeyFiles(doc) {
  // From manifest entry — check if keyFiles exist in frontmatter-style
  const files = [];
  if (doc.keyFiles) files.push(...doc.keyFiles);

  // Also try reading the doc to get Key Files table
  const docPath = path.join(VDOCS_DIR, doc.filepath);
  if (fs.existsSync(docPath)) {
    const content = fs.readFileSync(docPath, 'utf8');
    const keyFilesMatch = content.match(/## Key Files[\s\S]*?\|[^|]+\|[^|]+\|[^|]+\|([\s\S]*?)(?=\n---|\n##)/);
    if (keyFilesMatch) {
      const rows = keyFilesMatch[1].split('\n').filter(r => r.includes('|'));
      for (const row of rows) {
        const cells = row.split('|').map(c => c.trim());
        const filePath = cells[1]?.replace(/`/g, '');
        if (filePath && filePath.includes('/')) files.push(filePath);
      }
    }
  }
  return files;
}
