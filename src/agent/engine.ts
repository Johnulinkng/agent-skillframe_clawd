import { LLMProvider, createProviderFromEnv, StreamChunk } from '../providers';
import { SkillLoader } from './skills';
import { ToolManager } from './tools';
import { ChatHistoryManager, getHistoryManager } from './history';
// Import memory tools to register them with globalRegistry
import './tools/memory';
import { ContextAssembler } from './context-assembler';
import { buildAgentSystemPrompt } from './system-prompt';
import { getMemoryManager, LiteMemoryManager } from '../memory/lite-manager';

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
    private historyManager: ChatHistoryManager;
    private memoryManager: LiteMemoryManager;

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
            this.historyManager = getHistoryManager();
            this.memoryManager = getMemoryManager(workspaceRoot!);
        } else {
            // New config-based constructor
            const config = configOrApiKey;
            this.provider = config.provider || createProviderFromEnv();
            this.skillsDir = config.skillsDir;
            this.toolManager = new ToolManager(config.workspaceRoot);
            this.maxTurns = config.maxTurns || 5;
            this.historyManager = getHistoryManager();
            this.memoryManager = getMemoryManager(config.workspaceRoot);
        }
    }

    async run(
        userMessage: string,
        history: any[], // Simple array compatible with external callers
        onStream: (chunk: string) => void,
        context: Record<string, any> = {}
    ) {
        // 1. Refresh Skills with Context
        const skillLoader = new SkillLoader(this.skillsDir, context);
        const skills = await skillLoader.loadSkills();

        // 2. Prepare ContextAssembler
        // This is the brain that connects Memory, History, Tools, and System Prompt
        const assembler = new ContextAssembler({
            historyManager: this.historyManager,
            memoryManager: this.memoryManager,
            systemPromptBuilder: buildAgentSystemPrompt,
            systemPromptParams: {
                workspaceDir: this.toolManager.getWorkspaceRoot(),
                tools: this.toolManager.getToolSummaries(),
                skills: skills.map(s => ({
                    name: s.name,
                    description: s.metadata.description,
                    location: s.path
                })),
                userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                // Add extra instructions if non-English
                extraSystemPrompt: /[\u4e00-\u9fa5]/.test(userMessage)
                    ? "Response must be in Chinese."
                    : undefined
            },
            // Auto-trigger RAG when user asks about past events
            // Default logic in ContextAssembler handles keywords like "remember", "previous", "last time"
        });

        const sessionKey = "default-session"; // TODO: Support multi-session

        // 3. Assemble Messages (System + History + Memory + User)
        // This implicitly calls memoryManager.search() if RAG triggers
        const messages = await assembler.assemble({
            sessionKey,
            userInput: userMessage
        });

        // 4. Main Execution Loop
        // Cast to any[] to avoid strict type checks between different library versions of ChatCompletionMessageParam
        let currentMessages: any[] = [...messages];
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
            const assistantMsg = {
                role: 'assistant',
                content: fullContent,
                tool_calls: finalToolCalls.length > 0 ? finalToolCalls : undefined
            };
            currentMessages.push(assistantMsg);

            // Persist to history (assistant)
            this.historyManager.append(sessionKey, {
                sender: 'assistant',
                body: fullContent + (finalToolCalls.length > 0 ? ` [Called: ${finalToolCalls.map(t => t.function.name).join(', ')}]` : '')
            });

            // 4. Execute Tools
            if (finalToolCalls.length > 0) {
                console.log(`\n[Agent -> Tool] Calling: ${finalToolCalls.map(tc => tc.function.name).join(", ")}`);
                for (const tc of finalToolCalls) {
                    const fnName = tc.function.name;
                    let fnArgs: any = {};

                    try {
                        fnArgs = JSON.parse(tc.function.arguments);
                    } catch (err) {
                        console.error(`[Agent] Failed to parse tool args: ${tc.function.arguments}`);
                    }

                    const result = await this.toolManager.executeTool(fnName, fnArgs);
                    console.log(`[Tool -> Agent] Result from ${fnName}:`, JSON.stringify(result).slice(0, 100) + "...");

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

        // Persist user message at the very end to ensure it's part of history for next time
        // Actually ContextAssembler reads history at the START, so we should append AFTER success
        // But since we are appending to the SAME session key, it works for the NEXT turn/request.
        this.historyManager.append(sessionKey, {
            sender: 'user',
            body: userMessage
        });
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
