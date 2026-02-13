/**
 * API Base Service
 * Purpose: Unified HTTP request handling, authentication, and error management
 * Base URL: http://tbo.mydex.io/app-api
 */

// ============ Types ============

export interface ApiResponse<T = any> {
    code: number;
    message: string;
    data: T;
    timestamp?: number;
    path?: string;
}

export interface ApiErrorDetail {
    code: number;
    message: string;
    path?: string;
}

export class ApiError extends Error {
    public code: number;
    public path?: string;

    constructor(detail: ApiErrorDetail) {
        super(detail.message);
        this.name = 'ApiError';
        this.code = detail.code;
        this.path = detail.path;
    }
}

// ============ Configuration ============

const DEFAULT_BASE_URL = 'http://tbo.mydex.io/app-api';
const DEFAULT_TIMEOUT = 30000; // 30 seconds

export interface ApiConfig {
    baseUrl?: string;
    timeout?: number;
    getToken?: () => string | null;
}

// ============ Base Service Class ============

export class BaseApiService {
    protected baseUrl: string;
    protected timeout: number;
    protected getToken: () => string | null;

    constructor(config: ApiConfig = {}) {
        this.baseUrl = config.baseUrl || process.env.API_BASE_URL || DEFAULT_BASE_URL;
        this.timeout = config.timeout || DEFAULT_TIMEOUT;
        this.getToken = config.getToken || (() => process.env.API_TOKEN || null);
    }

    /**
     * Build request headers with authentication
     */
    protected buildHeaders(customHeaders?: Record<string, string>): HeadersInit {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...customHeaders,
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    /**
     * Build full URL with query parameters
     */
    protected buildUrl(path: string, params?: Record<string, any>): string {
        const url = new URL(path, this.baseUrl);

        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    url.searchParams.append(key, String(value));
                }
            });
        }

        return url.toString();
    }

    /**
     * Parse and validate API response
     */
    protected async parseResponse<T>(response: Response, path: string): Promise<T> {
        const contentType = response.headers.get('content-type');

        if (!contentType?.includes('application/json')) {
            throw new ApiError({
                code: response.status,
                message: `Unexpected content type: ${contentType}`,
                path,
            });
        }

        const result: ApiResponse<T> = await response.json();

        // Check business logic error codes
        if (result.code !== 200) {
            throw new ApiError({
                code: result.code,
                message: result.message || 'Unknown error',
                path,
            });
        }

        return result.data;
    }

    /**
     * Execute GET request
     */
    protected async get<T>(path: string, params?: Record<string, any>): Promise<T> {
        const url = this.buildUrl(path, params);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: this.buildHeaders(),
                signal: controller.signal,
            });

            return await this.parseResponse<T>(response, path);
        } catch (error: any) {
            if (error.name === 'AbortError') {
                throw new ApiError({
                    code: 408,
                    message: 'Request timeout',
                    path,
                });
            }
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Execute POST request
     */
    protected async post<T>(path: string, body?: any, params?: Record<string, any>): Promise<T> {
        const url = this.buildUrl(path, params);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: this.buildHeaders(),
                body: body !== undefined ? JSON.stringify(body) : undefined,
                signal: controller.signal,
            });

            return await this.parseResponse<T>(response, path);
        } catch (error: any) {
            if (error.name === 'AbortError') {
                throw new ApiError({
                    code: 408,
                    message: 'Request timeout',
                    path,
                });
            }
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Execute DELETE request
     */
    protected async delete<T>(path: string, body?: any): Promise<T> {
        const url = this.buildUrl(path);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                method: 'DELETE',
                headers: this.buildHeaders(),
                body: body !== undefined ? JSON.stringify(body) : undefined,
                signal: controller.signal,
            });

            return await this.parseResponse<T>(response, path);
        } catch (error: any) {
            if (error.name === 'AbortError') {
                throw new ApiError({
                    code: 408,
                    message: 'Request timeout',
                    path,
                });
            }
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    }
}

// ============ Singleton Service Factory ============

let tokenProvider: (() => string | null) | null = null;

/**
 * Set global token provider (called by frontend/auth layer)
 */
export function setTokenProvider(provider: () => string | null): void {
    tokenProvider = provider;
}

/**
 * Get current token provider
 */
export function getTokenProvider(): () => string | null {
    return tokenProvider || (() => process.env.API_TOKEN || null);
}

/**
 * Create a service instance with shared token provider
 */
export function createServiceConfig(): ApiConfig {
    return {
        getToken: getTokenProvider(),
    };
}
