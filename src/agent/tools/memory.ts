/**
 * Memory Tools Registration
 * Registers memory_search and memory_get tools to the global registry
 */

import { globalRegistry, type ToolResult } from "../tools";
import { LiteMemoryManager, getMemoryManager } from "../../memory/lite-manager";

// Store per-session memory managers
const managerCache = new Map<string, LiteMemoryManager>();

function getOrCreateManager(workspaceRoot: string): LiteMemoryManager {
    let manager = managerCache.get(workspaceRoot);
    if (!manager) {
        manager = getMemoryManager(workspaceRoot);
        managerCache.set(workspaceRoot, manager);
    }
    return manager;
}

// ============ memory_search Tool ============

globalRegistry.register(
    "memory_search",
    {
        type: "function",
        function: {
            name: "memory_search",
            description:
                "Semantically search MEMORY.md, memory/*.md, and skills/*.md for relevant information. " +
                "Use this before answering questions about prior work, decisions, preferences, or todos.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "The search query describing what you're looking for",
                    },
                    maxResults: {
                        type: "number",
                        description: "Maximum number of results to return (default: 10)",
                    },
                    minScore: {
                        type: "number",
                        description: "Minimum similarity score 0-1 (default: 0.3)",
                    },
                },
                required: ["query"],
            },
        },
    },
    async (args, ctx): Promise<ToolResult> => {
        const query = args.query as string;
        const maxResults = args.maxResults as number | undefined;
        const minScore = args.minScore as number | undefined;

        if (!query?.trim()) {
            return { status: "error", message: "Query is required" };
        }

        try {
            const manager = getOrCreateManager(ctx.workspaceRoot);
            const results = await manager.search(query, { maxResults, minScore });
            const status = manager.status();

            return {
                status: "success",
                data: {
                    results,
                    provider: status.provider,
                    model: status.model,
                    totalFiles: status.files,
                    totalChunks: status.chunks,
                },
            };
        } catch (err: any) {
            console.error("[memory_search] Error:", err);
            return {
                status: "error",
                message: err.message || "Memory search failed",
            };
        }
    },
    "memory"
);

// ============ memory_get Tool ============

globalRegistry.register(
    "memory_get",
    {
        type: "function",
        function: {
            name: "memory_get",
            description:
                "Read specific lines from a memory file (MEMORY.md, memory/*.md, or skills/*.md). " +
                "Use after memory_search to retrieve full context of a relevant snippet.",
            parameters: {
                type: "object",
                properties: {
                    path: {
                        type: "string",
                        description: "Relative path to the file (e.g., 'MEMORY.md' or 'skills/summary.md')",
                    },
                    from: {
                        type: "number",
                        description: "Starting line number (1-indexed, optional)",
                    },
                    lines: {
                        type: "number",
                        description: "Number of lines to read (optional, reads whole file if omitted)",
                    },
                },
                required: ["path"],
            },
        },
    },
    async (args, ctx): Promise<ToolResult> => {
        const filePath = args.path as string;
        const from = args.from as number | undefined;
        const lines = args.lines as number | undefined;

        if (!filePath?.trim()) {
            return { status: "error", message: "Path is required" };
        }

        try {
            const manager = getOrCreateManager(ctx.workspaceRoot);
            const result = await manager.readFile({
                path: filePath,
                from,
                lines,
            });

            return {
                status: "success",
                data: result,
            };
        } catch (err: any) {
            console.error("[memory_get] Error:", err);
            return {
                status: "error",
                message: err.message || "Failed to read file",
            };
        }
    },
    "memory"
);

// ============ memory_status Tool ============

globalRegistry.register(
    "memory_status",
    {
        type: "function",
        function: {
            name: "memory_status",
            description: "Get the current status of the memory system (indexed files, chunks, etc.)",
            parameters: {
                type: "object",
                properties: {},
            },
        },
    },
    async (args, ctx): Promise<ToolResult> => {
        try {
            const manager = getOrCreateManager(ctx.workspaceRoot);
            const status = manager.status();

            return {
                status: "success",
                data: status,
            };
        } catch (err: any) {
            return {
                status: "error",
                message: err.message || "Failed to get memory status",
            };
        }
    },
    "memory"
);
