/**
 * Token Service
 * Purpose: Token management - follow, search, hot tokens
 * APIs:
 *   - GET /token/follow
 *   - POST /token/follow
 *   - DELETE /token/follow
 *   - POST /token/followBatch
 *   - GET /token
 *   - GET /token/hot
 *   - GET /token/follow/status
 *   - GET /token/dex/search
 *   - GET /token/warning/list
 *   - POST /token/warning/broadcast
 */

import { BaseApiService, createServiceConfig, ApiConfig } from './api.base';

// ============ Types ============

export interface FollowedToken {
    tokenAddress: string;
    network: string;
    symbol: string;
    name: string;
    logoUrl?: string;
    priceUsd: string;
    priceChange24h: string;
    marketCap: string;
    volume24h: string;
    followedAt: string;
}

export interface TokenListItem {
    tokenAddress: string;
    network: string;
    symbol: string;
    name: string;
    logoUrl?: string;
    priceUsd: string;
    priceChange24h: string;
    marketCap: string;
    volume24h: string;
    holders?: number;
}

export interface TokenSearchResult {
    tokenAddress: string;
    network: string;
    symbol: string;
    name: string;
    logoUrl?: string;
    priceUsd: string;
    verified: boolean;
}

export interface TokenWarning {
    tokenAddress: string;
    network: string;
    warningType: string;
    message: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    timestamp: number;
}

export type TokenSortType = 'VOLUME_USD' | 'MARKET_CAP' | 'PRICE' | 'PERCENTAGE' | 'UPDATE_TIME';

// ============ Service Class ============

export class TokenService extends BaseApiService {
    constructor(config?: ApiConfig) {
        super(config || createServiceConfig());
    }

    /**
     * Get followed tokens list
     */
    async getFollowedTokens(
        network?: string,
        sortType?: TokenSortType,
        sortAsc: boolean = false,
        page: number = 1,
        size: number = 20
    ): Promise<FollowedToken[]> {
        return this.get<FollowedToken[]>('/token/follow', {
            network,
            sortType,
            sortAsc,
            page,
            size,
        });
    }

    /**
     * Follow a token
     */
    async followToken(tokenAddress: string, network: string): Promise<void> {
        await this.post<void>('/token/follow', {
            tokenAddress,
            network,
        });
    }

    /**
     * Unfollow a token
     */
    async unfollowToken(tokenAddress: string, network: string): Promise<void> {
        await this.delete<void>('/token/follow', {
            tokenAddress,
            network,
        });
    }

    /**
     * Batch follow tokens
     */
    async followTokenBatch(tokens: Array<{ tokenAddress: string; network: string }>): Promise<void> {
        await this.post<void>('/token/followBatch', tokens);
    }

    /**
     * Get token list
     */
    async getTokenList(
        page: number = 1,
        size: number = 20,
        network?: string
    ): Promise<TokenListItem[]> {
        return this.get<TokenListItem[]>('/token', {
            page,
            size,
            network,
        });
    }

    /**
     * Get hot tokens
     */
    async getHotTokens(): Promise<TokenListItem[]> {
        return this.get<TokenListItem[]>('/token/hot');
    }

    /**
     * Get token follow status
     */
    async getFollowStatus(tokenAddress: string, network: string): Promise<{ followed: boolean }> {
        return this.get<{ followed: boolean }>('/token/follow/status', {
            tokenAddress,
            network,
        });
    }

    /**
     * Search tokens on DEX
     */
    async dexSearch(keyword: string, network?: string): Promise<TokenSearchResult[]> {
        return this.get<TokenSearchResult[]>('/token/dex/search', {
            keyword,
            network,
        });
    }

    /**
     * Get token warnings
     */
    async getWarningList(): Promise<TokenWarning[]> {
        return this.get<TokenWarning[]>('/token/warning/list');
    }

    /**
     * Broadcast token warning
     */
    async broadcastWarning(warning: TokenWarning): Promise<void> {
        await this.post<void>('/token/warning/broadcast', warning);
    }
}

// ============ Singleton Instance ============

let tokenServiceInstance: TokenService | null = null;

export function getTokenService(): TokenService {
    if (!tokenServiceInstance) {
        tokenServiceInstance = new TokenService();
    }
    return tokenServiceInstance;
}
