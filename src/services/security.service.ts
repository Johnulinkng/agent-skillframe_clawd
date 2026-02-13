/**
 * Security Service
 * Purpose: Token security checks
 * APIs:
 *   - POST /security/token_security
 */

import { BaseApiService, createServiceConfig, ApiConfig } from './api.base';

// ============ Types ============

export interface TokenSecurityRequest {
    tokenAddress: string;
    network: string;
}

export interface TokenSecurityResponse {
    tokenAddress: string;
    network: string;
    isHoneypot: boolean;
    buyTax: string;
    sellTax: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    isOpenSource: boolean;
    isProxy: boolean;
    isMintable: boolean;
    canTakeBackOwnership: boolean;
    ownerChangeBalance: boolean;
    hiddenOwner: boolean;
    selfDestruct: boolean;
    externalCall: boolean;
    totalRisks: number;
    riskDetails?: string[];
}

// ============ Service Class ============

export class SecurityService extends BaseApiService {
    constructor(config?: ApiConfig) {
        super(config || createServiceConfig());
    }

    /**
     * Check token security
     * @param tokenAddress - Token contract address
     * @param network - Network
     */
    async checkTokenSecurity(tokenAddress: string, network: string): Promise<TokenSecurityResponse> {
        return this.post<TokenSecurityResponse>('/security/token_security', {
            tokenAddress,
            network,
        } as TokenSecurityRequest);
    }
}

// ============ Singleton Instance ============

let securityServiceInstance: SecurityService | null = null;

export function getSecurityService(): SecurityService {
    if (!securityServiceInstance) {
        securityServiceInstance = new SecurityService();
    }
    return securityServiceInstance;
}
