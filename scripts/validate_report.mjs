#!/usr/bin/env node

/**
 * validate_report.mjs
 * 
 * Strict YAML Frontmatter validation for V-Bounce OS Agent Reports.
 * Fails loudly if an agent hallucinates formatting or omits required fields,
 * so the orchestrator can bounce the prompt back.
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// Defined schemas for each report type
const SCHEMAS = {
    dev: ['status', 'correction_tax', 'tests_written', 'files_modified', 'lessons_flagged'],
    qa: {
        base: ['status', 'bounce_count', 'bugs_found', 'gold_plating_detected'],
        conditional: { 'FAIL': ['failed_scenarios'] }
    },
    arch: {
        base: ['status'],
        conditional: { 'PASS': ['safe_zone_score', 'ai_isms_detected', 'regression_risk'], 'FAIL': ['bounce_count', 'critical_failures'] }
    },
    devops: {
        base: ['type', 'status'],
        conditional: { 'story-merge': ['conflicts_detected'], 'sprint-release': ['version'] }
    }
};

function extractFrontmatter(content) {
    // Matches "---" at the start of the file or after whitespace
    const match = content.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*/);
    if (!match) {
        throw new Error('NO_FRONTMATTER: Report missing strict YAML --- delimiters at the top of the file.');
    }
    return match[1];
}

function validateDev(data) {
    const missing = SCHEMAS.dev.filter(k => !(k in data));
    if (missing.length > 0) throw new Error(`DEV_SCHEMA_ERROR: Missing required keys: ${missing.join(', ')}`);
    if (!Array.isArray(data.files_modified)) throw new Error(`DEV_SCHEMA_ERROR: 'files_modified' must be an array.`);
}

function validateQA(data) {
    const missing = SCHEMAS.qa.base.filter(k => !(k in data));
    if (missing.length > 0) throw new Error(`QA_SCHEMA_ERROR: Missing required keys: ${missing.join(', ')}`);

    if (data.status === 'FAIL') {
        const conditionalMissing = SCHEMAS.qa.conditional.FAIL.filter(k => !(k in data));
        if (conditionalMissing.length > 0) throw new Error(`QA_SCHEMA_ERROR: 'FAIL' status requires keys: ${conditionalMissing.join(', ')}`);
    }
}

function validateArch(data) {
    const missing = SCHEMAS.arch.base.filter(k => !(k in data));
    if (missing.length > 0) throw new Error(`ARCH_SCHEMA_ERROR: Missing required keys: ${missing.join(', ')}`);

    const s = data.status === 'PASS' ? 'PASS' : 'FAIL';
    const conditionalMissing = SCHEMAS.arch.conditional[s].filter(k => !(k in data));
    if (conditionalMissing.length > 0) throw new Error(`ARCH_SCHEMA_ERROR: '${s}' status requires keys: ${conditionalMissing.join(', ')}`);
}

function validateDevops(data) {
    const missing = SCHEMAS.devops.base.filter(k => !(k in data));
    if (missing.length > 0) throw new Error(`DEVOPS_SCHEMA_ERROR: Missing required keys: ${missing.join(', ')}`);

    const typeStr = String(data.type);
    if (SCHEMAS.devops.conditional[typeStr]) {
        const conditionalMissing = SCHEMAS.devops.conditional[typeStr].filter(k => !(k in data));
        if (conditionalMissing.length > 0) throw new Error(`DEVOPS_SCHEMA_ERROR: '${typeStr}' type requires keys: ${conditionalMissing.join(', ')}`);
    }
}

function main() {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error("Usage: validate_report.mjs <path-to-markdown-file>");
        process.exit(1);
    }

    const filename = path.basename(filePath);

    // Infer agent type from filename convention
    let agentType = 'unknown';
    if (filename.endsWith('-dev.md')) agentType = 'dev';
    else if (filename.endsWith('-qa.md')) agentType = 'qa';
    else if (filename.endsWith('-arch.md')) agentType = 'arch';
    else if (filename.endsWith('-devops.md')) agentType = 'devops';

    if (agentType === 'unknown') {
        console.error(`WARNING: Unrecognized report type for ${filename}. Ensure filename ends in -dev.md, -qa.md, -arch.md, or -devops.md.`);
        process.exit(0); // Soft pass, not an agent workflow report
    }

    try {
        const rawContent = fs.readFileSync(filePath, 'utf8');
        const yamlString = extractFrontmatter(rawContent);
        const data = yaml.load(yamlString);

        if (!data || typeof data !== 'object') {
            throw new Error("YAML_PARSE_ERROR: Frontmatter parsed to an empty or invalid object.");
        }

        if (agentType === 'dev') validateDev(data);
        if (agentType === 'qa') validateQA(data);
        if (agentType === 'arch') validateArch(data);
        if (agentType === 'devops') validateDevops(data);

        console.log(`VALID: ${filename} matches the ${agentType.toUpperCase()} schema.`);
        process.exit(0);

    } catch (error) {
        // We print specifically to stdout so automation scripts can capture the payload and bounce it back to the AI
        console.log(`VALIDATION_FAILED\n${error.message}`);
        process.exit(1);
    }
}

main();
