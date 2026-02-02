/**
 * Memory Module Exports
 * Simplified exports for the lite memory system
 */

export { LiteMemoryManager, getMemoryManager } from "./lite-manager";
export type { MemorySearchResult, MemoryChunk } from "./lite-manager";
export { getDefaultConfig, getQwenConfig, mergeConfig } from "./config";
export type { LiteMemoryConfig, EmbeddingConfig, IndexConfig } from "./config";
export { createEmbeddingProvider, cosineSimilarity } from "./embeddings-lite";
export type { EmbeddingProvider } from "./embeddings-lite";
