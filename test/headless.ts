import dotenv from 'dotenv';
import path from 'path';
import { AgentEngine } from '../src/agent/engine';

dotenv.config({ path: path.join(__dirname, '../.env') });

const workspaceRoot = path.join(__dirname, '../'); // Use project root as workspace
const skillsDir = path.join(workspaceRoot, 'skills');

if (!process.env.OPENAI_API_KEY) {
    console.error("ERROR: OPENAI_API_KEY is missing in .env");
    process.exit(1);
}

const agent = new AgentEngine(process.env.OPENAI_API_KEY, workspaceRoot, skillsDir);

async function runTest() {
    console.log("--- Starting Headless Context Test ---");
    // We will try to use a skill that needs a context variable.
    // Let's assume we have a skill that uses {{ userName }}
    // Since we don't have one yet, I'll just verify the engine accepts the context.

    const testMessage = "Please create a project status report for me. Save it as REPORT_HEADLESS.md. My name is {{ userName }}.";
    const context = { userName: "HeadlessTester" };

    console.log(`User: ${testMessage}`);
    console.log(`Context:`, context);

    try {
        const history: any[] = [];
        await agent.run(testMessage, history, (chunk) => {
            process.stdout.write(chunk);
        }, context);
        console.log("\n\n--- Test Completed ---");
    } catch (err) {
        console.error("Test Failed:", err);
    }
}

runTest();
