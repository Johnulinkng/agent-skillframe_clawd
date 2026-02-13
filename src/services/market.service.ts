/**
 * Market Service
 * Purpose: Token market data, prices, K-lines, pools
 * APIs:
 *   - GET /market/token/detail
 *   - GET /market/token/24h
 *   - GET /market/token/kline
 *   - GET /market/token/candles
 *   - GET /market/token/pools
 *   - GET /market/token/poolsV2
 *   - GET /market/token/tradeLatest
 *   - GET /market/walletAddress/token/trade
 *   - GET /market/contract/detail/{coinName}
 *   - GET /market/contract/candle
 *   - GET /market/contract/l2book
 *   - GET /market/contract/list
 *   - GET /market/contract/tradeLatest
 */

import { BaseApiService, createServiceConfig, ApiConfig } from './api.base';

// ============ Types ============

export interface TokenDetail {
    tokenAddress: string;
    symbol: string;
    name: string;
    decimals: number;
    network: string;
    priceUsd: string;
    marketCap: string;
    totalSupply: string;
    circulatingSupply: string;
    holders: number;
    logoUrl?: string;
    website?: string;
    twitter?: string;
    telegram?: string;
}

export interface Token24h {
    tokenAddress: string;
    symbol: string;
    priceUsd: string;
    priceChange24h: string;
    priceChangePercent24h: string;
    volume24h: string;
    high24h: string;
    low24h: string;
    trades24h: number;
}

export interface KlineItem {
    timestamp: number;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
}

export interface PoolInfo {
    poolAddress: string;
    dex: string;
    token0: string;
    token1: string;
    token0Symbol: string;
    token1Symbol: string;
    liquidity: string;
    liquidityUsd: string;
    volume24h: string;
    fee: string;
}

export interface TradeLatest {
    txHash: string;
    timestamp: number;
    side: 'BUY' | 'SELL';
    priceUsd: string;
    amount: string;
    amountUsd: string;
    maker: string;
    taker: string;
}

export interface ContractDetail {
    coinName: string;
    symbol: string;
    priceUsd: string;
    markPrice: string;
    indexPrice: string;
    fundingRate: string;
    openInterest: string;
    volume24h: string;
    priceChange24h: string;
}

export interface ContractL2Book {
    bids: Array<{ price: string; size: string }>;
    asks: Array<{ price: string; size: string }>;
    timestamp: number;
}

// ============ Service Class ============

export class MarketService extends BaseApiService {
    constructor(config?: ApiConfig) {
        super(config || createServiceConfig());
    }

    // ============ Token APIs ============

    /**
     * Get token market details
     */
    async getTokenDetail(tokenAddress: string, network: string): Promise<TokenDetail> {
        return this.get<TokenDetail>('/market/token/detail', {
            tokenAddress,
            network,
        });
    }

    /**
     * Get token 24h statistics
     */
    async getToken24h(tokenAddress: string, network: string): Promise<Token24h> {
        return this.get<Token24h>('/market/token/24h', {
            tokenAddress,
            network,
        });
    }

    /**
     * Get token K-line data
     * @param interval - 1m/5m/15m/30m/1h/4h/1d/1w
     * @param limit - Number of data points, default 100
     */
    async getTokenKline(
        tokenAddress: string,
        network: string,
        interval: string,
        limit: number = 100
    ): Promise<KlineItem[]> {
        return this.get<KlineItem[]>('/market/token/kline', {
            tokenAddress,
            network,
            interval,
            limit,
        });
    }

    /**
     * Get token candles (alternative K-line format)
     */
    async getTokenCandles(
        tokenAddress: string,
        network: string,
        interval: string
    ): Promise<KlineItem[]> {
        return this.get<KlineItem[]>('/market/token/candles', {
            tokenAddress,
            network,
            interval,
        });
    }

    /**
     * Get token liquidity pools
     */
    async getTokenPools(tokenAddress: string, network: string): Promise<PoolInfo[]> {
        return this.get<PoolInfo[]>('/market/token/pools', {
            tokenAddress,
            network,
        });
    }

    /**
     * Get token liquidity pools (V2)
     */
    async getTokenPoolsV2(tokenAddress: string, network: string): Promise<PoolInfo[]> {
        return this.get<PoolInfo[]>('/market/token/poolsV2', {
            tokenAddress,
            network,
        });
    }

    /**
     * Get latest trades for a token
     */
    async getTradeLatest(
        tokenAddress: string,
        network: string,
        limit: number = 20
    ): Promise<TradeLatest[]> {
        return this.get<TradeLatest[]>('/market/token/tradeLatest', {
            tokenAddress,
            network,
            limit,
        });
    }

    /**
     * Get trades for a specific wallet and token
     */
    async getWalletTokenTrade(
        walletAddress: string,
        network: string,
        tokenAddress: string
    ): Promise<TradeLatest[]> {
        return this.get<TradeLatest[]>('/market/walletAddress/token/trade', {
            walletAddress,
            network,
            tokenAddress,
        });
    }

    // ============ Contract APIs ============

    /**
     * Get contract market details
     */
    async getContractDetail(coinName: string): Promise<ContractDetail> {
        return this.get<ContractDetail>(`/market/contract/detail/${coinName}`);
    }

    /**
     * Get contract K-line data
     */
    async getContractCandle(coinName: string, interval: string): Promise<KlineItem[]> {
        return this.get<KlineItem[]>('/market/contract/candle', {
            coinName,
            interval,
        });
    }

    /**
     * Get contract L2 order book
     */
    async getContractL2Book(coinName: string): Promise<ContractL2Book> {
        return this.get<ContractL2Book>('/market/contract/l2book', {
            coinName,
        });
    }

    /**
     * Get contract list
     */
    async getContractList(page: number = 1, size: number = 20): Promise<ContractDetail[]> {
        return this.get<ContractDetail[]>('/market/contract/list', {
            page,
            size,
        });
    }

    /**
     * Get contract latest trades
     */
    async getContractTradeLatest(coinName: string, limit: number = 20): Promise<TradeLatest[]> {
        return this.get<TradeLatest[]>('/market/contract/tradeLatest', {
            coinName,
            limit,
        });
    }
}

// ============ Singleton Instance ============

let marketServiceInstance: MarketService | null = null;

export function getMarketService(): MarketService {
    if (!marketServiceInstance) {
        marketServiceInstance = new MarketService();
    }
    return marketServiceInstance;
}
