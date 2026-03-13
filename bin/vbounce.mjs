#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

import { execSync, spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkgRoot = path.join(__dirname, '..');

const args = process.argv.slice(2);
const command = args[0];
const sub = args[1];

if (command === '-v' || command === '--version') {
  const pkgPath = path.join(pkgRoot, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkgInfo = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    console.log(`v${pkgInfo.version}`);
  } else {
    console.log('Version information unavailable.');
  }
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Script runner helper
// ---------------------------------------------------------------------------

/**
 * Run a Node.js script from the scripts/ directory with forwarded args.
 * @param {string} scriptName - filename inside scripts/ (e.g. 'doctor.mjs')
 * @param {string[]} scriptArgs - additional CLI arguments
 */
function runScript(scriptName, scriptArgs = []) {
  const scriptPath = path.join(pkgRoot, 'scripts', scriptName);
  if (!fs.existsSync(scriptPath)) {
    console.error(`Error: Script not found: scripts/${scriptName}`);
    console.error('Run `vbounce doctor` to check which scripts are missing.');
    process.exit(1);
  }
  const result = spawnSync(process.execPath, [scriptPath, ...scriptArgs], {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  process.exit(result.status ?? 0);
}

// ---------------------------------------------------------------------------
// Utility for interactive prompt (used by install)
// ---------------------------------------------------------------------------
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

// ---------------------------------------------------------------------------
// Help text
// ---------------------------------------------------------------------------

function displayHelp() {
  console.log(`
V-Bounce Engine CLI

Usage:
  vbounce install <platform>           Install V-Bounce Engine into a project
  vbounce state show                   Show current sprint state
  vbounce state update <storyId> <state|--qa-bounce>
  vbounce sprint init <sprintId> <deliveryId> [--stories STORY-001,...]
  vbounce sprint close <sprintId>
  vbounce story complete <storyId> [options]
  vbounce validate report <file>       Validate agent report YAML
  vbounce validate state               Validate state.json
  vbounce validate sprint [file]       Validate Sprint Plan
  vbounce validate ready <storyId>     Pre-bounce gate check
  vbounce prep qa <storyId>            Generate QA context pack
  vbounce prep arch <storyId>          Generate Architect context pack
  vbounce prep sprint <sprintId>       Generate Sprint context pack
  vbounce docs match --story <ID>      Match story scope against vdoc manifest
  vbounce docs check <sprintId>        Detect stale vdocs and generate Scribe task
  vbounce trends                       Cross-sprint trend analysis
  vbounce suggest <sprintId>           Generate improvement suggestions
  vbounce doctor                       Validate all configs and state files

Install Platforms:
  claude  : Installs CLAUDE.md and Claude Code subagents
  cursor  : Installs modular .cursor/rules/
  gemini  : Installs GEMINI.md and Antigravity skills
  codex   : Installs AGENTS.md for OpenAI Codex
  vscode  : Installs standard system prompt for Copilot
  copilot : Alias for vscode
`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Route commands
// ---------------------------------------------------------------------------

if (!command || command === 'help' || command === '--help' || command === '-h') {
  rl.close();
  displayHelp();
}

// -- state --
if (command === 'state') {
  rl.close();
  if (sub === 'show') {
    runScript('update_state.mjs', ['--show']);
  } else if (sub === 'update') {
    // vbounce state update <storyId> <newState|--qa-bounce>
    runScript('update_state.mjs', args.slice(2));
  } else {
    console.error(`Unknown state subcommand: ${sub}`);
    console.error('Usage: vbounce state show | vbounce state update <storyId> <state|--qa-bounce>');
    process.exit(1);
  }
}

// -- sprint --
if (command === 'sprint') {
  rl.close();
  if (sub === 'init') {
    runScript('init_sprint.mjs', args.slice(2));
  } else if (sub === 'close') {
    runScript('close_sprint.mjs', args.slice(2));
  } else {
    console.error(`Unknown sprint subcommand: ${sub}`);
    console.error('Usage: vbounce sprint init <sprintId> <deliveryId> | vbounce sprint close <sprintId>');
    process.exit(1);
  }
}

// -- story --
if (command === 'story') {
  rl.close();
  if (sub === 'complete') {
    runScript('complete_story.mjs', args.slice(2));
  } else {
    console.error(`Unknown story subcommand: ${sub}`);
    console.error('Usage: vbounce story complete <storyId> [options]');
    process.exit(1);
  }
}

// -- validate --
if (command === 'validate') {
  rl.close();
  if (sub === 'report') {
    runScript('validate_report.mjs', args.slice(2));
  } else if (sub === 'state') {
    runScript('validate_state.mjs', args.slice(2));
  } else if (sub === 'sprint') {
    runScript('validate_sprint_plan.mjs', args.slice(2));
  } else if (sub === 'ready') {
    runScript('validate_bounce_readiness.mjs', args.slice(2));
  } else {
    console.error(`Unknown validate subcommand: ${sub}`);
    console.error('Usage: vbounce validate report <file> | state | sprint [file] | ready <storyId>');
    process.exit(1);
  }
}

// -- prep --
if (command === 'prep') {
  rl.close();
  if (sub === 'qa') {
    runScript('prep_qa_context.mjs', args.slice(2));
  } else if (sub === 'arch') {
    runScript('prep_arch_context.mjs', args.slice(2));
  } else if (sub === 'sprint') {
    runScript('prep_sprint_context.mjs', args.slice(2));
  } else {
    console.error(`Unknown prep subcommand: ${sub}`);
    console.error('Usage: vbounce prep qa <storyId> | arch <storyId> | sprint <sprintId>');
    process.exit(1);
  }
}

// -- trends --
if (command === 'trends') {
  rl.close();
  runScript('sprint_trends.mjs', args.slice(1));
}

// -- suggest --
if (command === 'suggest') {
  rl.close();
  runScript('suggest_improvements.mjs', args.slice(1));
}

// -- docs --
if (command === 'docs') {
  rl.close();
  if (sub === 'match') {
    runScript('vdoc_match.mjs', args.slice(2));
  } else if (sub === 'check') {
    runScript('vdoc_staleness.mjs', args.slice(2));
  } else {
    console.error(`Unknown docs subcommand: ${sub}`);
    console.error('Usage: vbounce docs match --story <ID> | vbounce docs check <sprintId>');
    process.exit(1);
  }
}

// -- doctor --
if (command === 'doctor') {
  rl.close();
  runScript('doctor.mjs', args.slice(1));
}

// ---------------------------------------------------------------------------
// install command (original functionality)
// ---------------------------------------------------------------------------

if (command === 'install') {
  const targetPlatform = sub?.toLowerCase();

  if (!targetPlatform) {
    rl.close();
    displayHelp();
  }

  const CWD = process.cwd();

  // Map vbounce platform names to vdoc platform names
  const vdocPlatformMap = {
    claude: 'claude',
    cursor: 'cursor',
    gemini: 'gemini',
    codex: 'agents',
    vscode: 'vscode',
    copilot: 'vscode'
  };

  const platformMappings = {
    claude: [
      { src: 'brains/CLAUDE.md', dest: 'CLAUDE.md' },
      { src: 'brains/claude-agents', dest: '.claude/agents' },
      { src: 'templates', dest: 'templates' },
      { src: 'skills', dest: 'skills' },
      { src: 'scripts', dest: 'scripts' }
    ],
    cursor: [
      { src: 'brains/cursor-rules', dest: '.cursor/rules' },
      { src: 'templates', dest: 'templates' },
      { src: 'skills', dest: 'skills' },
      { src: 'scripts', dest: 'scripts' }
    ],
    gemini: [
      { src: 'brains/GEMINI.md', dest: 'GEMINI.md' },
      { src: 'templates', dest: 'templates' },
      { src: 'skills', dest: 'skills' },
      { src: 'skills', dest: '.agents/skills' },
      { src: 'scripts', dest: 'scripts' }
    ],
    codex: [
      { src: 'brains/AGENTS.md', dest: 'AGENTS.md' },
      { src: 'templates', dest: 'templates' },
      { src: 'skills', dest: 'skills' },
      { src: 'scripts', dest: 'scripts' }
    ],
    vscode: [
      { src: 'brains/CLAUDE.md', dest: '.github/copilot-instructions.md' },
      { src: 'templates', dest: 'templates' },
      { src: 'skills', dest: 'skills' },
      { src: 'scripts', dest: 'scripts' }
    ],
    copilot: [
      { src: 'brains/CLAUDE.md', dest: '.github/copilot-instructions.md' },
      { src: 'templates', dest: 'templates' },
      { src: 'skills', dest: 'skills' },
      { src: 'scripts', dest: 'scripts' }
    ]
  };

  const mapping = platformMappings[targetPlatform];

  if (!mapping) {
    rl.close();
    console.error(`Error: Unsupported platform '${targetPlatform}'.\n`);
    displayHelp();
  }

  console.log(`\n🚀 Preparing to install V-Bounce Engine for \x1b[36m${targetPlatform}\x1b[0m...\n`);

  const toCopy = [];
  const toOverwrite = [];

  mapping.forEach(rule => {
    const sourcePath = path.join(pkgRoot, rule.src);
    const destPath = path.join(CWD, rule.dest);

    if (!fs.existsSync(sourcePath)) {
      return; // Source does not exist internally, skip
    }

    if (fs.existsSync(destPath)) {
      toOverwrite.push(rule.dest);
    } else {
      toCopy.push(rule.dest);
    }
  });

  if (toCopy.length > 0) {
    console.log('The following will be \x1b[32mCREATED\x1b[0m:');
    toCopy.forEach(f => console.log(`  + ${f}`));
  }

  if (toOverwrite.length > 0) {
    console.log('\nThe following will be \x1b[33mOVERWRITTEN\x1b[0m:');
    toOverwrite.forEach(f => console.log(`  ! ${f}`));
  }

  console.log('');

  askQuestion('Proceed with installation? [y/N] ').then(async answer => {
    rl.close();
    const confirmation = answer.trim().toLowerCase();

    if (confirmation !== 'y' && confirmation !== 'yes') {
      console.log('\n❌ Installation cancelled.\n');
      process.exit(0);
    }

    console.log('\n📦 Installing files...');

    mapping.forEach(rule => {
      const sourcePath = path.join(pkgRoot, rule.src);
      const destPath = path.join(CWD, rule.dest);

      if (!fs.existsSync(sourcePath)) return;

      const stats = fs.statSync(sourcePath);
      if (stats.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        fs.cpSync(sourcePath, destPath, { recursive: true, force: true });
      } else {
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(sourcePath, destPath);
      }
      console.log(`  \x1b[32m✓\x1b[0m ${rule.dest}`);
    });

    console.log('\n⚙️  Installing dependencies...');
    try {
      const deps = ['js-yaml', 'marked', 'commander'];
      console.log(`  Running: npm install ${deps.join(' ')}`);
      execSync(`npm install ${deps.join(' ')}`, { stdio: 'inherit', cwd: CWD });
      console.log('  \x1b[32m✓\x1b[0m Dependencies installed.');
    } catch (err) {
      console.error('  \x1b[31m✖\x1b[0m Failed to install dependencies. You may need to run it manually.');
    }

    // vdoc integration
    const vdocPlatform = vdocPlatformMap[targetPlatform];
    if (vdocPlatform) {
      const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout });
      const vdocAnswer = await new Promise(resolve => rl2.question('\n📝 Install vdoc (AI-powered documentation generator)? [y/N] ', resolve));
      rl2.close();

      if (vdocAnswer.trim().toLowerCase() === 'y' || vdocAnswer.trim().toLowerCase() === 'yes') {
        console.log(`\n📝 Installing vdoc for ${vdocPlatform}...`);
        try {
          execSync(`npx @sandrinio/vdoc install ${vdocPlatform}`, { stdio: 'inherit', cwd: CWD });
          console.log('  \x1b[32m✓\x1b[0m vdoc installed.');
        } catch (err) {
          console.error(`  \x1b[31m✖\x1b[0m Failed to install vdoc. Run manually: npx @sandrinio/vdoc install ${vdocPlatform}`);
        }
      } else {
        console.log(`\n  Skipped. You can install later: npx @sandrinio/vdoc install ${vdocPlatform}`);
      }
    }

    console.log('\n✅ V-Bounce Engine successfully installed! Welcome to the team.\n');
  });

} else {
  // Unknown command fallthrough
  rl.close();
  console.error(`Unknown command: ${command}`);
  displayHelp();
}
