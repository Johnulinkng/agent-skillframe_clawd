/**
 * Common Service
 * Purpose: Common configuration and chain types
 * APIs:
 *   - GET /common/chainTypes - Get supported chain types
 *   - GET /common/config - Get common configuration
 */

import { BaseApiService, createServiceConfig, ApiConfig } from './api.base';

// ============ Types ============

export interface ChainType {
    chainId: number;
    name: string;
    symbol: string;
    network: string;
    rpcUrl: string;
    explorerUrl: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    isTestnet: boolean;
}

export interface CommonConfig {
    version: string;
    maintenance: boolean;
    features: {
        spotTrading: boolean;
        contractTrading: boolean;
        staking: boolean;
        nftMarket: boolean;
    };
    limits: {
        maxSlippage: string;
        minTradeAmount: string;
        maxTradeAmount: string;
    };
}

// ============ Service Class ============

export class CommonService extends BaseApiService {
    constructor(config?: ApiConfig) {
        super(config || createServiceConfig());
    }

    /**
     * Get supported chain types
     */
    async getChainTypes(): Promise<ChainType[]> {
        return this.get<ChainType[]>('/common/chainTypes');
    }

    /**
     * Get common configuration
     */
    async getConfig(): Promise<CommonConfig> {
        return this.get<CommonConfig>('/common/config');
    }
}

// ============ Singleton Instance ============

let commonServiceInstance: CommonService | null = null;

export function getCommonService(): CommonService {
    if (!commonServiceInstance) {
        commonServiceInstance = new CommonService();
    }
    return commonServiceInstance;
}
