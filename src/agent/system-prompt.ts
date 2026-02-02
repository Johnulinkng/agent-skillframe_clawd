/**
 * Simplified System Prompt Builder (English Version)
 * Purpose: Build system prompts for vertical domain agents
 * Removed: Sandbox, Gateway, Telegram/Discord logic, Runtime Info
 * Kept: Tooling, Skills, Memory, Project Context
 */

// ============ Type Definitions ============

export interface ToolSummary {
    name: string;
    description: string;
}

export interface SkillEntry {
    name: string;
    description: string;
    location: string; // Path to SKILL.md
}

export interface ContextFile {
    path: string;
    content: string;
}

export interface SystemPromptParams {
    /** Working directory */
    workspaceDir: string;
    /** List of available tools */
    tools: ToolSummary[];
    /** Loaded skills */
    skills?: SkillEntry[];
    /** Whether long-term memory search is enabled */
    memoryEnabled?: boolean;
    /** Extra system prompt (User defined role/rules) */
    extraSystemPrompt?: string;
    /** Project context files (e.g. SOUL.md) */
    contextFiles?: ContextFile[];
    /** User timezone */
    userTimezone?: string;
}

// ============ Section Builders (Strictly aligned with original English prompts) ============

function buildToolingSection(tools: ToolSummary[]): string[] {
    // Original source: lines 333-335 & 354-362
    if (tools.length === 0) return [];
    const toolLines = tools.map((t) => `- ${t.name}: ${t.description}`);

    return [
        "## Tooling",
        "Tool availability (filtered by policy):",
        "Tool names are case-sensitive. Call tools exactly as listed.",
        ...toolLines,
        "TOOLS.md does not control tool availability; it is user guidance for how to use external tools.",
        "If a task is more complex or takes longer, spawn a sub-agent. It will do the work for you and ping you when it's done. You can always check up on it.",
        "",
        "## Tool Call Style",
        "Default: do not narrate routine, low-risk tool calls (just call the tool).",
        "Narrate only when it helps: multi-step work, complex/challenging problems, sensitive actions (e.g., deletions), or when the user explicitly asks.",
        "Keep narration brief and value-dense; avoid repeating obvious steps.",
        "Use plain human language for narration unless in a technical context.",
        "",
    ];
}

function buildSkillsSection(skills: SkillEntry[]): string[] {
    // Original source: lines 20-32
    if (!skills || skills.length === 0) return [];

    // Note: Original uses "readToolName" param, we assume "read" is the name or just list location
    const skillLines = skills.map(
        (s) => `- ${s.name}: ${s.description} (see SKILL.md at ${s.location})`
    );

    return [
        "## Skills (mandatory)",
        "Before replying: scan <available_skills> <description> entries.",
        `- If exactly one skill clearly applies: read its SKILL.md at <location>, then follow it.`,
        "- If multiple could apply: choose the most specific one, then read/follow it.",
        "- If none clearly apply: do not read any SKILL.md.",
        "Constraints: never read more than one skill up front; only read after selecting.",
        "",
        "<available_skills>",
        ...skillLines,
        "</available_skills>",
        "",
    ];
}

function buildMemorySection(memoryEnabled: boolean): string[] {
    // Original source: lines 40-44
    if (!memoryEnabled) return [];
    return [
        "## Memory Recall",
        "Before answering anything about prior work, decisions, dates, people, preferences, or todos: run memory_search on MEMORY.md + memory/*.md; then use memory_get to pull only the needed lines. If low confidence after search, say you checked.",
        "",
    ];
}

function buildContextFilesSection(contextFiles: ContextFile[]): string[] {
    // Original source: lines 497-514
    if (!contextFiles || contextFiles.length === 0) return [];

    const hasSoulFile = contextFiles.some((file) => {
        const normalizedPath = file.path.trim().replace(/\\/g, "/");
        const baseName = normalizedPath.split("/").pop() ?? normalizedPath;
        return baseName.toLowerCase() === "soul.md";
    });

    const lines = ["# Project Context", "", "The following project context files have been loaded:"];

    if (hasSoulFile) {
        lines.push(
            "If SOUL.md is present, embody its persona and tone. Avoid stiff, generic replies; follow its guidance unless higher-priority instructions override it."
        );
    }
    lines.push("");

    for (const file of contextFiles) {
        lines.push(`## ${file.path}`, "", file.content, "");
    }
    return lines;
}

function buildTimeSection(userTimezone?: string): string[] {
    // Original source: lines 52-54
    if (!userTimezone) return [];
    return ["## Current Date & Time", `Time zone: ${userTimezone}`, ""];
}

// ============ Main Builder Function ============

export function buildAgentSystemPrompt(params: SystemPromptParams): string {
    // Original source: line 331
    const lines: string[] = [
        "You are a personal assistant running inside Clawdbot.",
        "",
    ];

    // 1. Tooling & Tool Call Style
    lines.push(...buildToolingSection(params.tools));

    // 2. Skills
    if (params.skills) {
        lines.push(...buildSkillsSection(params.skills));
    }

    // 3. Memory
    lines.push(...buildMemorySection(params.memoryEnabled ?? false));

    // 4. Workspace
    // Original source: lines 397-399
    lines.push(
        "## Workspace",
        `Your working directory is: ${params.workspaceDir}`,
        "Treat this directory as the single global workspace for file operations unless explicitly instructed otherwise.",
        ""
    );

    // 5. Time
    lines.push(...buildTimeSection(params.userTimezone));

    // 6. Project Context (User Files)
    if (params.contextFiles) {
        // Original source: lines 449-450 "Workspace Files (injected)" concept mapped to buildContextFilesSection
        lines.push(...buildContextFilesSection(params.contextFiles));
    }

    // 7. Extra Instructions
    if (params.extraSystemPrompt?.trim()) {
        lines.push("## Group Chat Context", params.extraSystemPrompt.trim(), ""); // Using "Group Chat Context" header as per original
    }

    return lines.filter(Boolean).join("\n");
}
