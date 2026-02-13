/**
 * News Service
 * Purpose: News, AI analysis, and AI orders
 * APIs:
 *   - POST /collection/ai_analyst
 *   - POST /collection/ai_order
 *   - POST /collection/tx/send
 */

import { BaseApiService, createServiceConfig, ApiConfig } from './api.base';

// ============ Types ============

export interface AiAnalystRequest {
    query: string;
    network?: string;
    tokenAddress?: string;
}

export interface AiAnalystResponse {
    analysis: string;
    sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    confidenceScore: number;
    relatedTokens?: Array<{
        symbol: string;
        tokenAddress: string;
        impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
        score: number;
    }>;
    summary?: string;
    detailedAnalysis?: string;
}

export interface AiOrderRequest {
    instruction: string;
    network: string;
    amount: string;
}

export interface AiOrderResponse {
    orderId: string;
    status: 'PENDING' | 'EXECUTED' | 'FAILED';
    instruction: string;
    parsedAction: {
        side: 'BUY' | 'SELL';
        symbol: string;
        amount: string;
        network: string;
    };
    result?: any;
}

export interface SendTxRequest {
    network: string;
    from: string;
    to: string;
    value: string;
    data?: string;
    gasPrice?: string;
    gasLimit?: string;
}

export interface SendTxResponse {
    txHash: string;
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
}

// ============ Service Class ============

export class NewsService extends BaseApiService {
    constructor(config?: ApiConfig) {
        super(config || createServiceConfig());
    }

    /**
     * AI Analyst - Analyze market or token
     * @param request - Analysis request
     */
    async aiAnalyst(request: AiAnalystRequest): Promise<AiAnalystResponse> {
        return this.post<AiAnalystResponse>('/collection/ai_analyst', request);
    }

    /**
     * AI Order - Create order from natural language
     * @param request - Order instruction
     */
    async aiOrder(request: AiOrderRequest): Promise<AiOrderResponse> {
        return this.post<AiOrderResponse>('/collection/ai_order', request);
    }

    /**
     * Send transaction
     * @param request - Transaction details
     */
    async sendTx(request: SendTxRequest): Promise<SendTxResponse> {
        return this.post<SendTxResponse>('/collection/tx/send', request);
    }
}

// ============ Singleton Instance ============

let newsServiceInstance: NewsService | null = null;

export function getNewsService(): NewsService {
    if (!newsServiceInstance) {
        newsServiceInstance = new NewsService();
    }
    return newsServiceInstance;
}
