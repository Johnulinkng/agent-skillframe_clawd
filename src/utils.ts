/**
 * Utility Functions for Memory System
 * Simplified from Clawdbot's utils.ts - only essential functions retained
 */

import path from "node:path";
import fs from "node:fs";

/**
 * Resolve user-provided path (handles ~, relative paths, etc.)
 */
export function resolveUserPath(inputPath: string): string {
    const trimmed = inputPath.trim();

    // Handle home directory (~)
    if (trimmed.startsWith("~")) {
        const home = process.env.HOME || process.env.USERPROFILE || "";
        return path.resolve(home, trimmed.slice(1).replace(/^[/\\]/, ""));
    }

    // Handle absolute paths
    if (path.isAbsolute(trimmed)) {
        return path.normalize(trimmed);
    }

    // Relative path - resolve from cwd
    return path.resolve(process.cwd(), trimmed);
}

/**
 * Ensure directory exists (create if not)
 */
export function ensureDir(dir: string): string {
    try {
        fs.mkdirSync(dir, { recursive: true });
    } catch {
        // Directory may already exist
    }
    return dir;
}

/**
 * Check if a file or directory exists
 */
export function exists(filePath: string): boolean {
    try {
        fs.accessSync(filePath);
        return true;
    } catch {
        return false;
    }
}

/**
 * Simple logging utility (replaces Clawdbot's createSubsystemLogger)
 */
export function createLogger(subsystem: string) {
    const prefix = `[${subsystem}]`;
    return {
        info: (...args: unknown[]) => console.log(prefix, ...args),
        warn: (...args: unknown[]) => console.warn(prefix, ...args),
        error: (...args: unknown[]) => console.error(prefix, ...args),
        debug: (...args: unknown[]) => {
            if (process.env.DEBUG) console.log(prefix, "[debug]", ...args);
        },
    };
}
