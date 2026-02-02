/**
 * Chat History Manager
 * Manages short-term conversation history per session
 */

export interface HistoryEntry {
    sender: string;
    body: string;
    timestamp?: number;
    messageId?: string;
}

export class ChatHistoryManager {
    private historyMap: Map<string, HistoryEntry[]> = new Map();
    private limit: number;
    private maxKeys: number;

    constructor(limit: number = 50, maxKeys: number = 1000) {
        this.limit = limit;
        this.maxKeys = maxKeys;
    }

    /**
     * Get history entries for a session
     */
    get(sessionKey: string): HistoryEntry[] {
        return this.historyMap.get(sessionKey) ?? [];
    }

    /**
     * Append an entry to session history
     */
    append(sessionKey: string, entry: HistoryEntry): HistoryEntry[] {
        if (this.limit <= 0) return [];

        const history = this.historyMap.get(sessionKey) ?? [];
        history.push({
            ...entry,
            timestamp: entry.timestamp ?? Date.now(),
        });

        // Trim to limit
        while (history.length > this.limit) {
            history.shift();
        }

        // Refresh insertion order for LRU
        if (this.historyMap.has(sessionKey)) {
            this.historyMap.delete(sessionKey);
        }
        this.historyMap.set(sessionKey, history);

        // Evict oldest keys if needed
        this.evictOldKeys();

        return history;
    }

    /**
     * Clear history for a session
     */
    clear(sessionKey: string): void {
        this.historyMap.set(sessionKey, []);
    }

    /**
     * Delete a session entirely
     */
    delete(sessionKey: string): void {
        this.historyMap.delete(sessionKey);
    }

    /**
     * Get the number of sessions
     */
    size(): number {
        return this.historyMap.size;
    }

    /**
     * Format history for context injection
     */
    formatForContext(
        sessionKey: string,
        formatter?: (entry: HistoryEntry) => string
    ): string {
        const entries = this.get(sessionKey);
        if (entries.length === 0) return "";

        const format = formatter ?? ((e: HistoryEntry) => `${e.sender}: ${e.body}`);
        return entries.map(format).join("\n");
    }

    /**
     * Build context with history prefix
     */
    buildContextWithHistory(params: {
        sessionKey: string;
        currentMessage: string;
        formatter?: (entry: HistoryEntry) => string;
    }): string {
        const historyText = this.formatForContext(params.sessionKey, params.formatter);
        if (!historyText) return params.currentMessage;

        return [
            "[Previous messages for context]",
            historyText,
            "",
            "[Current message]",
            params.currentMessage,
        ].join("\n");
    }

    private evictOldKeys(): void {
        if (this.historyMap.size <= this.maxKeys) return;

        const keysToDelete = this.historyMap.size - this.maxKeys;
        const iterator = this.historyMap.keys();

        for (let i = 0; i < keysToDelete; i++) {
            const key = iterator.next().value;
            if (key !== undefined) {
                this.historyMap.delete(key);
            }
        }
    }
}

// ============ Singleton Instance ============

let defaultHistoryManager: ChatHistoryManager | null = null;

export function getHistoryManager(limit?: number): ChatHistoryManager {
    if (!defaultHistoryManager) {
        defaultHistoryManager = new ChatHistoryManager(limit);
    }
    return defaultHistoryManager;
}
