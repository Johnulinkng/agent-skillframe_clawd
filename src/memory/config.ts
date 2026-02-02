/**
 * Lite Memory Configuration
 * Simplified configuration interface replacing complex ClawdbotConfig
 */

import path from "node:path";

export interface EmbeddingConfig {
    /** Embedding provider: local, openai, or qwen */
    provider: "local" | "openai" | "qwen";
    /** Model name (e.g., "Xenova/all-MiniLM-L6-v2" for local) */
    model: string;
    /** API Key (only needed for remote providers) */
    apiKey?: string;
    /** Custom API base URL (only for remote providers) */
    baseUrl?: string;
}

export interface StoreConfig {
    /** Path to SQLite database file */
    dbPath: string;
}

export interface IndexConfig {
    /** Tokens per chunk (default: 500) */
    chunkTokens: number;
    /** Overlap tokens between chunks (default: 50) */
    chunkOverlap: number;
    /** Paths to scan for memory files (relative to workspace) */
    scanPaths: string[];
}

export interface QueryConfig {
    /** Maximum results to return */
    maxResults: number;
    /** Minimum similarity score (0-1) */
    minScore: number;
}

export interface LiteMemoryConfig {
    embedding: EmbeddingConfig;
    store: StoreConfig;
    index: IndexConfig;
    query: QueryConfig;
}

/**
 * Get default configuration for memory system
 */
export function getDefaultConfig(workspaceDir: string): LiteMemoryConfig {
    return {
        embedding: {
            provider: "local",
            model: "Xenova/all-MiniLM-L6-v2",
        },
        store: {
            dbPath: path.join(workspaceDir, ".memory", "index.db"),
        },
        index: {
            chunkTokens: 500,
            chunkOverlap: 50,
            scanPaths: ["MEMORY.md", "memory/", "skills/"],
        },
        query: {
            maxResults: 10,
            minScore: 0.3,
        },
    };
}

/**
 * Get Qwen (DashScope) configuration
 */
export function getQwenConfig(workspaceDir: string): LiteMemoryConfig {
    const config = getDefaultConfig(workspaceDir);
    config.embedding = {
        provider: "qwen",
        model: "text-embedding-v2",
        apiKey: process.env.DASHSCOPE_API_KEY,
        baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    };
    return config;
}

/**
 * Merge user config with defaults
 */
export function mergeConfig(
    workspaceDir: string,
    userConfig?: Partial<LiteMemoryConfig>
): LiteMemoryConfig {
    const defaults = getDefaultConfig(workspaceDir);
    if (!userConfig) return defaults;

    return {
        embedding: { ...defaults.embedding, ...userConfig.embedding },
        store: { ...defaults.store, ...userConfig.store },
        index: { ...defaults.index, ...userConfig.index },
        query: { ...defaults.query, ...userConfig.query },
    };
}
