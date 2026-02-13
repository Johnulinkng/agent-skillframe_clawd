/**
 * Contract Service
 * Purpose: Contract/perpetual trading management
 * APIs:
 *   - GET /contract/account/summary - Account summary
 *   - GET /contract/account/balance - Account balance
 *   - GET /contract/account/position - Positions
 *   - GET /contract/account/orders - Orders
 *   - GET /contract/account/orderDetail - Order detail
 *   - GET /contract/account/funding - Funding rate
 *   - POST /contract/order/create - Create order
 *   - DELETE /contract/order/cancel - Cancel order
 *   - POST /contract/order/close - Close position
 *   - GET /contract/config - Contract config
 *   - GET /contract/leverage - Leverage settings
 *   - POST /contract/leverage - Update leverage
 */

import { BaseApiService, createServiceConfig, ApiConfig } from './api.base';

// ============ Types ============

export interface ContractAccountSummary {
    equity: string;
    availableBalance: string;
    frozenBalance: string;
    unrealizedPnl: string;
    marginRatio: string;
    totalPositionValue: string;
}

export interface ContractPosition {
    symbol: string;
    side: 'LONG' | 'SHORT';
    size: string;
    entryPrice: string;
    markPrice: string;
    liquidationPrice: string;
    unrealizedPnl: string;
    realizedPnl: string;
    leverage: number;
    marginType: 'CROSS' | 'ISOLATED';
}

export interface ContractOrder {
    orderId: string;
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'MARKET' | 'LIMIT' | 'STOP_MARKET' | 'STOP_LIMIT';
    status: 'NEW' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELED';
    price: string;
    quantity: string;
    filledQuantity: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateOrderRequest {
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'MARKET' | 'LIMIT' | 'STOP_MARKET' | 'STOP_LIMIT';
    quantity: string;
    price?: string;
    stopPrice?: string;
    leverage?: number;
    reduceOnly?: boolean;
}

// ============ Service Class ============

export class ContractService extends BaseApiService {
    constructor(config?: ApiConfig) {
        super(config || createServiceConfig());
    }

    /**
     * Get account summary
     */
    async getAccountSummary(): Promise<ContractAccountSummary> {
        return this.get<ContractAccountSummary>('/contract/account/summary');
    }

    /**
     * Get account balance
     */
    async getAccountBalance(): Promise<{ balance: string; currency: string }> {
        return this.get<{ balance: string; currency: string }>('/contract/account/balance');
    }

    /**
     * Get all positions
     */
    async getPositions(): Promise<ContractPosition[]> {
        return this.get<ContractPosition[]>('/contract/account/position');
    }

    /**
     * Get orders
     */
    async getOrders(
        symbol?: string,
        status?: string,
        page: number = 1,
        size: number = 20
    ): Promise<ContractOrder[]> {
        return this.get<ContractOrder[]>('/contract/account/orders', {
            symbol,
            status,
            page,
            size,
        });
    }

    /**
     * Get order detail
     */
    async getOrderDetail(orderId: string): Promise<ContractOrder> {
        return this.get<ContractOrder>('/contract/account/orderDetail', { orderId });
    }

    /**
     * Get funding rate
     */
    async getFundingRate(symbol: string): Promise<{ rate: string; nextFundingTime: number }> {
        return this.get<{ rate: string; nextFundingTime: number }>('/contract/account/funding', { symbol });
    }

    /**
     * Create order
     */
    async createOrder(request: CreateOrderRequest): Promise<{ orderId: string }> {
        return this.post<{ orderId: string }>('/contract/order/create', request);
    }

    /**
     * Cancel order
     */
    async cancelOrder(orderId: string): Promise<void> {
        await this.delete<void>('/contract/order/cancel', { orderId });
    }

    /**
     * Close position
     */
    async closePosition(symbol: string, quantity?: string): Promise<{ orderId: string }> {
        return this.post<{ orderId: string }>('/contract/order/close', { symbol, quantity });
    }

    /**
     * Get contract config
     */
    async getConfig(symbol: string): Promise<any> {
        return this.get<any>('/contract/config', { symbol });
    }

    /**
     * Get leverage settings
     */
    async getLeverage(symbol: string): Promise<{ leverage: number; maxLeverage: number }> {
        return this.get<{ leverage: number; maxLeverage: number }>('/contract/leverage', { symbol });
    }

    /**
     * Update leverage
     */
    async setLeverage(symbol: string, leverage: number): Promise<void> {
        await this.post<void>('/contract/leverage', { symbol, leverage });
    }
}

// ============ Singleton Instance ============

let contractServiceInstance: ContractService | null = null;

export function getContractService(): ContractService {
    if (!contractServiceInstance) {
        contractServiceInstance = new ContractService();
    }
    return contractServiceInstance;
}
