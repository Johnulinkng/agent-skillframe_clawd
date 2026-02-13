/**
 * Wallet Service
 * Purpose: Wallet balance, holdings, and transaction history
 * APIs:
 *   - GET /wallet/token/balance
 *   - GET /wallet/token/holding
 *   - GET /wallet/token/holdingPage
 *   - GET /wallet/token/tx/history
 */

import { BaseApiService, createServiceConfig, ApiConfig } from './api.base';

// ============ Types ============

export interface TokenBalance {
    balance: string;
    symbol: string;
    decimals: number;
    tokenAddress?: string;
    priceUsd?: string;
    valueUsd?: string;
}

export interface HoldingItem {
    tokenAddress: string;
    symbol: string;
    name: string;
    balance: string;
    decimals: number;
    priceUsd: string;
    valueUsd: string;
    price24hChange?: string;
    logoUrl?: string;
}

export interface HoldingPage {
    items: HoldingItem[];
    total: number;
    page: number;
    size: number;
}

export interface TxHistoryItem {
    txHash: string;
    blockNumber: number;
    timestamp: number;
    from: string;
    to: string;
    tokenAddress?: string;
    symbol: string;
    amount: string;
    type: 'IN' | 'OUT' | 'SWAP';
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    gasUsed?: string;
    gasFee?: string;
}

export interface TxHistoryPage {
    items: TxHistoryItem[];
    total: number;
    page: number;
    size: number;
}

// ============ Service Class ============

export class WalletService extends BaseApiService {
    constructor(config?: ApiConfig) {
        super(config || createServiceConfig());
    }

    /**
     * Get token balance for a wallet
     * @param walletAddress - Wallet address
     * @param network - Network (ethereum/bsc/polygon/solana/etc)
     * @param tokenAddress - Token contract address (optional, omit for native token)
     */
    async getTokenBalance(
        walletAddress: string,
        network: string,
        tokenAddress?: string
    ): Promise<TokenBalance> {
        return this.get<TokenBalance>('/wallet/token/balance', {
            walletAddress,
            network,
            tokenAddress,
        });
    }

    /**
     * Get all holdings for a wallet (non-paginated)
     * @param walletAddress - Wallet address
     * @param network - Network
     */
    async getHolding(walletAddress: string, network: string): Promise<HoldingItem[]> {
        return this.get<HoldingItem[]>('/wallet/token/holding', {
            walletAddress,
            network,
        });
    }

    /**
     * Get holdings with pagination
     * @param walletAddress - Wallet address
     * @param network - Network
     * @param page - Page number (default 1)
     * @param size - Items per page (default 20)
     */
    async getHoldingPage(
        walletAddress: string,
        network: string,
        page: number = 1,
        size: number = 20
    ): Promise<HoldingPage> {
        return this.get<HoldingPage>('/wallet/token/holdingPage', {
            walletAddress,
            network,
            page,
            size,
        });
    }

    /**
     * Get transaction history for a wallet
     * @param walletAddress - Wallet address
     * @param network - Network
     * @param page - Page number
     * @param size - Items per page
     * @param tokenAddress - Filter by token (optional)
     */
    async getTxHistory(
        walletAddress: string,
        network: string,
        page: number = 1,
        size: number = 20,
        tokenAddress?: string
    ): Promise<TxHistoryPage> {
        return this.get<TxHistoryPage>('/wallet/token/tx/history', {
            walletAddress,
            network,
            page,
            size,
            tokenAddress,
        });
    }
}

// ============ Singleton Instance ============

let walletServiceInstance: WalletService | null = null;

export function getWalletService(): WalletService {
    if (!walletServiceInstance) {
        walletServiceInstance = new WalletService();
    }
    return walletServiceInstance;
}
