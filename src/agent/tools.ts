import fs from 'fs';
import path from 'path';
import { ChatCompletionTool } from 'openai/resources/chat/completions';

// --- Tool Definitions ---

const tools: ChatCompletionTool[] = [
    {
        type: "function",
        function: {
            name: "list_files",
            description: "List files in a directory",
            parameters: {
                type: "object",
                properties: {
                    path: {
                        type: "string",
                        description: "The relative path to list. Defaults to current directory."
                    }
                }
            }
        }
    },
    {
        type: "function",
        function: {
            name: "read_file",
            description: "Read the contents of a file",
            parameters: {
                type: "object",
                properties: {
                    path: { type: "string", description: "The path to the file to read" }
                },
                required: ["path"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "write_file",
            description: "Write content to a file. Overwrites existing files.",
            parameters: {
                type: "object",
                properties: {
                    path: { type: "string", description: "The path to the file" },
                    content: { type: "string", description: "The content to write" }
                },
                required: ["path", "content"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_exchange_balance",
            description: "Get current crypto exchange balance and holdings",
            parameters: {
                type: "object",
                properties: {
                    exchange: { type: "string", description: "The exchange to query (e.g. Binance, OKX)" }
                }
            }
        }
    }
];

// --- Tool Implementation ---

export class ToolManager {
    private workspaceRoot: string;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
    }

    getTools(): ChatCompletionTool[] {
        return tools;
    }

    async executeTool(name: string, args: any): Promise<any> {
        console.log(`[Tool Exec] ${name}`, args);

        try {
            if (name === 'list_files') {
                const targetPath = path.resolve(this.workspaceRoot, args.path || '.');
                if (!targetPath.startsWith(this.workspaceRoot)) {
                    return { status: "error", message: "Access denied: Path outside workspace" };
                }
                const files = fs.readdirSync(targetPath);
                return { status: "success", data: { files } };
            }

            if (name === 'read_file') {
                const targetPath = path.resolve(this.workspaceRoot, args.path);
                if (!targetPath.startsWith(this.workspaceRoot)) {
                    return { status: "error", message: "Access denied: Path outside workspace" };
                }
                try {
                    const content = fs.readFileSync(targetPath, 'utf-8');
                    return { status: "success", data: { content } };
                } catch (e: any) {
                    return { status: "error", message: `File not found or unreadable: ${e.message}` };
                }
            }

            if (name === 'write_file') {
                const targetPath = path.resolve(this.workspaceRoot, args.path);
                if (!targetPath.startsWith(this.workspaceRoot)) {
                    return { status: "error", message: "Access denied: Path outside workspace" };
                }
                const dir = path.dirname(targetPath);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                fs.writeFileSync(targetPath, args.content);
                return { status: "success", message: `File written to ${args.path}` };
            }

            if (name === 'get_exchange_balance') {
                // 这里通常会调用交易所 API，现在返回模拟数据
                console.log(`[Web3] Querying ${args.exchange || 'all'} balance...`);
                return {
                    status: "success",
                    data: {
                        holdings: [
                            { symbol: "BTC", amount: 0.52, price: 65000, value: 33800 },
                            { symbol: "ETH", amount: 4.5, price: 3500, value: 15750 },
                            { symbol: "SOL", amount: 120, price: 145, value: 17400 }
                        ],
                        total_value_usd: 66950,
                        last_updated: new Date().toISOString()
                    }
                };
            }

            return { status: "error", message: `Tool ${name} not found` };
        } catch (err: any) {
            return { status: "error", message: `Unexpected error: ${err.message}` };
        }
    }
}
