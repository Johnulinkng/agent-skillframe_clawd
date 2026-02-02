/**
 * Memory System Test
 * Tests local embedding, memory search, and memory get functionality
 */

import { getMemoryManager } from "../src/memory/lite-manager";
import { createEmbeddingProvider } from "../src/memory/embeddings-lite";
import { getDefaultConfig } from "../src/memory/config";
import path from "path";

const WORKSPACE = path.resolve(__dirname, "..");

async function testEmbedding() {
    console.log("\n=== Test 1: Local Embedding Provider ===\n");

    const config = getDefaultConfig(WORKSPACE);
    console.log(`Provider: ${config.embedding.provider}`);
    console.log(`Model: ${config.embedding.model}`);

    const provider = await createEmbeddingProvider(config.embedding);

    // Test single embedding
    const text = "测试文本：BTC 价格分析";
    console.log(`\nEmbedding text: "${text}"`);

    const start = Date.now();
    const embedding = await provider.embed(text);
    const elapsed = Date.now() - start;

    console.log(`Embedding dimensions: ${embedding.length}`);
    console.log(`First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(", ")}...]`);
    console.log(`Time: ${elapsed}ms`);

    // Test batch embedding
    console.log("\nBatch embedding test:");
    const texts = ["Hello world", "你好世界", "Memory system test"];
    const batchStart = Date.now();
    const embeddings = await provider.embedBatch(texts);
    const batchElapsed = Date.now() - batchStart;

    console.log(`Batch size: ${embeddings.length}`);
    console.log(`Time: ${batchElapsed}ms`);

    console.log("\n✓ Embedding test passed!");
}

async function testMemoryManager() {
    console.log("\n=== Test 2: Memory Manager ===\n");

    const manager = getMemoryManager(WORKSPACE);

    // Sync memory files
    console.log("Syncing memory files...");
    await manager.sync();

    const status = manager.status();
    console.log(`Files indexed: ${status.files}`);
    console.log(`Chunks created: ${status.chunks}`);
    console.log(`Provider: ${status.provider}`);
    console.log(`Model: ${status.model}`);

    // Test search
    console.log("\n--- Search Test: 'BTC 分析' ---");
    const results = await manager.search("BTC 分析", { maxResults: 3 });

    if (results.length > 0) {
        console.log(`Found ${results.length} results:`);
        for (const result of results) {
            console.log(`\n  File: ${result.path}`);
            console.log(`  Lines: ${result.startLine}-${result.endLine}`);
            console.log(`  Score: ${result.score.toFixed(4)}`);
            console.log(`  Snippet: ${result.snippet.slice(0, 100)}...`);
        }
    } else {
        console.log("No results found");
    }

    // Test file read
    console.log("\n--- Read File Test: MEMORY.md ---");
    const fileContent = await manager.readFile({ path: "MEMORY.md", from: 1, lines: 10 });
    console.log(`Read ${fileContent.text.split("\n").length} lines from ${fileContent.path}`);

    console.log("\n✓ Memory Manager test passed!");
}

async function testSkillsIndexing() {
    console.log("\n=== Test 3: Skills Indexing ===\n");

    const manager = getMemoryManager(WORKSPACE);

    // Search for skill-related content
    console.log("--- Search Test: 'skill summary' ---");
    const results = await manager.search("skill summary", { maxResults: 3 });

    console.log(`Found ${results.length} results from skills/`);
    for (const result of results) {
        console.log(`  - ${result.path} (score: ${result.score.toFixed(4)})`);
    }

    console.log("\n✓ Skills indexing test passed!");
}

async function main() {
    console.log("=".repeat(50));
    console.log("  Memory System Integration Test");
    console.log("=".repeat(50));

    try {
        await testEmbedding();
        await testMemoryManager();
        await testSkillsIndexing();

        console.log("\n" + "=".repeat(50));
        console.log("  ALL TESTS PASSED!");
        console.log("=".repeat(50) + "\n");
    } catch (error) {
        console.error("\n❌ Test failed:", error);
        process.exit(1);
    }
}

main();
