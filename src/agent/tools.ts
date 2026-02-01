import fs from 'fs';
import path from 'path';
import { ChatCompletionTool } from 'openai/resources/chat/completions';

// ============ Types ============

export interface ToolDefinition {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: {
            type: "object";
            properties: Record<string, any>;
            required?: string[];
        };
    };
}

export interface ToolResult {
    status: "success" | "error";
    data?: any;
    message?: string;
    code?: string;
}

export type ToolExecutor = (args: Record<string, any>, context: ToolContext) => Promise<ToolResult>;

export interface ToolContext {
    workspaceRoot: string;
}

interface RegisteredTool {
    definition: ToolDefinition;
    executor: ToolExecutor;
    category?: string;
}

// ============ Tool Registry ============

class ToolRegistry {
    private tools: Map<string, RegisteredTool> = new Map();

    register(name: string, definition: ToolDefinition, executor: ToolExecutor, category?: string) {
        if (definition.function.name !== name) {
            definition.function.name = name;
        }
        this.tools.set(name, { definition, executor, category });
    }

    get(name: string): RegisteredTool | undefined {
        return this.tools.get(name);
    }

    getAll(): RegisteredTool[] {
        return Array.from(this.tools.values());
    }

    getDefinitions(): ChatCompletionTool[] {
        return this.getAll().map(t => t.definition as ChatCompletionTool);
    }

    getByCategory(category: string): RegisteredTool[] {
        return this.getAll().filter(t => t.category === category);
    }

    list(): string[] {
        return Array.from(this.tools.keys());
    }
}

// Global registry
export const globalRegistry = new ToolRegistry();

// ============ Built-in Tools ============

// --- File System Tools ---

globalRegistry.register(
    'list_files',
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
    async (args, ctx) => {
        const targetPath = path.resolve(ctx.workspaceRoot, args.path || '.');
        if (!targetPath.startsWith(ctx.workspaceRoot)) {
            return { status: "error", message: "Access denied: Path outside workspace" };
        }
        try {
            const files = fs.readdirSync(targetPath);
            return { status: "success", data: { files } };
        } catch (e: any) {
            return { status: "error", message: e.message };
        }
    },
    'filesystem'
);

globalRegistry.register(
    'read_file',
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
    async (args, ctx) => {
        const targetPath = path.resolve(ctx.workspaceRoot, args.path);
        if (!targetPath.startsWith(ctx.workspaceRoot)) {
            return { status: "error", message: "Access denied: Path outside workspace" };
        }
        try {
            const content = fs.readFileSync(targetPath, 'utf-8');
            return { status: "success", data: { content } };
        } catch (e: any) {
            return { status: "error", message: `File not found or unreadable: ${e.message}` };
        }
    },
    'filesystem'
);

globalRegistry.register(
    'write_file',
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
    async (args, ctx) => {
        const targetPath = path.resolve(ctx.workspaceRoot, args.path);
        if (!targetPath.startsWith(ctx.workspaceRoot)) {
            return { status: "error", message: "Access denied: Path outside workspace" };
        }
        try {
            const dir = path.dirname(targetPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(targetPath, args.content);
            return { status: "success", message: `File written to ${args.path}` };
        } catch (e: any) {
            return { status: "error", message: e.message };
        }
    },
    'filesystem'
);

// --- Web3 Tools ---

globalRegistry.register(
    'get_exchange_balance',
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
    },
    async (args, ctx) => {
        console.log(`[Web3] Querying ${args.exchange || 'all'} balance...`);
        // Mock data - replace with real API call
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
    },
    'web3'
);

globalRegistry.register(
    'get_token_price',
    {
        type: "function",
        function: {
            name: "get_token_price",
            description: "Get the current price of a cryptocurrency token",
            parameters: {
                type: "object",
                properties: {
                    symbol: { type: "string", description: "Token symbol (e.g. BTC, ETH)" },
                    vs_currency: { type: "string", description: "Quote currency (default: USD)" }
                },
                required: ["symbol"]
            }
        }
    },
    async (args, ctx) => {
        const symbol = args.symbol.toUpperCase();
        console.log(`[Web3] Getting price for ${symbol}...`);
        // Mock prices - replace with real API
        const prices: Record<string, number> = {
            BTC: 65000,
            ETH: 3500,
            SOL: 145,
            USDT: 1,
            USDC: 1,
        };
        const price = prices[symbol];
        if (!price) {
            return { status: "error", message: `Token ${symbol} not found` };
        }
        return {
            status: "success",
            data: {
                symbol,
                price,
                currency: args.vs_currency || 'USD',
                timestamp: new Date().toISOString()
            }
        };
    },
    'web3'
);

globalRegistry.register(
    'get_wallet_balance',
    {
        type: "function",
        function: {
            name: "get_wallet_balance",
            description: "Get the balance of an on-chain wallet address",
            parameters: {
                type: "object",
                properties: {
                    address: { type: "string", description: "Wallet address or ENS name" },
                    chain: { type: "string", description: "Blockchain network (ethereum, bsc, polygon)" }
                },
                required: ["address"]
            }
        }
    },
    async (args, ctx) => {
        const chain = args.chain || 'ethereum';
        console.log(`[Web3] Querying ${args.address} on ${chain}...`);
        // Mock data - replace with real blockchain query
        return {
            status: "success",
            data: {
                address: args.address,
                chain,
                native_balance: "1.234",
                native_symbol: chain === 'ethereum' ? 'ETH' : chain === 'bsc' ? 'BNB' : 'MATIC',
                tokens: [
                    { symbol: "USDC", balance: "1000.00" },
                    { symbol: "LINK", balance: "50.5" }
                ],
                timestamp: new Date().toISOString()
            }
        };
    },
    'web3'
);

// ============ Tool Manager ============

export class ToolManager {
    private workspaceRoot: string;
    private registry: ToolRegistry;

    constructor(workspaceRoot: string, registry?: ToolRegistry) {
        this.workspaceRoot = workspaceRoot;
        this.registry = registry || globalRegistry;
    }

    getTools(): ChatCompletionTool[] {
        return this.registry.getDefinitions();
    }

    getToolsByCategory(category: string): ChatCompletionTool[] {
        return this.registry.getByCategory(category).map(t => t.definition as ChatCompletionTool);
    }

    listTools(): string[] {
        return this.registry.list();
    }

    async executeTool(name: string, args: any): Promise<ToolResult> {
        console.log(`[Tool Exec] ${name}`, args);

        const tool = this.registry.get(name);
        if (!tool) {
            return { status: "error", message: `Tool ${name} not found` };
        }

        const context: ToolContext = {
            workspaceRoot: this.workspaceRoot,
        };

        try {
            return await tool.executor(args, context);
        } catch (err: any) {
            console.error(`[Tool Error] ${name}:`, err);
            return { status: "error", message: `Unexpected error: ${err.message}` };
        }
    }

    /**
     * Register a custom tool
     */
    registerTool(name: string, definition: ToolDefinition, executor: ToolExecutor, category?: string) {
        this.registry.register(name, definition, executor, category);
    }
}
