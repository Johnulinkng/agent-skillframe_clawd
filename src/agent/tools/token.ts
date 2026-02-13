/**
 * Token Tools
 * Purpose: Agent tools for token management
 * Tools:
 *   - get_followed_tokens: Get user's followed tokens
 *   - follow_token: Follow/unfollow a token
 *   - get_hot_tokens: Get hot/trending tokens (moved from market.ts)
 *   - check_token_security: Check token contract security (moved from news.ts)
 */

import { globalRegistry, ToolResult } from '../tools';
import { getTokenService } from '../../services/token.service';
import { getSecurityService } from '../../services/security.service';

// ============ Tool: get_followed_tokens ============

globalRegistry.register(
    'get_followed_tokens',
    {
        type: "function",
        function: {
            name: "get_followed_tokens",
            description: "Get list of tokens that the user is following. Returns token prices and 24h changes.",
            parameters: {
                type: "object",
                properties: {
                    network: {
                        type: "string",
                        description: "Filter by network (optional)"
                    },
                    sortType: {
                        type: "string",
                        enum: ["VOLUME_USD", "MARKET_CAP", "PRICE", "PERCENTAGE", "UPDATE_TIME"],
                        description: "Sort by field"
                    },
                    sortAsc: {
                        type: "boolean",
                        description: "Sort ascending, default false"
                    }
                },
                required: []
            }
        }
    },
    async (args, ctx): Promise<ToolResult> => {
        try {
            const tokenService = getTokenService();
            const tokens = await tokenService.getFollowedTokens(
                args.network,
                args.sortType,
                args.sortAsc || false
            );

            return {
                status: "success",
                data: {
                    tokens: tokens.map(t => ({
                        symbol: t.symbol,
                        name: t.name,
                        tokenAddress: t.tokenAddress,
                        network: t.network,
                        priceUsd: t.priceUsd,
                        priceChange24h: t.priceChange24h,
                        marketCap: t.marketCap,
                        volume24h: t.volume24h
                    })),
                    totalCount: tokens.length
                }
            };
        } catch (error: any) {
            return {
                status: "error",
                message: `Failed to get followed tokens: ${error.message}`,
                code: error.code?.toString()
            };
        }
    },
    'token'
);

// ============ Tool: follow_token ============

globalRegistry.register(
    'follow_token',
    {
        type: "function",
        function: {
            name: "follow_token",
            description: "Follow or unfollow a token to track its price and updates.",
            parameters: {
                type: "object",
                properties: {
                    tokenAddress: {
                        type: "string",
                        description: "Token contract address"
                    },
                    network: {
                        type: "string",
                        description: "Network identifier"
                    },
                    action: {
                        type: "string",
                        enum: ["follow", "unfollow"],
                        description: "Follow or unfollow action"
                    }
                },
                required: ["tokenAddress", "network", "action"]
            }
        }
    },
    async (args, ctx): Promise<ToolResult> => {
        try {
            const tokenService = getTokenService();

            if (args.action === 'follow') {
                await tokenService.followToken(args.tokenAddress, args.network);
            } else {
                await tokenService.unfollowToken(args.tokenAddress, args.network);
            }

            return {
                status: "success",
                data: {
                    tokenAddress: args.tokenAddress,
                    network: args.network,
                    action: args.action,
                    message: args.action === 'follow'
                        ? 'Successfully followed the token!'
                        : 'Successfully unfollowed the token!'
                }
            };
        } catch (error: any) {
            return {
                status: "error",
                message: `Failed to ${args.action} token: ${error.message}`,
                code: error.code?.toString()
            };
        }
    },
    'token'
);

// ============ Tool: get_token_warnings ============

globalRegistry.register(
    'get_token_warnings',
    {
        type: "function",
        function: {
            name: "get_token_warnings",
            description: "Get list of token warnings and alerts. Use to check for potential risks.",
            parameters: {
                type: "object",
                properties: {}
            }
        }
    },
    async (args, ctx): Promise<ToolResult> => {
        try {
            const tokenService = getTokenService();
            const warnings = await tokenService.getWarningList();

            return {
                status: "success",
                data: {
                    warnings: warnings.map(w => ({
                        tokenAddress: w.tokenAddress,
                        network: w.network,
                        warningType: w.warningType,
                        message: w.message,
                        severity: w.severity,
                        timestamp: w.timestamp
                    })),
                    totalCount: warnings.length
                }
            };
        } catch (error: any) {
            return {
                status: "error",
                message: `Failed to get token warnings: ${error.message}`,
                code: error.code?.toString()
            };
        }
    },
    'token'
);
