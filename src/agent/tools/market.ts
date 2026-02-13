/**
 * Market Tools
 * Purpose: Agent tools for token prices, market data, and search
 * Tools:
 *   - get_token_price: Get real-time token price (replaces mock)
 *   - get_token_detail: Get token market details
 *   - get_token_24h: Get 24h price statistics
 *   - get_token_kline: Get K-line data
 *   - search_token: Search tokens on DEX
 */

import { globalRegistry, ToolResult } from '../tools';
import { getMarketService } from '../../services/market.service';
import { getTokenService } from '../../services/token.service';

// ============ Tool: get_token_price (Override existing mock) ============

// Remove existing registration if any
try {
    // We'll re-register with the same name to override
} catch (e) { }

globalRegistry.register(
    'get_token_price',
    {
        type: "function",
        function: {
            name: "get_token_price",
            description: "获取代币实时价格和24小时数据。支持通过符号或地址查询。",
            parameters: {
                type: "object",
                properties: {
                    tokenAddress: {
                        type: "string",
                        description: "代币合约地址（与symbol二选一）"
                    },
                    symbol: {
                        type: "string",
                        description: "代币符号如BTC/ETH（与tokenAddress二选一，需先搜索获取地址）"
                    },
                    network: {
                        type: "string",
                        description: "网络标识 (ethereum/bsc/polygon/arbitrum/solana等)"
                    }
                },
                required: ["network"]
            }
        }
    },
    async (args, ctx): Promise<ToolResult> => {
        try {
            // If only symbol provided, need to search first
            if (!args.tokenAddress && args.symbol) {
                const tokenService = getTokenService();
                const results = await tokenService.dexSearch(args.symbol, args.network);
                if (results.length === 0) {
                    return {
                        status: "error",
                        message: `Token ${args.symbol} not found on ${args.network}`
                    };
                }
                args.tokenAddress = results[0].tokenAddress;
            }

            if (!args.tokenAddress) {
                return {
                    status: "error",
                    message: "Either tokenAddress or symbol is required"
                };
            }

            const marketService = getMarketService();
            const data24h = await marketService.getToken24h(args.tokenAddress, args.network);

            return {
                status: "success",
                data: {
                    tokenAddress: args.tokenAddress,
                    symbol: data24h.symbol,
                    network: args.network,
                    priceUsd: data24h.priceUsd,
                    priceChange24h: data24h.priceChange24h,
                    priceChangePercent24h: data24h.priceChangePercent24h,
                    volume24h: data24h.volume24h,
                    high24h: data24h.high24h,
                    low24h: data24h.low24h,
                    trades24h: data24h.trades24h
                }
            };
        } catch (error: any) {
            return {
                status: "error",
                message: `Failed to get token price: ${error.message}`,
                code: error.code?.toString()
            };
        }
    },
    'market'
);

// ============ Tool: get_token_detail ============

globalRegistry.register(
    'get_token_detail',
    {
        type: "function",
        function: {
            name: "get_token_detail",
            description: "获取代币详细信息，包括市值、流通量、持有人数等。",
            parameters: {
                type: "object",
                properties: {
                    tokenAddress: {
                        type: "string",
                        description: "代币合约地址"
                    },
                    network: {
                        type: "string",
                        description: "网络标识"
                    }
                },
                required: ["tokenAddress", "network"]
            }
        }
    },
    async (args, ctx): Promise<ToolResult> => {
        try {
            const marketService = getMarketService();
            const detail = await marketService.getTokenDetail(args.tokenAddress, args.network);

            return {
                status: "success",
                data: {
                    tokenAddress: detail.tokenAddress,
                    symbol: detail.symbol,
                    name: detail.name,
                    network: detail.network,
                    priceUsd: detail.priceUsd,
                    marketCap: detail.marketCap,
                    totalSupply: detail.totalSupply,
                    circulatingSupply: detail.circulatingSupply,
                    holders: detail.holders,
                    website: detail.website,
                    twitter: detail.twitter
                }
            };
        } catch (error: any) {
            return {
                status: "error",
                message: `Failed to get token detail: ${error.message}`,
                code: error.code?.toString()
            };
        }
    },
    'market'
);

// ============ Tool: get_token_kline ============

globalRegistry.register(
    'get_token_kline',
    {
        type: "function",
        function: {
            name: "get_token_kline",
            description: "获取代币K线图数据。用于分析价格走势。",
            parameters: {
                type: "object",
                properties: {
                    tokenAddress: {
                        type: "string",
                        description: "代币合约地址"
                    },
                    network: {
                        type: "string",
                        description: "网络标识"
                    },
                    interval: {
                        type: "string",
                        enum: ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"],
                        description: "时间间隔"
                    },
                    limit: {
                        type: "number",
                        description: "数据条数，默认100"
                    }
                },
                required: ["tokenAddress", "network", "interval"]
            }
        }
    },
    async (args, ctx): Promise<ToolResult> => {
        try {
            const marketService = getMarketService();
            const klines = await marketService.getTokenKline(
                args.tokenAddress,
                args.network,
                args.interval,
                args.limit || 100
            );

            // Calculate simple statistics
            const closes = klines.map(k => parseFloat(k.close));
            const high = Math.max(...closes);
            const low = Math.min(...closes);
            const latest = closes[closes.length - 1];
            const first = closes[0];
            const changePercent = ((latest - first) / first * 100).toFixed(2);

            return {
                status: "success",
                data: {
                    tokenAddress: args.tokenAddress,
                    network: args.network,
                    interval: args.interval,
                    dataPoints: klines.length,
                    latestPrice: latest.toString(),
                    periodHigh: high.toString(),
                    periodLow: low.toString(),
                    periodChangePercent: changePercent + '%',
                    klines: klines.slice(-10).map(k => ({
                        time: new Date(k.timestamp).toISOString(),
                        open: k.open,
                        high: k.high,
                        low: k.low,
                        close: k.close,
                        volume: k.volume
                    }))
                }
            };
        } catch (error: any) {
            return {
                status: "error",
                message: `Failed to get K-line data: ${error.message}`,
                code: error.code?.toString()
            };
        }
    },
    'market'
);

// ============ Tool: search_token ============

globalRegistry.register(
    'search_token',
    {
        type: "function",
        function: {
            name: "search_token",
            description: "在DEX上搜索代币。用于查找代币地址、验证代币是否存在。",
            parameters: {
                type: "object",
                properties: {
                    keyword: {
                        type: "string",
                        description: "搜索关键词（代币名称或符号）"
                    },
                    network: {
                        type: "string",
                        description: "网络标识（可选，不传则搜索所有网络）"
                    }
                },
                required: ["keyword"]
            }
        }
    },
    async (args, ctx): Promise<ToolResult> => {
        try {
            const tokenService = getTokenService();
            const results = await tokenService.dexSearch(args.keyword, args.network);

            return {
                status: "success",
                data: {
                    keyword: args.keyword,
                    network: args.network || 'all',
                    resultCount: results.length,
                    tokens: results.slice(0, 10).map(t => ({
                        tokenAddress: t.tokenAddress,
                        network: t.network,
                        symbol: t.symbol,
                        name: t.name,
                        priceUsd: t.priceUsd,
                        verified: t.verified
                    }))
                }
            };
        } catch (error: any) {
            return {
                status: "error",
                message: `Failed to search tokens: ${error.message}`,
                code: error.code?.toString()
            };
        }
    },
    'market'
);

// ============ Tool: get_hot_tokens ============

globalRegistry.register(
    'get_hot_tokens',
    {
        type: "function",
        function: {
            name: "get_hot_tokens",
            description: "获取热门代币列表。用于推荐热门交易标的。",
            parameters: {
                type: "object",
                properties: {}
            }
        }
    },
    async (args, ctx): Promise<ToolResult> => {
        try {
            const tokenService = getTokenService();
            const hotTokens = await tokenService.getHotTokens();

            return {
                status: "success",
                data: {
                    tokens: hotTokens.slice(0, 10).map(t => ({
                        symbol: t.symbol,
                        name: t.name,
                        tokenAddress: t.tokenAddress,
                        network: t.network,
                        priceUsd: t.priceUsd,
                        priceChange24h: t.priceChange24h,
                        volume24h: t.volume24h
                    }))
                }
            };
        } catch (error: any) {
            return {
                status: "error",
                message: `Failed to get hot tokens: ${error.message}`,
                code: error.code?.toString()
            };
        }
    },
    'market'
);
