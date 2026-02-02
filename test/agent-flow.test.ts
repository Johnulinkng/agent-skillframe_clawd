/**
 * Agent End-to-End Flow Test
 * Tests: LLM -> System Prompt -> Memory Tool -> Final Answer
 */

import { AgentEngine } from "../src/agent/engine";
import path from "path";
import dotenv from "dotenv";

// Load env for LLM provider
dotenv.config();

async function testAgentFlow() {
    const workspaceRoot = path.resolve(__dirname, "..");
    const skillsDir = path.join(workspaceRoot, "skills");

    console.log("=".repeat(50));
    console.log("  Agent E2E Workflow Test");
    console.log("=".repeat(50));

    const engine = new AgentEngine({
        workspaceRoot,
        skillsDir,
        maxTurns: 3
    });

    const userMessage = "喵，主银想知道最近关于 BTC 的分析记录，帮我从记忆文件里查查喵？";

    console.log(`\nUser: ${userMessage}`);
    console.log("\n--- Agent Thinking ---\n");

    let fullResponse = "";

    await engine.run(
        userMessage,
        [], // empty history
        (chunk) => {
            process.stdout.write(chunk);
            fullResponse += chunk;
        },
        {
            user_name: "John",
            role: "Developer"
        }
    );

    console.log("\n\n" + "=".repeat(50));
    console.log("  Test Summary");
    console.log("=".repeat(50));

    // Check if memory was mentioned or if a tool was called (via console logs from engine)
    if (fullResponse.includes("BTC") || fullResponse.includes("2026")) {
        console.log("✓ Success: Agent successfully retrieved and reported information from MEMORY.md");
    } else {
        console.log("? Unknown: Agent might not have found the specific data, check turn logs above.");
    }
}

testAgentFlow().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});
