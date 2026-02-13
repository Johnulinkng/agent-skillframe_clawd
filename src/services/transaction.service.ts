/**
 * Transaction Service
 * Purpose: Transaction settings and Privy signing
 * APIs:
 *   - GET /transaction/settings
 *   - POST /transaction/settings
 *   - POST /privy/sign-and-send-transaction
 *   - POST /privy/ethSignTypedData
 *   - POST /privy/ethCallRpc
 */

import { BaseApiService, createServiceConfig, ApiConfig } from './api.base';

// ============ Types ============

export interface TransactionSettings {
    index: number;
    gasPrice: string;
    gasLimit: string;
    slippage: string;
    enabled: boolean;
}

export interface TransactionSettingsUpdate {
    network: string;
    index: number;
    gasPrice?: string;
    gasLimit?: string;
    slippage?: string;
    enabled?: boolean;
}

export interface SignTransactionRequest {
    network: string;
    from: string;
    to: string;
    value: string;
    data?: string;
    gasPrice?: string;
    gasLimit?: string;
}

export interface SignTransactionResponse {
    txHash: string;
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    blockNumber?: number;
    gasUsed?: string;
}

export interface EthSignTypedDataRequest {
    address: string;
    message: object;
}

export interface EthSignTypedDataResponse {
    signature: string;
}

export interface EthCallRpcRequest {
    method: string;
    params: any[];
}

export interface EthCallRpcResponse {
    result: any;
}

// ============ Service Class ============

export class TransactionService extends BaseApiService {
    constructor(config?: ApiConfig) {
        super(config || createServiceConfig());
    }

    /**
     * Get transaction settings (gas, slippage)
     * @param network - Network name
     * @param fromAddress - Sender address
     * @param toAddress - Receiver address (optional, required with data)
     * @param data - Call data or contract bytecode (optional, required with toAddress)
     * 
     * Note:
     * - If toAddress is not provided, gasLimit will be a fixed value
     * - Slippage is in full precision, convert to percentage yourself
     * - EVM: fee = (gasPrice × gasLimit) / 10^18, gasPrice unit: 1 Gwei = 10^9 wei
     * - SOL: gas unit Lamport = 10^9
     */
    async getSettings(
        network: string,
        fromAddress: string,
        toAddress?: string,
        data?: string
    ): Promise<TransactionSettings[]> {
        return this.get<TransactionSettings[]>('/transaction/settings', {
            network,
            fromAddress,
            toAddress,
            data,
        });
    }

    /**
     * Update transaction settings
     * @param config - Settings to update
     * 
     * Note:
     * - Identified by network + index
     * - When enabling one config, others become disabled
     * - If all disabled, index[0] is enabled by default
     */
    async updateSettings(config: TransactionSettingsUpdate): Promise<void> {
        await this.post<void>('/transaction/settings', config);
    }

    /**
     * Sign and send transaction via Privy
     * This is the CORE trading execution method
     * 
     * @param tx - Transaction parameters
     * @returns Transaction hash and status
     */
    async signAndSendTransaction(tx: SignTransactionRequest): Promise<SignTransactionResponse> {
        return this.post<SignTransactionResponse>('/privy/sign-and-send-transaction', tx);
    }

    /**
     * Sign EIP-712 typed data
     * @param address - Signing address
     * @param message - Typed message object
     */
    async ethSignTypedData(address: string, message: object): Promise<EthSignTypedDataResponse> {
        return this.post<EthSignTypedDataResponse>('/privy/ethSignTypedData', {
            address,
            message,
        } as EthSignTypedDataRequest);
    }

    /**
     * Execute ETH RPC call
     * @param method - RPC method name
     * @param params - Parameters array
     */
    async ethCallRpc(method: string, params: any[]): Promise<EthCallRpcResponse> {
        return this.post<EthCallRpcResponse>('/privy/ethCallRpc', {
            method,
            params,
        } as EthCallRpcRequest);
    }
}

// ============ Singleton Instance ============

let transactionServiceInstance: TransactionService | null = null;

export function getTransactionService(): TransactionService {
    if (!transactionServiceInstance) {
        transactionServiceInstance = new TransactionService();
    }
    return transactionServiceInstance;
}
