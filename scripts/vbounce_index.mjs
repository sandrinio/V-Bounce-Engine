#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { connect } from '@lancedb/lancedb';
import { pipeline } from '@xenova/transformers';
import { marked } from 'marked';
import { program } from 'commander';

const LANCE_DIR = path.join(process.cwd(), '.bounce', '.lancedb');

program
    .name('vbounce_index')
    .description('Index V-Bounce OS documents into local LanceDB')
    .argument('[path]', 'File or directory path to index (or use --all)')
    .option('--all', 'Index all standard V-Bounce directories')
    .parse(process.argv);

const options = program.opts();
const targetPath = program.args[0];

// Initialize local embedding model wrapper
class LocalEmbeddingFunction {
    constructor() {
        this.modelName = 'Xenova/all-MiniLM-L6-v2';
        this.extractor = null;
    }

    async init() {
        if (!this.extractor) {
            console.log(`Loading embedding model (${this.modelName})...`);
            this.extractor = await pipeline('feature-extraction', this.modelName, {
                quantized: true,
            });
        }
    }

    async computeSourceEmbeddings(texts) {
        await this.init();
        const embeddings = [];
        for (const text of texts) {
            const output = await this.extractor(text, { pooling: 'mean', normalize: true });
            embeddings.push(Array.from(output.data));
        }
        return embeddings;
    }
}

// Function to chunk Markdown files semantically (simplified for MVP)
function chunkMarkdown(content, metadata) {
    const tokens = marked.lexer(content);
    const chunks = [];
    let currentHeader = 'General';
    let buffer = '';

    for (const token of tokens) {
        if (token.type === 'heading') {
            if (buffer.trim()) {
                chunks.push({ text: buffer.trim(), section: currentHeader, ...metadata });
            }
            currentHeader = token.text;
            buffer = `${token.raw}\n`;
        } else {
            buffer += `${token.raw}\n`;
        }
    }

    if (buffer.trim()) {
        chunks.push({ text: buffer.trim(), section: currentHeader, ...metadata });
    }

    return chunks;
}

async function indexFile(filePath, embedder) {
    console.log(`Processing file: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf-8');
    const basename = path.basename(filePath);

    let type = 'unknown';
    if (filePath.includes('LESSONS.md')) type = 'lesson';
    else if (filePath.includes('ROADMAP.md')) type = 'adr';
    else if (filePath.includes('.bounce/reports')) type = 'report';
    else if (filePath.includes('product_plans')) type = 'plan';
    else if (filePath.includes('vdocs')) type = 'documentation';

    const metadata = { file: basename, type };
    const chunks = chunkMarkdown(content, metadata);

    if (chunks.length === 0) return [];

    console.log(`  Extracted ${chunks.length} chunks. Generating embeddings...`);

    const textsToEmbed = chunks.map(c => `[${c.type} - ${c.file} - ${c.section}]\n${c.text}`);
    const vectors = await embedder.computeSourceEmbeddings(textsToEmbed);

    return chunks.map((chunk, i) => ({
        id: `${chunk.file}-${i}`,
        file: chunk.file,
        type: chunk.type,
        section: chunk.section,
        text: chunk.text,
        vector: vectors[i]
    }));
}

async function main() {
    if (!targetPath && !options.all) {
        console.error("Error: Must specify a path or use --all");
        process.exit(1);
    }

    const embedder = new LocalEmbeddingFunction();

    // Ensure table exists
    if (!fs.existsSync(LANCE_DIR)) {
        fs.mkdirSync(LANCE_DIR, { recursive: true });
    }

    const db = await connect(LANCE_DIR);
    let table;

    try {
        table = await db.openTable('vbounce_context');
    } catch (e) {
        // Table doesn't exist, will create dynamically on first insert
        console.log("Creating new vbounce_context table...");
    }

    const filesToIndex = [];

    function walkDir(dir) {
        if (!fs.existsSync(dir)) return;
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                walkDir(fullPath);
            } else if (fullPath.endsWith('.md')) {
                filesToIndex.push(fullPath);
            }
        }
    }

    if (options.all) {
        if (fs.existsSync('LESSONS.md')) filesToIndex.push('LESSONS.md');
        if (fs.existsSync('ROADMAP.md')) filesToIndex.push('ROADMAP.md');
        walkDir('product_plans');
        walkDir('vdocs');
        walkDir('.bounce/reports');
    } else if (targetPath) {
        const stat = fs.statSync(targetPath);
        if (stat.isFile()) {
            filesToIndex.push(targetPath);
        } else if (stat.isDirectory()) {
            walkDir(targetPath);
        }
    }

    if (filesToIndex.length === 0) {
        console.log("No files found to index.");
        process.exit(0);
    }

    let allRecords = [];
    for (const file of filesToIndex) {
        const records = await indexFile(file, embedder);
        allRecords = allRecords.concat(records);
    }

    if (allRecords.length > 0) {
        if (table) {
            console.log(`Adding ${allRecords.length} records to existing table...`);
            await table.add(allRecords);
        } else {
            console.log(`Creating table with ${allRecords.length} records...`);
            table = await db.createTable('vbounce_context', allRecords);
        }
        console.log(`Successfully indexed into LanceDB.`);
    }
}

main().catch(console.error);
