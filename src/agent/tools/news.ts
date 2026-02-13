/**
 * News Tools
 * Purpose: Agent tools for AI analysis and AI orders
 * Tools:
 *   - get_ai_analysis: Get AI market/token analysis
 *   - create_ai_order: Create order from natural language
 *   - check_token_security: Check token contract security
 */

import { globalRegistry, ToolResult } from '../tools';
import { getNewsService } from '../../services/news.service';
import { getSecurityService } from '../../services/security.service';

// ============ Tool: get_ai_analysis ============

globalRegistry.register(
    'get_ai_analysis',
    {
        type: "function",
        function: {
            name: "get_ai_analysis",
            description: "调用AI分析师对代币或市场进行分析。返回情绪判断、置信度和分析报告。",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "分析查询内容，如'分析BTC后市走势'或'PEPE这个币怎么样'"
                    },
                    network: {
                        type: "string",
                        description: "网络标识（可选）"
                    },
                    tokenAddress: {
                        type: "string",
                        description: "代币地址（可选，用于特定代币分析）"
                    }
                },
                required: ["query"]
            }
        }
    },
    async (args, ctx): Promise<ToolResult> => {
        try {
            const newsService = getNewsService();
            const result = await newsService.aiAnalyst({
                query: args.query,
                network: args.network,
                tokenAddress: args.tokenAddress,
            });

            return {
                status: "success",
                data: {
                    query: args.query,
                    sentiment: result.sentiment,
                    sentimentLabel: result.sentiment === 'BULLISH' ? '看涨' :
                        result.sentiment === 'BEARISH' ? '看跌' : '中性',
                    confidenceScore: result.confidenceScore,
                    summary: result.summary,
                    analysis: result.analysis,
                    relatedTokens: result.relatedTokens?.map(t => ({
                        symbol: t.symbol,
                        impact: t.impact === 'POSITIVE' ? '利好' :
                            t.impact === 'NEGATIVE' ? '利空' : '中性',
                        score: t.score
                    }))
                }
            };
        } catch (error: any) {
            return {
                status: "error",
                message: `AI analysis failed: ${error.message}`,
                code: error.code?.toString()
            };
        }
    },
    'news'
);

// ============ Tool: create_ai_order ============

globalRegistry.register(
    'create_ai_order',
    {
        type: "function",
        function: {
            name: "create_ai_order",
            description: "使用自然语言创建交易订单。AI会解析指令并执行交易。",
            parameters: {
                type: "object",
                properties: {
                    instruction: {
                        type: "string",
                        description: "自然语言交易指令，如'用500U买入ETH'"
                    },
                    network: {
                        type: "string",
                        description: "网络标识"
                    },
                    amount: {
                        type: "string",
                        description: "交易金额"
                    }
                },
                required: ["instruction", "network", "amount"]
            }
        }
    },
    async (args, ctx): Promise<ToolResult> => {
        try {
            const newsService = getNewsService();
            const result = await newsService.aiOrder({
                instruction: args.instruction,
                network: args.network,
                amount: args.amount,
            });

            return {
                status: "success",
                data: {
                    orderId: result.orderId,
                    status: result.status,
                    parsedAction: {
                        side: result.parsedAction.side === 'BUY' ? '买入' : '卖出',
                        symbol: result.parsedAction.symbol,
                        amount: result.parsedAction.amount,
                        network: result.parsedAction.network
                    },
                    message: `AI订单已${result.status === 'EXECUTED' ? '执行' : '创建'}`,
                    client_action: result.status === 'PENDING' ? {
                        type: "CONFIRM_AI_ORDER",
                        params: {
                            orderId: result.orderId,
                            parsedAction: result.parsedAction
                        }
                    } : undefined
                }
            };
        } catch (error: any) {
            return {
                status: "error",
                message: `AI order failed: ${error.message}`,
                code: error.code?.toString()
            };
        }
    },
    'news'
);

// ============ Tool: check_token_security ============

globalRegistry.register(
    'check_token_security',
    {
        type: "function",
        function: {
            name: "check_token_security",
            description: "检测代币合约安全性。检查是否为蜜罐、买卖税、合约风险等。交易前建议先检查。",
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
            const securityService = getSecurityService();
            const result = await securityService.checkTokenSecurity(
                args.tokenAddress,
                args.network
            );

            // Build risk summary
            const risks: string[] = [];
            if (result.isHoneypot) risks.push('⚠️ 疑似蜜罐合约');
            if (parseFloat(result.buyTax) > 5) risks.push(`⚠️ 高买入税: ${result.buyTax}%`);
            if (parseFloat(result.sellTax) > 5) risks.push(`⚠️ 高卖出税: ${result.sellTax}%`);
            if (!result.isOpenSource) risks.push('⚠️ 合约未开源');
            if (result.isProxy) risks.push('⚠️ 代理合约（可升级）');
            if (result.isMintable) risks.push('⚠️ 可增发');
            if (result.canTakeBackOwnership) risks.push('⚠️ 可收回所有权');
            if (result.hiddenOwner) risks.push('⚠️ 隐藏所有者');
            if (result.selfDestruct) risks.push('⚠️ 可自毁');

            const riskLevelLabel = {
                'LOW': '低风险 ✅',
                'MEDIUM': '中风险 ⚠️',
                'HIGH': '高风险 🔴',
                'CRITICAL': '极高风险 ⛔'
            };

            return {
                status: "success",
                data: {
                    tokenAddress: args.tokenAddress,
                    network: args.network,
                    riskLevel: result.riskLevel,
                    riskLevelLabel: riskLevelLabel[result.riskLevel],
                    isHoneypot: result.isHoneypot,
                    buyTax: result.buyTax + '%',
                    sellTax: result.sellTax + '%',
                    isOpenSource: result.isOpenSource,
                    isMintable: result.isMintable,
                    totalRisks: result.totalRisks,
                    risks: risks,
                    recommendation: result.riskLevel === 'CRITICAL' || result.isHoneypot
                        ? '强烈建议不要交易此代币！'
                        : result.riskLevel === 'HIGH'
                            ? '此代币风险较高，请谨慎交易。'
                            : '安全检查通过，可以交易。'
                }
            };
        } catch (error: any) {
            return {
                status: "error",
                message: `Security check failed: ${error.message}`,
                code: error.code?.toString()
            };
        }
    },
    'security'
);
