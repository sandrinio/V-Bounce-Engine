#!/usr/bin/env node

/**
 * verify_framework.mjs
 * 
 * Tests the backward-compatibility of the AI agent prompts against
 * the strict YAML parsing schemas in validate_report.mjs.
 * 
 * Triggered manually by humans or automatically by CI when updating brains/.
 */

import fs from 'fs';
import path from 'path';

const AGENTS_DIR = path.join(process.cwd(), 'brains', 'claude-agents');

// The exact substring signatures that MUST exist in the agent instructions
// to ensure the LLM knows to output the correct YAML schema.
const EXPECTED_PROMPT_SIGNATURES = {
    'developer.md': [
        'status:',
        'correction_tax:',
        'tokens_used:',
        'tests_written:',
        'files_modified:',
        'lessons_flagged:'
    ],
    'qa.md': [
        'status: "PASS"',
        'bounce_count:',
        'bugs_found: 0',
        'gold_plating_detected:',
        'status: "FAIL"',
        'tokens_used:',
        'failed_scenarios:'
    ],
    'architect.md': [
        'status: "PASS"',
        'safe_zone_score:',
        'ai_isms_detected:',
        'regression_risk:',
        'status: "FAIL"',
        'bounce_count:',
        'tokens_used:',
        'critical_failures:'
    ],
    'devops.md': [
        'type: "story-merge"',
        'status:',
        'conflicts_detected:',
        'type: "sprint-release"',
        'tokens_used:',
        'version:'
    ],
    'scribe.md': [
        'mode:',
        'tokens_used:',
        'docs_created:',
        'docs_updated:',
        'docs_removed:'
    ]
};

function main() {
    console.log("===========================================");
    console.log(" V-Bounce Engine: Framework Integrity Check");
    console.log("===========================================\n");

    let hasErrors = false;

    if (!fs.existsSync(AGENTS_DIR)) {
        console.error(`ERROR: ${AGENTS_DIR} not found.`);
        process.exit(1);
    }

    const files = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));

    for (const file of files) {
        const filePath = path.join(AGENTS_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        const requiredSignatures = EXPECTED_PROMPT_SIGNATURES[file];
        if (!requiredSignatures) {
            console.log(`[PASS] ${file} (No strict YAML signatures required)`);
            continue;
        }

        let filePassed = true;
        for (const sig of requiredSignatures) {
            if (!content.includes(sig)) {
                console.error(`[FAIL] ${file} is missing required YAML instruction key: '${sig}'`);
                filePassed = false;
                hasErrors = true;
            }
        }

        // Check for general Rule 12 presence
        if (!content.includes('YAML frontmatter') && !content.includes('YAML Frontmatter')) {
            console.error(`[FAIL] ${file} appears to be missing the Rule 12 YAML Frontmatter instruction.`);
            filePassed = false;
            hasErrors = true;
        }

        if (filePassed) {
            console.log(`[PASS] ${file} contains all required YAML extraction signatures.`);
        }
    }

    console.log("\n-------------------------------------------");
    if (hasErrors) {
        console.error("❌ INTEGRITY CHECK FAILED.");
        console.error("Agent prompts have drifted from the validate_report.mjs schema.");
        console.error("Please fix the agent templates in brains/claude-agents/ to restore pipeline integrity.");
        process.exit(1);
    } else {
        console.log("✅ INTEGRITY CHECK PASSED.");
        console.log("All agent prompts strictly map to the required pipeline metadata schemas.");
        process.exit(0);
    }
}

main();
