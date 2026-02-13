/**
 * User Service
 * Purpose: User profile, authentication, Zendesk
 * APIs:
 *   - GET /profiles/profile - Get user profile
 *   - POST /profiles/profile - Update profile
 *   - GET /profiles/settings - Get settings
 *   - POST /profiles/settings - Update settings
 *   - POST /profiles/bindAddress - Bind wallet address
 *   - POST /zendesk/createRequest - Create support ticket
 *   - GET /zendesk/conversations - Get conversations
 *   - GET /auth/refresh - Refresh token
 */

import { BaseApiService, createServiceConfig, ApiConfig } from './api.base';

// ============ Types ============

export interface UserProfile {
    userId: string;
    displayName: string;
    email?: string;
    avatar?: string;
    walletAddresses: Array<{
        address: string;
        network: string;
        isPrimary: boolean;
    }>;
    level: number;
    points: number;
    createdAt: string;
    settings?: UserSettings;
}

export interface UserSettings {
    language: string;
    currency: string;
    theme: 'light' | 'dark' | 'system';
    notifications: {
        priceAlert: boolean;
        tradeConfirmation: boolean;
        newsDigest: boolean;
    };
    tradingDefaults: {
        slippage: string;
        gasSpeed: 'slow' | 'standard' | 'fast';
    };
}

export interface BindAddressRequest {
    address: string;
    network: string;
    signature: string;
    message: string;
}

export interface ZendeskRequest {
    subject: string;
    description: string;
    category: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface ZendeskConversation {
    id: string;
    subject: string;
    status: 'new' | 'open' | 'pending' | 'solved' | 'closed';
    createdAt: string;
    updatedAt: string;
    messages: Array<{
        body: string;
        author: string;
        createdAt: string;
    }>;
}

// ============ Service Class ============

export class UserService extends BaseApiService {
    constructor(config?: ApiConfig) {
        super(config || createServiceConfig());
    }

    /**
     * Get user profile
     */
    async getProfile(): Promise<UserProfile> {
        return this.get<UserProfile>('/profiles/profile');
    }

    /**
     * Update user profile
     */
    async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
        return this.post<UserProfile>('/profiles/profile', profile);
    }

    /**
     * Get user settings
     */
    async getSettings(): Promise<UserSettings> {
        return this.get<UserSettings>('/profiles/settings');
    }

    /**
     * Update user settings
     */
    async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
        return this.post<UserSettings>('/profiles/settings', settings);
    }

    /**
     * Bind wallet address
     */
    async bindAddress(request: BindAddressRequest): Promise<void> {
        await this.post<void>('/profiles/bindAddress', request);
    }

    /**
     * Create Zendesk support request
     */
    async createSupportRequest(request: ZendeskRequest): Promise<{ ticketId: string }> {
        return this.post<{ ticketId: string }>('/zendesk/createRequest', request);
    }

    /**
     * Get Zendesk conversations
     */
    async getConversations(): Promise<ZendeskConversation[]> {
        return this.get<ZendeskConversation[]>('/zendesk/conversations');
    }

    /**
     * Refresh auth token
     */
    async refreshToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
        return this.post<{ accessToken: string; expiresIn: number }>('/auth/refresh', { refreshToken });
    }
}

// ============ Singleton Instance ============

let userServiceInstance: UserService | null = null;

export function getUserService(): UserService {
    if (!userServiceInstance) {
        userServiceInstance = new UserService();
    }
    return userServiceInstance;
}
