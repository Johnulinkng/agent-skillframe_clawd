/**
 * Trade Tools
 * Purpose: Agent tools for trading operations
 * Tools:
 *   - check_usdc_balance: Check if USDC balance is sufficient for trading
 *   - get_transaction_settings: Get gas/slippage settings
 *   - create_trade_intent: Create trade intent (opens trade window in frontend)
 *   - sign_and_send_transaction: Execute transaction via Privy signing
 */

import { globalRegistry, ToolResult } from '../tools';
import { getWalletService } from '../../services/wallet.service';
import { getTransactionService } from '../../services/transaction.service';

// ============ Common USDC Addresses ============

const USDC_ADDRESSES: Record<string, string> = {
    ethereum: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    polygon: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    arbitrum: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
    optimism: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
    bsc: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    solana: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC on Solana
};

// ============ Tool: check_usdc_balance ============

globalRegistry.register(
    'check_usdc_balance',
    {
        type: "function",
        function: {
            name: "check_usdc_balance",
            description: "检查用户USDC余额是否足够进行交易。如果余额不足，返回充值提醒和client_action。这是交易前的必要检查步骤。",
            parameters: {
                type: "object",
                properties: {
                    walletAddress: {
                        type: "string",
                        description: "用户钱包地址"
                    },
                    network: {
                        type: "string",
                        description: "网络标识 (ethereum/polygon/arbitrum/optimism/bsc/base/solana)"
                    },
                    requiredAmount: {
                        type: "number",
                        description: "需要的USDC数量（可选，用于判断是否足够）"
                    }
                },
                required: ["walletAddress", "network"]
            }
        }
    },
    async (args, ctx): Promise<ToolResult> => {
        try {
            const walletService = getWalletService();
            const usdcAddress = USDC_ADDRESSES[args.network.toLowerCase()];

            if (!usdcAddress) {
                return {
                    status: "error",
                    message: `Unsupported network for USDC: ${args.network}`
                };
            }

            const balance = await walletService.getTokenBalance(
                args.walletAddress,
                args.network,
                usdcAddress
            );

            const balanceNum = parseFloat(balance.balance);
            const requiredAmount = args.requiredAmount || 0;
            const sufficient = balanceNum >= requiredAmount;

            // If insufficient, return client_action to prompt deposit
            if (!sufficient) {
                return {
                    status: "success",
                    data: {
                        balance: balance.balance,
                        symbol: 'USDC',
                        sufficient: false,
                        requiredAmount,
                        shortfall: (requiredAmount - balanceNum).toFixed(2),
                        message: `USDC余额不足。当前余额: ${balance.balance} USDC, 需要: ${requiredAmount} USDC`,
                        client_action: {
                            type: "SHOW_DEPOSIT_PROMPT",
                            params: {
                                token: "USDC",
                                tokenAddress: usdcAddress,
                                network: args.network,
                                suggestedAmount: (requiredAmount - balanceNum + 10).toFixed(2) // Add buffer
                            }
                        }
                    }
                };
            }

            return {
                status: "success",
                data: {
                    balance: balance.balance,
                    symbol: 'USDC',
                    sufficient: true,
                    message: `USDC余额充足: ${balance.balance} USDC`
                }
            };
        } catch (error: any) {
            return {
                status: "error",
                message: `Failed to check USDC balance: ${error.message}`,
                code: error.code?.toString()
            };
        }
    },
    'trade'
);

// ============ Tool: get_transaction_settings ============

globalRegistry.register(
    'get_transaction_settings',
    {
        type: "function",
        function: {
            name: "get_transaction_settings",
            description: "获取交易配置信息（gas价格、gas限制、滑点）。用于交易前展示预估手续费。",
            parameters: {
                type: "object",
                properties: {
                    network: {
                        type: "string",
                        description: "网络标识"
                    },
                    fromAddress: {
                        type: "string",
                        description: "发送地址"
                    },
                    toAddress: {
                        type: "string",
                        description: "接收地址（可选，与data一起传）"
                    },
                    data: {
                        type: "string",
                        description: "交易数据（可选，与toAddress一起传）"
                    }
                },
                required: ["network", "fromAddress"]
            }
        }
    },
    async (args, ctx): Promise<ToolResult> => {
        try {
            const txService = getTransactionService();
            const settings = await txService.getSettings(
                args.network,
                args.fromAddress,
                args.toAddress,
                args.data
            );

            // Find enabled setting or default to first
            const activeSettings = settings.find(s => s.enabled) || settings[0];

            // Calculate estimated fee (for EVM chains)
            let estimatedFee = '0';
            if (activeSettings && args.network !== 'solana') {
                const gasPrice = BigInt(activeSettings.gasPrice);
                const gasLimit = BigInt(activeSettings.gasLimit);
                const feeWei = gasPrice * gasLimit;
                // Convert to ETH (18 decimals)
                estimatedFee = (Number(feeWei) / 1e18).toFixed(8);
            }

            return {
                status: "success",
                data: {
                    network: args.network,
                    settings: settings.map(s => ({
                        index: s.index,
                        gasPrice: s.gasPrice,
                        gasLimit: s.gasLimit,
                        slippage: s.slippage,
                        slippagePercent: (parseFloat(s.slippage) * 100).toFixed(2) + '%',
                        enabled: s.enabled
                    })),
                    activeIndex: activeSettings?.index ?? 0,
                    estimatedFeeNative: estimatedFee
                }
            };
        } catch (error: any) {
            return {
                status: "error",
                message: `Failed to get transaction settings: ${error.message}`,
                code: error.code?.toString()
            };
        }
    },
    'trade'
);

// ============ Tool: create_trade_intent ============

globalRegistry.register(
    'create_trade_intent',
    {
        type: "function",
        function: {
            name: "create_trade_intent",
            description: "创建交易意图，返回让前端调起交易窗口的指令。支持现货和合约交易。这是触发交易界面的主要工具。",
            parameters: {
                type: "object",
                properties: {
                    symbol: {
                        type: "string",
                        description: "代币符号，如 BTC, ETH, SOL"
                    },
                    tokenAddress: {
                        type: "string",
                        description: "代币合约地址（可选）"
                    },
                    side: {
                        type: "string",
                        enum: ["BUY", "SELL"],
                        description: "买入(BUY)或卖出(SELL)"
                    },
                    tradeType: {
                        type: "string",
                        enum: ["SPOT", "CONTRACT"],
                        description: "现货(SPOT)或合约(CONTRACT)"
                    },
                    network: {
                        type: "string",
                        description: "网络标识"
                    },
                    amount: {
                        type: "string",
                        description: "交易数量（可选）"
                    },
                    amountUsd: {
                        type: "string",
                        description: "交易USD金额（可选）"
                    }
                },
                required: ["symbol", "side", "network"]
            }
        }
    },
    async (args, ctx): Promise<ToolResult> => {
        // This tool does NOT call any API
        // It returns a client_action for the frontend to handle
        return {
            status: "success",
            data: {
                message: `已准备好 ${args.side === 'BUY' ? '买入' : '卖出'} ${args.symbol} 的交易`,
                client_action: {
                    type: "OPEN_TRADE_WINDOW",
                    params: {
                        symbol: args.symbol,
                        tokenAddress: args.tokenAddress,
                        side: args.side,
                        tradeType: args.tradeType || "SPOT",
                        network: args.network,
                        amount: args.amount,
                        amountUsd: args.amountUsd
                    }
                }
            }
        };
    },
    'trade'
);

// ============ Tool: sign_and_send_transaction ============
// IMPORTANT: This tool requires user confirmation before executing!

globalRegistry.register(
    'sign_and_send_transaction',
    {
        type: "function",
        function: {
            name: "sign_and_send_transaction",
            description: "Prepare a transaction for user confirmation. This returns a CONFIRM_TRANSACTION action that the user must approve before the transaction is actually sent. Do NOT call this directly without informing the user about the transaction details first.",
            parameters: {
                type: "object",
                properties: {
                    network: {
                        type: "string",
                        description: "Network identifier (ethereum/bsc/polygon/arbitrum/solana/base)"
                    },
                    from: {
                        type: "string",
                        description: "Sender wallet address"
                    },
                    to: {
                        type: "string",
                        description: "Recipient address or contract address"
                    },
                    value: {
                        type: "string",
                        description: "Amount in wei format"
                    },
                    data: {
                        type: "string",
                        description: "Transaction data / calldata (optional)"
                    },
                    gasPrice: {
                        type: "string",
                        description: "Gas price in wei (optional)"
                    },
                    gasLimit: {
                        type: "string",
                        description: "Gas limit (optional)"
                    },
                    tokenSymbol: {
                        type: "string",
                        description: "Token symbol for display (optional)"
                    },
                    tokenAmount: {
                        type: "string",
                        description: "Human-readable token amount for display (optional)"
                    }
                },
                required: ["network", "from", "to", "value"]
            }
        }
    },
    async (args, ctx): Promise<ToolResult> => {
        // Calculate estimated gas fee for display
        let estimatedFeeNative = '0';
        let estimatedFeeUsd = '0';

        if (args.gasPrice && args.gasLimit) {
            const gasPrice = BigInt(args.gasPrice);
            const gasLimit = BigInt(args.gasLimit);
            const feeWei = gasPrice * gasLimit;
            estimatedFeeNative = (Number(feeWei) / 1e18).toFixed(6);
            // TODO: Get native token price for USD estimation
        }

        // Return confirmation action - frontend must handle this
        // Transaction will NOT be sent until user confirms
        return {
            status: "success",
            data: {
                requiresConfirmation: true,
                message: `Please confirm the transaction before it is sent.`,
                transactionSummary: {
                    network: args.network,
                    from: args.from,
                    to: args.to,
                    value: args.value,
                    tokenSymbol: args.tokenSymbol || 'ETH',
                    tokenAmount: args.tokenAmount || (Number(BigInt(args.value)) / 1e18).toFixed(6),
                    estimatedFee: estimatedFeeNative,
                    estimatedFeeUsd: estimatedFeeUsd
                },
                client_action: {
                    type: "CONFIRM_TRANSACTION",
                    params: {
                        // Full transaction details for confirmation dialog
                        network: args.network,
                        from: args.from,
                        to: args.to,
                        value: args.value,
                        data: args.data,
                        gasPrice: args.gasPrice,
                        gasLimit: args.gasLimit,
                        tokenSymbol: args.tokenSymbol,
                        tokenAmount: args.tokenAmount,
                        estimatedFee: estimatedFeeNative,
                        // Callback action after user confirms
                        onConfirm: {
                            action: "EXECUTE_TRANSACTION",
                            endpoint: "/privy/sign-and-send-transaction"
                        }
                    }
                }
            }
        };
    },
    'trade'
);

// ============ Tool: execute_confirmed_transaction ============
// This is called by frontend AFTER user confirms the transaction

globalRegistry.register(
    'execute_confirmed_transaction',
    {
        type: "function",
        function: {
            name: "execute_confirmed_transaction",
            description: "Execute a transaction that has been confirmed by the user. This should only be called by the frontend after user approval via CONFIRM_TRANSACTION action.",
            parameters: {
                type: "object",
                properties: {
                    network: { type: "string" },
                    from: { type: "string" },
                    to: { type: "string" },
                    value: { type: "string" },
                    data: { type: "string" },
                    gasPrice: { type: "string" },
                    gasLimit: { type: "string" },
                    userConfirmed: {
                        type: "boolean",
                        description: "Must be true - confirms user has approved this transaction"
                    }
                },
                required: ["network", "from", "to", "value", "userConfirmed"]
            }
        }
    },
    async (args, ctx): Promise<ToolResult> => {
        // Safety check - user must have confirmed
        if (!args.userConfirmed) {
            return {
                status: "error",
                message: "Transaction requires user confirmation. Please confirm the transaction first."
            };
        }

        try {
            const txService = getTransactionService();
            const result = await txService.signAndSendTransaction({
                network: args.network,
                from: args.from,
                to: args.to,
                value: args.value,
                data: args.data,
                gasPrice: args.gasPrice,
                gasLimit: args.gasLimit,
            });

            return {
                status: "success",
                data: {
                    txHash: result.txHash,
                    status: result.status,
                    blockNumber: result.blockNumber,
                    gasUsed: result.gasUsed,
                    message: `Transaction submitted successfully! Hash: ${result.txHash}`,
                    client_action: {
                        type: "SHOW_TX_STATUS",
                        params: {
                            txHash: result.txHash,
                            network: args.network,
                            status: result.status
                        }
                    }
                }
            };
        } catch (error: any) {
            return {
                status: "error",
                message: `Transaction failed: ${error.message}`,
                code: error.code?.toString()
            };
        }
    },
    'trade'
);

