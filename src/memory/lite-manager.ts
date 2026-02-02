/**
 * Lite Memory Manager
 * Simplified memory indexing and search for MEMORY.md, memory/, and skills/
 * Replaces complex manager.ts with minimal dependencies
 */

import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

import type { LiteMemoryConfig } from "./config";
import { getDefaultConfig } from "./config";
import { createEmbeddingProvider, cosineSimilarity, type EmbeddingProvider } from "./embeddings-lite";
import { ensureDir, createLogger } from "../utils";

const log = createLogger("memory");

// ============ Types ============

export interface MemoryChunk {
    id: string;
    path: string;
    startLine: number;
    endLine: number;
    text: string;
    hash: string;
    embedding?: number[];
}

export interface MemorySearchResult {
    path: string;
    startLine: number;
    endLine: number;
    score: number;
    snippet: string;
}

interface FileEntry {
    path: string;
    absPath: string;
    hash: string;
    chunks: MemoryChunk[];
}

// ============ Lite Memory Manager ============

export class LiteMemoryManager {
    private workspaceDir: string;
    private config: LiteMemoryConfig;
    private embedProvider: EmbeddingProvider | null = null;
    private files: Map<string, FileEntry> = new Map();
    private chunks: MemoryChunk[] = [];
    private dirty = true;
    private syncing: Promise<void> | null = null;

    constructor(workspaceDir: string, config?: Partial<LiteMemoryConfig>) {
        this.workspaceDir = workspaceDir;
        this.config = config
            ? { ...getDefaultConfig(workspaceDir), ...config }
            : getDefaultConfig(workspaceDir);
    }

    /**
     * Initialize embedding provider (lazy load)
     */
    private async ensureProvider(): Promise<EmbeddingProvider> {
        if (!this.embedProvider) {
            this.embedProvider = await createEmbeddingProvider(this.config.embedding);
            log.info(`Embedding provider: ${this.embedProvider.provider}/${this.embedProvider.model}`);
        }
        return this.embedProvider;
    }

    /**
     * Sync memory index - scan files and build embeddings
     */
    async sync(): Promise<void> {
        if (this.syncing) return this.syncing;
        this.syncing = this.runSync();
        await this.syncing;
        this.syncing = null;
    }

    private async runSync(): Promise<void> {
        log.info("Starting memory sync...");
        const startTime = Date.now();

        // 1. Scan files
        const filePaths = await this.listMemoryFiles();
        log.info(`Found ${filePaths.length} memory files`);

        // 2. Load and chunk files
        const newChunks: MemoryChunk[] = [];
        const newFiles = new Map<string, FileEntry>();

        for (const absPath of filePaths) {
            const relPath = path.relative(this.workspaceDir, absPath).replace(/\\/g, "/");
            const content = await fs.readFile(absPath, "utf-8");
            const hash = this.hashText(content);

            // Check if file unchanged
            const existing = this.files.get(relPath);
            if (existing && existing.hash === hash) {
                newFiles.set(relPath, existing);
                newChunks.push(...existing.chunks);
                continue;
            }

            // Chunk the file
            const chunks = this.chunkMarkdown(content, relPath);
            newFiles.set(relPath, { path: relPath, absPath, hash, chunks });
            newChunks.push(...chunks);
        }

        // 3. Generate embeddings for new chunks
        const chunksNeedingEmbedding = newChunks.filter((c) => !c.embedding);
        if (chunksNeedingEmbedding.length > 0) {
            log.info(`Generating embeddings for ${chunksNeedingEmbedding.length} chunks...`);
            const provider = await this.ensureProvider();
            const texts = chunksNeedingEmbedding.map((c) => c.text);
            const embeddings = await provider.embedBatch(texts);
            for (let i = 0; i < chunksNeedingEmbedding.length; i++) {
                chunksNeedingEmbedding[i].embedding = embeddings[i];
            }
        }

        this.files = newFiles;
        this.chunks = newChunks;
        this.dirty = false;

        const elapsed = Date.now() - startTime;
        log.info(`Memory sync complete: ${this.files.size} files, ${this.chunks.length} chunks (${elapsed}ms)`);
    }

    /**
     * Search memory using semantic similarity
     */
    async search(
        query: string,
        opts?: { maxResults?: number; minScore?: number }
    ): Promise<MemorySearchResult[]> {
        // Auto-sync if dirty
        if (this.dirty) {
            await this.sync();
        }

        if (this.chunks.length === 0) {
            return [];
        }

        const maxResults = opts?.maxResults ?? this.config.query.maxResults;
        const minScore = opts?.minScore ?? this.config.query.minScore;

        // Generate query embedding
        const provider = await this.ensureProvider();
        const queryEmbedding = await provider.embed(query);

        // Calculate similarities
        const scored = this.chunks
            .filter((c) => c.embedding)
            .map((chunk) => ({
                chunk,
                score: cosineSimilarity(queryEmbedding, chunk.embedding!),
            }))
            .filter((item) => item.score >= minScore)
            .sort((a, b) => b.score - a.score)
            .slice(0, maxResults);

        return scored.map((item) => ({
            path: item.chunk.path,
            startLine: item.chunk.startLine,
            endLine: item.chunk.endLine,
            score: item.score,
            snippet: this.truncateSnippet(item.chunk.text, 500),
        }));
    }

    /**
     * Read a file or specific lines
     */
    async readFile(params: {
        path: string;
        from?: number;
        lines?: number;
    }): Promise<{ text: string; path: string }> {
        const relPath = params.path.replace(/\\/g, "/").replace(/^[./]+/, "");
        const absPath = path.resolve(this.workspaceDir, relPath);

        if (!absPath.startsWith(this.workspaceDir)) {
            throw new Error("Path escapes workspace");
        }

        const content = await fs.readFile(absPath, "utf-8");

        if (!params.from && !params.lines) {
            return { text: content, path: relPath };
        }

        const lines = content.split("\n");
        const start = Math.max(1, params.from ?? 1);
        const count = Math.max(1, params.lines ?? lines.length);
        const slice = lines.slice(start - 1, start - 1 + count);
        return { text: slice.join("\n"), path: relPath };
    }

    /**
     * Get current status
     */
    status(): {
        files: number;
        chunks: number;
        dirty: boolean;
        provider?: string;
        model?: string;
    } {
        return {
            files: this.files.size,
            chunks: this.chunks.length,
            dirty: this.dirty,
            provider: this.embedProvider?.provider,
            model: this.embedProvider?.model,
        };
    }

    // ============ Private Helpers ============

    private async listMemoryFiles(): Promise<string[]> {
        const results: string[] = [];

        for (const scanPath of this.config.index.scanPaths) {
            const absPath = path.join(this.workspaceDir, scanPath);

            try {
                const stat = await fs.stat(absPath);
                if (stat.isFile() && scanPath.endsWith(".md")) {
                    results.push(absPath);
                } else if (stat.isDirectory()) {
                    await this.walkDir(absPath, results);
                }
            } catch {
                // Path doesn't exist, skip
            }
        }

        return results;
    }

    private async walkDir(dir: string, results: string[]): Promise<void> {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await this.walkDir(full, results);
            } else if (entry.isFile() && entry.name.endsWith(".md")) {
                results.push(full);
            }
        }
    }

    private chunkMarkdown(content: string, relPath: string): MemoryChunk[] {
        const lines = content.split("\n");
        if (lines.length === 0) return [];

        const { chunkTokens, chunkOverlap } = this.config.index;
        const maxChars = Math.max(32, chunkTokens * 4);
        const overlapChars = Math.max(0, chunkOverlap * 4);

        const chunks: MemoryChunk[] = [];
        let current: Array<{ line: string; lineNo: number }> = [];
        let currentChars = 0;

        const flush = () => {
            if (current.length === 0) return;
            const first = current[0]!;
            const last = current[current.length - 1]!;
            const text = current.map((e) => e.line).join("\n");
            chunks.push({
                id: `${relPath}:${first.lineNo}-${last.lineNo}`,
                path: relPath,
                startLine: first.lineNo,
                endLine: last.lineNo,
                text,
                hash: this.hashText(text),
            });
        };

        const carryOverlap = () => {
            if (overlapChars <= 0 || current.length === 0) {
                current = [];
                currentChars = 0;
                return;
            }
            let acc = 0;
            const kept: Array<{ line: string; lineNo: number }> = [];
            for (let i = current.length - 1; i >= 0; i--) {
                const entry = current[i]!;
                acc += entry.line.length + 1;
                kept.unshift(entry);
                if (acc >= overlapChars) break;
            }
            current = kept;
            currentChars = kept.reduce((sum, e) => sum + e.line.length + 1, 0);
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i] ?? "";
            const lineNo = i + 1;
            const lineSize = line.length + 1;

            if (currentChars + lineSize > maxChars && current.length > 0) {
                flush();
                carryOverlap();
            }
            current.push({ line, lineNo });
            currentChars += lineSize;
        }
        flush();

        return chunks;
    }

    private hashText(text: string): string {
        return crypto.createHash("sha256").update(text).digest("hex").slice(0, 16);
    }

    private truncateSnippet(text: string, maxLen: number): string {
        if (text.length <= maxLen) return text;
        return text.slice(0, maxLen - 3) + "...";
    }
}

// ============ Singleton Factory ============

let defaultManager: LiteMemoryManager | null = null;

export function getMemoryManager(workspaceDir: string): LiteMemoryManager {
    if (!defaultManager) {
        defaultManager = new LiteMemoryManager(workspaceDir);
    }
    return defaultManager;
}
