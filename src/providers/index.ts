/**
 * LLM Provider Abstraction Layer
 * 
 * This module provides a unified interface for different LLM providers,
 * enabling easy switching between models (Qwen, OpenAI, Claude, etc.)
 */

import OpenAI from 'openai';
import { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';

// ============ Types & Interfaces ============

export interface ProviderConfig {
    apiKey: string;
    baseURL?: string;
    model?: string;
    maxRetries?: number;
    timeout?: number;
}

export interface ChatOptions {
    tools?: ChatCompletionTool[];
    stream?: boolean;
    temperature?: number;
    maxTokens?: number;
}

export interface StreamChunk {
    content?: string;
    toolCalls?: ToolCallDelta[];
    finishReason?: string;
}

export interface ToolCallDelta {
    index: number;
    id?: string;
    function?: {
        name?: string;
        arguments?: string;
    };
}

export interface LLMProvider {
    readonly name: string;
    readonly model: string;

    /**
     * Stream chat completion
     */
    streamChat(
        messages: ChatCompletionMessageParam[],
        options?: ChatOptions
    ): AsyncGenerator<StreamChunk>;

    /**
     * Simple chat completion (non-streaming)
     */
    chat(
        messages: ChatCompletionMessageParam[],
        options?: ChatOptions
    ): Promise<{ content: string; toolCalls?: any[] }>;
}

// ============ Provider Registry ============

const providers: Map<string, new (config: ProviderConfig) => LLMProvider> = new Map();

export function registerProvider(name: string, providerClass: new (config: ProviderConfig) => LLMProvider) {
    providers.set(name.toLowerCase(), providerClass);
}

export function getProvider(name: string, config: ProviderConfig): LLMProvider {
    const ProviderClass = providers.get(name.toLowerCase());
    if (!ProviderClass) {
        throw new Error(`Provider "${name}" not found. Available: ${Array.from(providers.keys()).join(', ')}`);
    }
    return new ProviderClass(config);
}

export function listProviders(): string[] {
    return Array.from(providers.keys());
}

// ============ Qwen Provider (OpenAI-compatible) ============

export class QwenProvider implements LLMProvider {
    readonly name = 'qwen';
    readonly model: string;
    private client: OpenAI;

    constructor(config: ProviderConfig) {
        this.model = config.model || 'qwen-max';
        this.client = new OpenAI({
            apiKey: config.apiKey,
            baseURL: config.baseURL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            maxRetries: config.maxRetries || 3,
            timeout: config.timeout || 60000,
        });
    }

    async *streamChat(
        messages: ChatCompletionMessageParam[],
        options?: ChatOptions
    ): AsyncGenerator<StreamChunk> {
        const stream = await this.client.chat.completions.create({
            model: this.model,
            messages,
            tools: options?.tools,
            stream: true,
            temperature: options?.temperature,
            max_tokens: options?.maxTokens,
        });

        for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta;

            yield {
                content: delta?.content || undefined,
                toolCalls: delta?.tool_calls?.map(tc => ({
                    index: tc.index,
                    id: tc.id,
                    function: tc.function ? {
                        name: tc.function.name,
                        arguments: tc.function.arguments,
                    } : undefined,
                })),
                finishReason: chunk.choices[0]?.finish_reason || undefined,
            };
        }
    }

    async chat(
        messages: ChatCompletionMessageParam[],
        options?: ChatOptions
    ): Promise<{ content: string; toolCalls?: any[] }> {
        const response = await this.client.chat.completions.create({
            model: this.model,
            messages,
            tools: options?.tools,
            stream: false,
            temperature: options?.temperature,
            max_tokens: options?.maxTokens,
        });

        const choice = response.choices[0];
        return {
            content: choice.message.content || '',
            toolCalls: choice.message.tool_calls,
        };
    }
}

// ============ OpenAI Provider ============

export class OpenAIProvider implements LLMProvider {
    readonly name = 'openai';
    readonly model: string;
    private client: OpenAI;

    constructor(config: ProviderConfig) {
        this.model = config.model || 'gpt-4o';
        this.client = new OpenAI({
            apiKey: config.apiKey,
            baseURL: config.baseURL,
            maxRetries: config.maxRetries || 3,
            timeout: config.timeout || 60000,
        });
    }

    async *streamChat(
        messages: ChatCompletionMessageParam[],
        options?: ChatOptions
    ): AsyncGenerator<StreamChunk> {
        const stream = await this.client.chat.completions.create({
            model: this.model,
            messages,
            tools: options?.tools,
            stream: true,
            temperature: options?.temperature,
            max_tokens: options?.maxTokens,
        });

        for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta;

            yield {
                content: delta?.content || undefined,
                toolCalls: delta?.tool_calls?.map(tc => ({
                    index: tc.index,
                    id: tc.id,
                    function: tc.function ? {
                        name: tc.function.name,
                        arguments: tc.function.arguments,
                    } : undefined,
                })),
                finishReason: chunk.choices[0]?.finish_reason || undefined,
            };
        }
    }

    async chat(
        messages: ChatCompletionMessageParam[],
        options?: ChatOptions
    ): Promise<{ content: string; toolCalls?: any[] }> {
        const response = await this.client.chat.completions.create({
            model: this.model,
            messages,
            tools: options?.tools,
            stream: false,
            temperature: options?.temperature,
            max_tokens: options?.maxTokens,
        });

        const choice = response.choices[0];
        return {
            content: choice.message.content || '',
            toolCalls: choice.message.tool_calls,
        };
    }
}

// ============ Register Built-in Providers ============

registerProvider('qwen', QwenProvider);
registerProvider('openai', OpenAIProvider);

// ============ Factory Function ============

/**
 * Create a provider from environment variables
 */
export function createProviderFromEnv(): LLMProvider {
    const providerName = process.env.LLM_PROVIDER || 'qwen';
    const apiKey = process.env.OPENAI_API_KEY;
    const baseURL = process.env.OPENAI_BASE_URL;
    const model = process.env.LLM_MODEL;

    if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is required');
    }

    return getProvider(providerName, {
        apiKey,
        baseURL,
        model,
    });
}
