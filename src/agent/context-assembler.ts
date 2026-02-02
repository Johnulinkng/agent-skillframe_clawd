/**
 * 精简版 Context Assembler (上下文装配器)
 * 用途：协调短期记忆、长期记忆和系统提示，组装最终发送给 LLM 的消息列表
 * 来源：Clawdbot src/agents/pi-embedded-runner.ts 核心逻辑
 * 保留内容：消息组装、RAG 触发、Token 管理
 */

import type { HistoryEntry, ChatHistoryManager } from "./history";
import type { SystemPromptParams, buildAgentSystemPrompt } from "./system-prompt";

// ============ 类型定义 ============

/** LLM 消息格式（兼容 OpenAI/Anthropic 标准） */
export interface LLMMessage {
    role: "system" | "user" | "assistant" | "tool";
    content: string;
    /** 工具调用相关 */
    tool_call_id?: string;
    name?: string;
}

/** 长期记忆搜索结果 */
export interface MemorySearchResult {
    /** 文件路径 */
    path: string;
    /** 匹配片段开始行 */
    startLine: number;
    /** 匹配片段结束行 */
    endLine: number;
    /** 匹配的文本内容 */
    snippet: string;
    /** 相似度分数 (0-1) */
    score: number;
}

/** 长期记忆管理器接口 */
export interface IMemoryManager {
    search(query: string, opts?: { maxResults?: number }): Promise<MemorySearchResult[]>;
}

/** 上下文装配参数 */
export interface AssembleContextParams {
    /** 当前用户输入 */
    userInput: string;
    /** 会话唯一标识 */
    sessionKey: string;
    /** 短期历史管理器 */
    historyManager: ChatHistoryManager;
    /** 长期记忆管理器（可选） */
    memoryManager?: IMemoryManager;
    /** 系统提示词构建函数 */
    buildSystemPrompt: typeof buildAgentSystemPrompt;
    /** 系统提示词参数 */
    systemPromptParams: Omit<SystemPromptParams, "memoryEnabled">;
    /** 长期记忆搜索触发条件（返回 true 则触发 RAG） */
    shouldSearchMemory?: (userInput: string) => boolean;
    /** 长期记忆搜索结果数量 */
    memoryMaxResults?: number;
    /** Token 预算（超出则触发压缩） */
    maxTokenBudget?: number;
    /** Token 计算函数（如 tiktoken） */
    countTokens?: (text: string) => number;
}

// ============ 核心逻辑 ============

/**
 * 默认的 RAG 触发判断逻辑
 * 当用户提问中包含以下关键词时，自动触发长期记忆搜索
 */
export function defaultShouldSearchMemory(userInput: string): boolean {
    const triggerPatterns = [
        /之前|上次|曾经|记得|历史|过往/,
        /上周|上个月|去年|前几天/,
        /你说过|我告诉你|我提到过/,
        /偏好|习惯|规则|约定/,
        /待办|todo|任务|进度/,
    ];
    const normalized = userInput.toLowerCase();
    return triggerPatterns.some((pattern) => pattern.test(normalized));
}

/**
 * 将长期记忆搜索结果格式化为上下文片段
 */
function formatMemoryResults(results: MemorySearchResult[]): string {
    if (results.length === 0) return "";
    const lines = ["[长期记忆检索结果]", ""];
    for (const result of results) {
        lines.push(
            `来源: ${result.path} (行 ${result.startLine}-${result.endLine})`,
            "内容:",
            result.snippet,
            ""
        );
    }
    return lines.join("\n");
}

/**
 * 简单的 Token 估算（中文约 2 字符/token，英文约 4 字符/token）
 * 生产环境建议使用 tiktoken 等精确计算库
 */
export function estimateTokens(text: string): number {
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const otherChars = text.length - chineseChars;
    return Math.ceil(chineseChars / 2 + otherChars / 4);
}

/**
 * 压缩历史消息（移除最旧的消息直到满足 Token 预算）
 */
function compactHistory(
    history: HistoryEntry[],
    maxTokens: number,
    countTokens: (text: string) => number
): HistoryEntry[] {
    const result: HistoryEntry[] = [];
    let totalTokens = 0;

    // 从最新的消息开始保留
    for (let i = history.length - 1; i >= 0; i--) {
        const entry = history[i];
        const entryTokens = countTokens(`${entry.sender}: ${entry.body}`);
        if (totalTokens + entryTokens > maxTokens) break;
        result.unshift(entry);
        totalTokens += entryTokens;
    }

    return result;
}

/**
 * 核心函数：装配完整的 LLM 消息列表
 *
 * 工作流程:
 * 1. 构建 System Prompt（注入工具、技能、记忆指令）
 * 2. 获取短期对话历史
 * 3. 判断是否需要触发长期记忆搜索 (RAG)
 * 4. 如果需要，执行 RAG 并将结果注入上下文
 * 5. 计算 Token，必要时压缩历史
 * 6. 返回完整的消息列表
 */
export async function assembleContext(
    params: AssembleContextParams
): Promise<LLMMessage[]> {
    const {
        userInput,
        sessionKey,
        historyManager,
        memoryManager,
        buildSystemPrompt,
        systemPromptParams,
        shouldSearchMemory = defaultShouldSearchMemory,
        memoryMaxResults = 5,
        maxTokenBudget,
        countTokens = estimateTokens,
    } = params;

    // 1. 判断是否启用 RAG
    const memoryEnabled = !!memoryManager && shouldSearchMemory(userInput);

    // 2. 构建 System Prompt
    const systemPrompt = buildSystemPrompt({
        ...systemPromptParams,
        memoryEnabled,
    });

    // 3. 获取短期历史
    let history = historyManager.get(sessionKey);

    // 4. 如果启用 RAG，执行长期记忆搜索
    let memoryContext = "";
    if (memoryEnabled && memoryManager) {
        try {
            const results = await memoryManager.search(userInput, {
                maxResults: memoryMaxResults,
            });
            memoryContext = formatMemoryResults(results);
        } catch (err) {
            console.warn("[ContextAssembler] 长期记忆搜索失败:", err);
        }
    }

    // 5. Token 压缩（如果配置了预算）
    if (maxTokenBudget) {
        const systemTokens = countTokens(systemPrompt);
        const memoryTokens = countTokens(memoryContext);
        const userTokens = countTokens(userInput);
        const reservedTokens = systemTokens + memoryTokens + userTokens + 500; // 留 500 token 给回复
        const historyBudget = Math.max(0, maxTokenBudget - reservedTokens);
        history = compactHistory(history, historyBudget, countTokens);
    }

    // 6. 组装消息列表
    const messages: LLMMessage[] = [
        { role: "system", content: systemPrompt },
    ];

    // 添加历史消息（交替 user/assistant）
    for (const entry of history) {
        // 简化处理：非当前用户的消息都当作 assistant
        const role = entry.sender === "user" ? "user" : "assistant";
        messages.push({ role, content: entry.body });
    }

    // 添加长期记忆上下文（作为最后一条 system 注入或 user 前缀）
    if (memoryContext) {
        // 策略1: 作为独立的 user 消息前置
        // messages.push({ role: "user", content: memoryContext });

        // 策略2: 附加到当前用户输入
        messages.push({
            role: "user",
            content: `${memoryContext}\n\n---\n用户问题: ${userInput}`,
        });
    } else {
        messages.push({ role: "user", content: userInput });
    }

    return messages;
}

// ============ 便捷封装类 ============

/**
 * ContextAssembler 类：封装上述逻辑的便捷类
 *
 * 用法示例:
 * ```ts
 * const assembler = new ContextAssembler({
 *   historyManager,
 *   memoryManager,
 *   systemPromptParams: { workspaceDir: "/app", tools: [...] },
 * });
 *
 * const messages = await assembler.assemble({
 *   sessionKey: "session-123",
 *   userInput: "帮我查一下之前的分析报告",
 * });
 *
 * const response = await llm.chat(messages);
 * ```
 */
export class ContextAssembler {
    private historyManager: ChatHistoryManager;
    private memoryManager?: IMemoryManager;
    private systemPromptBuilder: typeof buildAgentSystemPrompt;
    private systemPromptParams: Omit<SystemPromptParams, "memoryEnabled">;
    private shouldSearchMemory: (userInput: string) => boolean;
    private memoryMaxResults: number;
    private maxTokenBudget?: number;
    private countTokens: (text: string) => number;

    constructor(config: {
        historyManager: ChatHistoryManager;
        memoryManager?: IMemoryManager;
        systemPromptBuilder: typeof buildAgentSystemPrompt;
        systemPromptParams: Omit<SystemPromptParams, "memoryEnabled">;
        shouldSearchMemory?: (userInput: string) => boolean;
        memoryMaxResults?: number;
        maxTokenBudget?: number;
        countTokens?: (text: string) => number;
    }) {
        this.historyManager = config.historyManager;
        this.memoryManager = config.memoryManager;
        this.systemPromptBuilder = config.systemPromptBuilder;
        this.systemPromptParams = config.systemPromptParams;
        this.shouldSearchMemory = config.shouldSearchMemory ?? defaultShouldSearchMemory;
        this.memoryMaxResults = config.memoryMaxResults ?? 5;
        this.maxTokenBudget = config.maxTokenBudget;
        this.countTokens = config.countTokens ?? estimateTokens;
    }

    async assemble(params: {
        sessionKey: string;
        userInput: string;
    }): Promise<LLMMessage[]> {
        return assembleContext({
            userInput: params.userInput,
            sessionKey: params.sessionKey,
            historyManager: this.historyManager,
            memoryManager: this.memoryManager,
            buildSystemPrompt: this.systemPromptBuilder,
            systemPromptParams: this.systemPromptParams,
            shouldSearchMemory: this.shouldSearchMemory,
            memoryMaxResults: this.memoryMaxResults,
            maxTokenBudget: this.maxTokenBudget,
            countTokens: this.countTokens,
        });
    }

    /** 向指定会话追加一条历史记录 */
    appendHistory(sessionKey: string, entry: HistoryEntry): void {
        this.historyManager.append(sessionKey, entry);
    }
}
