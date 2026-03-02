#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { connect } from '@lancedb/lancedb';
import { pipeline } from '@xenova/transformers';
import { program } from 'commander';

const LANCE_DIR = path.join(process.cwd(), '.bounce', '.lancedb');

program
    .name('vbounce_ask')
    .description('Query V-Bounce OS LanceDB for relevant context')
    .argument('<query>', 'The semantic query to search for')
    .option('-f, --filter <field=value>', 'Filter by metadata (e.g., type=lesson)')
    .option('-l, --limit <number>', 'Number of results to return', 3)
    .parse(process.argv);

const options = program.opts();
const query = program.args[0];

class LocalEmbeddingFunction {
    constructor() {
        this.modelName = 'Xenova/all-MiniLM-L6-v2';
        this.extractor = null;
    }

    async init() {
        if (!this.extractor) {
            this.extractor = await pipeline('feature-extraction', this.modelName, {
                quantized: true,
            });
        }
    }

    async embedQuery(text) {
        await this.init();
        const output = await this.extractor(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
    }
}

async function main() {
    if (!query) {
        console.error("Error: Must provide a semantic query string.");
        process.exit(1);
    }

    if (!fs.existsSync(LANCE_DIR)) {
        console.error(`Error: LanceDB not found at ${LANCE_DIR}. Have you run vbounce_index yet?`);
        process.exit(1);
    }

    const db = await connect(LANCE_DIR);
    let table;
    try {
        table = await db.openTable('vbounce_context');
    } catch (e) {
        console.error("Error: Table 'vbounce_context' not found. Please index documents first.");
        process.exit(1);
    }

    const embedder = new LocalEmbeddingFunction();
    const queryVector = await embedder.embedQuery(query);

    let search = table.vectorSearch(queryVector).limit(parseInt(options.limit));

    if (options.filter) {
        const [field, value] = options.filter.split('=');
        // LanceDB JS uses SQL-like string criteria for filtering
        if (field === "type") {
            search = search.where(`\`type\` = '${value}'`);
        } else if (field === "section") {
            search = search.where(`\`section\` = '${value}'`);
        }
    }

    const results = await search.toArray();

    if (results.length === 0) {
        console.log("No relevant context found.");
        return;
    }

    console.log(`\n--- V-Bounce Semantic Retrieval ---`);
    console.log(`Query: "${query}"`);
    console.log(`Found ${results.length} relevant chunks.\n`);

    results.forEach((r, idx) => {
        console.log(`[Result ${idx + 1}] Source: ${r.file} (${r.type || 'unknown'} > ${r.section || 'General'})`);
        console.log(`Distance: ${r._distance ? r._distance.toFixed(4) : 'N/A'}`);
        console.log('-'.repeat(40));
        console.log(r.text.trim());
        console.log('\n');
    });
}

main().catch(console.error);
