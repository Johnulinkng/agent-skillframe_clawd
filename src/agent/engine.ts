import OpenAI from 'openai';
import { SkillLoader } from './skills';
import { ToolManager } from './tools';

export class AgentEngine {
    private openai: OpenAI;
    private skillsDir: string;
    private toolManager: ToolManager;

    constructor(apiKey: string, workspaceRoot: string, skillsDir: string) {
        this.openai = new OpenAI({ apiKey, baseURL: process.env.OPENAI_BASE_URL });
        this.skillsDir = skillsDir;
        this.toolManager = new ToolManager(workspaceRoot);
    }

    async run(userMessage: string, history: any[], onStream: (chunk: string) => void, context: Record<string, any> = {}) {
        // 1. Refresh Skills with Context
        const skillLoader = new SkillLoader(this.skillsDir, context);
        const skills = await skillLoader.loadSkills();
        const skillsPrompt = skillLoader.formatSkillsForSystemPrompt(skills);

        const matchLanguage = /[\u4e00-\u9fa5]/.test(userMessage) ? "Response must be in Chinese." : "";

        // 2. Build System Prompt
        const systemPrompt = `
You are a Lite Agent, an intelligent assistant designed to execute tasks using defined skills and tools.

# CORE RULES
1. You must read the **AVAILABLE SKILLS** section to understand your capabilities.
2. If a user asks for something covered by a skill, STRICTLY follow the procedure in that skill.
3. You can use tools to list, read, and write files.
4. ${matchLanguage}

${skillsPrompt}
    `;

        const messages = [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: userMessage }
        ];

        let currentMessages = [...messages];
        let keepGoing = true;
        let turnCount = 0;
        const MAX_TURNS = 5;

        while (keepGoing && turnCount < MAX_TURNS) {
            turnCount++;

            console.log(`[Agent] Turn ${turnCount} thinking...`);

            // 3. Call LLM
            const runner = await this.openai.chat.completions.create({
                model: 'qwen-max', // 使用最强的 qwen-max 模型以保证工具调用准确
                messages: currentMessages as any,
                tools: this.toolManager.getTools(),
                stream: true,
            });

            let fullContent = '';
            let toolCalls: any[] = [];

            // 4. Handle Stream
            for await (const chunk of runner) {
                const delta = chunk.choices[0]?.delta;

                // Content
                if (delta?.content) {
                    fullContent += delta.content;
                    onStream(delta.content);
                }

                // Tool Calls logic (handling streaming chunks for tools is tricky, simplified here)
                if (delta?.tool_calls) {
                    for (const tc of delta.tool_calls) {
                        const index = tc.index;
                        if (!toolCalls[index]) {
                            toolCalls[index] = { id: tc.id, function: { name: "", arguments: "" } };
                        }
                        if (tc.id) toolCalls[index].id = tc.id;
                        if (tc.function?.name) toolCalls[index].function.name += tc.function.name;
                        if (tc.function?.arguments) toolCalls[index].function.arguments += tc.function.arguments;
                    }
                }
            }
            // Filter out any incomplete tool calls
            const finalToolCalls = toolCalls.filter(tc => tc && tc.id);

            // Append assistant response to history
            currentMessages.push({
                role: 'assistant',
                content: fullContent,
                tool_calls: toolCalls.length > 0 ? toolCalls : undefined
            } as any);

            // 5. Execute Tools if any
            if (finalToolCalls.length > 0) {
                console.log(`[Agent] Executing ${finalToolCalls.length} tools...`);
                for (const tc of finalToolCalls) {
                    const fnName = tc.function.name;
                    const fnArgs = JSON.parse(tc.function.arguments);

                    const result = await this.toolManager.executeTool(fnName, fnArgs);

                    currentMessages.push({
                        role: 'tool',
                        tool_call_id: tc.id,
                        content: JSON.stringify(result)
                    });
                }
                // Loop back to let LLM see tool results
            } else {
                keepGoing = false; // Final response sent
            }
        }
    }
}
