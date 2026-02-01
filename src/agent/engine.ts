import { LLMProvider, createProviderFromEnv, StreamChunk } from '../providers';
import { SkillLoader } from './skills';
import { ToolManager } from './tools';

export interface AgentConfig {
    provider?: LLMProvider;
    workspaceRoot: string;
    skillsDir: string;
    maxTurns?: number;
}

export class AgentEngine {
    private provider: LLMProvider;
    private skillsDir: string;
    private toolManager: ToolManager;
    private maxTurns: number;

    constructor(config: AgentConfig);
    constructor(apiKey: string, workspaceRoot: string, skillsDir: string);
    constructor(configOrApiKey: AgentConfig | string, workspaceRoot?: string, skillsDir?: string) {
        // Support both new config-based and legacy constructor
        if (typeof configOrApiKey === 'string') {
            // Legacy constructor
            this.provider = createProviderFromEnv();
            this.skillsDir = skillsDir!;
            this.toolManager = new ToolManager(workspaceRoot!);
            this.maxTurns = 5;
        } else {
            // New config-based constructor
            const config = configOrApiKey;
            this.provider = config.provider || createProviderFromEnv();
            this.skillsDir = config.skillsDir;
            this.toolManager = new ToolManager(config.workspaceRoot);
            this.maxTurns = config.maxTurns || 5;
        }
    }

    async run(
        userMessage: string,
        history: any[],
        onStream: (chunk: string) => void,
        context: Record<string, any> = {}
    ) {
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

        const messages: any[] = [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: userMessage }
        ];

        let currentMessages = [...messages];
        let keepGoing = true;
        let turnCount = 0;

        console.log(`[Agent] Using provider: ${this.provider.name} (${this.provider.model})`);

        while (keepGoing && turnCount < this.maxTurns) {
            turnCount++;
            console.log(`[Agent] Turn ${turnCount} thinking...`);

            // 3. Stream Chat
            let fullContent = '';
            let toolCalls: any[] = [];

            const stream = this.provider.streamChat(currentMessages, {
                tools: this.toolManager.getTools(),
            });

            for await (const chunk of stream) {
                // Content
                if (chunk.content) {
                    fullContent += chunk.content;
                    onStream(chunk.content);
                }

                // Tool Calls
                if (chunk.toolCalls) {
                    for (const tc of chunk.toolCalls) {
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

            // Filter incomplete tool calls
            const finalToolCalls = toolCalls.filter(tc => tc && tc.id);

            // Append assistant response
            currentMessages.push({
                role: 'assistant',
                content: fullContent,
                tool_calls: finalToolCalls.length > 0 ? finalToolCalls : undefined
            });

            // 4. Execute Tools
            if (finalToolCalls.length > 0) {
                console.log(`[Agent] Executing ${finalToolCalls.length} tools...`);
                for (const tc of finalToolCalls) {
                    const fnName = tc.function.name;
                    let fnArgs: any = {};

                    try {
                        fnArgs = JSON.parse(tc.function.arguments);
                    } catch (err) {
                        console.error(`[Agent] Failed to parse tool args: ${tc.function.arguments}`);
                    }

                    const result = await this.toolManager.executeTool(fnName, fnArgs);

                    currentMessages.push({
                        role: 'tool',
                        tool_call_id: tc.id,
                        content: JSON.stringify(result)
                    });
                }
            } else {
                keepGoing = false;
            }
        }

        if (turnCount >= this.maxTurns) {
            console.log(`[Agent] Max turns (${this.maxTurns}) reached`);
        }
    }

    /**
     * Get current provider info
     */
    getProviderInfo(): { name: string; model: string } {
        return {
            name: this.provider.name,
            model: this.provider.model,
        };
    }
}
