/**
 * Wallet Tools
 * Purpose: Agent tools for wallet balance, holdings, and transaction history
 * Tools:
 *   - get_wallet_balance: Get token balance for a wallet
 *   - get_holding_list: Get all holdings for a wallet
 *   - get_tx_history: Get transaction history
 */

import { globalRegistry, ToolResult } from '../tools';
import { getWalletService } from '../../services/wallet.service';

// ============ Tool: get_wallet_balance ============

globalRegistry.register(
    'get_wallet_balance',
    {
        type: "function",
        function: {
            name: "get_wallet_balance",
            description: "获取钱包代币余额。不传tokenAddress则查询原生币(ETH/BNB/MATIC等)。用于检查用户资产、交易前余额确认。",
            parameters: {
                type: "object",
                properties: {
                    walletAddress: {
                        type: "string",
                        description: "钱包地址"
                    },
                    network: {
                        type: "string",
                        description: "网络标识 (ethereum/bsc/polygon/arbitrum/optimism/solana/base)"
                    },
                    tokenAddress: {
                        type: "string",
                        description: "代币合约地址（可选，不传则查询原生币）"
                    }
                },
                required: ["walletAddress", "network"]
            }
        }
    },
    async (args, ctx): Promise<ToolResult> => {
        try {
            const walletService = getWalletService();
            const balance = await walletService.getTokenBalance(
                args.walletAddress,
                args.network,
                args.tokenAddress
            );

            return {
                status: "success",
                data: {
                    walletAddress: args.walletAddress,
                    network: args.network,
                    tokenAddress: args.tokenAddress || 'native',
                    balance: balance.balance,
                    symbol: balance.symbol,
                    decimals: balance.decimals,
                    priceUsd: balance.priceUsd,
                    valueUsd: balance.valueUsd
                }
            };
        } catch (error: any) {
            return {
                status: "error",
                message: `Failed to get wallet balance: ${error.message}`,
                code: error.code?.toString()
            };
        }
    },
    'wallet'
);

// ============ Tool: get_holding_list ============

globalRegistry.register(
    'get_holding_list',
    {
        type: "function",
        function: {
            name: "get_holding_list",
            description: "获取钱包所有代币持仓列表。返回每个代币的余额、价格、价值。用于资产分析、持仓汇总。",
            parameters: {
                type: "object",
                properties: {
                    walletAddress: {
                        type: "string",
                        description: "钱包地址"
                    },
                    network: {
                        type: "string",
                        description: "网络标识 (ethereum/bsc/polygon/arbitrum/optimism/solana/base)"
                    }
                },
                required: ["walletAddress", "network"]
            }
        }
    },
    async (args, ctx): Promise<ToolResult> => {
        try {
            const walletService = getWalletService();
            const holdings = await walletService.getHolding(
                args.walletAddress,
                args.network
            );

            // Calculate total value
            const totalValueUsd = holdings.reduce((sum, item) => {
                return sum + parseFloat(item.valueUsd || '0');
            }, 0);

            return {
                status: "success",
                data: {
                    walletAddress: args.walletAddress,
                    network: args.network,
                    holdings: holdings.map(h => ({
                        symbol: h.symbol,
                        name: h.name,
                        balance: h.balance,
                        priceUsd: h.priceUsd,
                        valueUsd: h.valueUsd,
                        price24hChange: h.price24hChange
                    })),
                    totalValueUsd: totalValueUsd.toFixed(2),
                    tokenCount: holdings.length
                }
            };
        } catch (error: any) {
            return {
                status: "error",
                message: `Failed to get holdings: ${error.message}`,
                code: error.code?.toString()
            };
        }
    },
    'wallet'
);

// ============ Tool: get_tx_history ============

globalRegistry.register(
    'get_tx_history',
    {
        type: "function",
        function: {
            name: "get_tx_history",
            description: "获取钱包交易历史记录。可按代币筛选。用于分析交易行为、查询历史交易。",
            parameters: {
                type: "object",
                properties: {
                    walletAddress: {
                        type: "string",
                        description: "钱包地址"
                    },
                    network: {
                        type: "string",
                        description: "网络标识"
                    },
                    page: {
                        type: "number",
                        description: "页码，默认1"
                    },
                    size: {
                        type: "number",
                        description: "每页数量，默认20"
                    },
                    tokenAddress: {
                        type: "string",
                        description: "按代币地址筛选（可选）"
                    }
                },
                required: ["walletAddress", "network"]
            }
        }
    },
    async (args, ctx): Promise<ToolResult> => {
        try {
            const walletService = getWalletService();
            const history = await walletService.getTxHistory(
                args.walletAddress,
                args.network,
                args.page || 1,
                args.size || 20,
                args.tokenAddress
            );

            return {
                status: "success",
                data: {
                    walletAddress: args.walletAddress,
                    network: args.network,
                    transactions: history.items.map(tx => ({
                        txHash: tx.txHash,
                        timestamp: tx.timestamp,
                        type: tx.type,
                        symbol: tx.symbol,
                        amount: tx.amount,
                        status: tx.status,
                        from: tx.from,
                        to: tx.to
                    })),
                    total: history.total,
                    page: history.page,
                    size: history.size
                }
            };
        } catch (error: any) {
            return {
                status: "error",
                message: `Failed to get transaction history: ${error.message}`,
                code: error.code?.toString()
            };
        }
    },
    'wallet'
);
