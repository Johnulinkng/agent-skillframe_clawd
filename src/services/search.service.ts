/**
 * Search Service
 * Purpose: Global search functionality
 * APIs:
 *   - GET /search - Global search
 */

import { BaseApiService, createServiceConfig, ApiConfig } from './api.base';

// ============ Types ============

export interface SearchResult {
    type: 'TOKEN' | 'TOPIC' | 'USER' | 'CONTRACT';
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
    metadata: Record<string, any>;
}

export interface SearchResponse {
    query: string;
    totalResults: number;
    results: SearchResult[];
    suggestions?: string[];
}

// ============ Service Class ============

export class SearchService extends BaseApiService {
    constructor(config?: ApiConfig) {
        super(config || createServiceConfig());
    }

    /**
     * Global search
     * @param query - Search query
     * @param type - Filter by result type (optional)
     * @param limit - Max results (default 20)
     */
    async search(
        query: string,
        type?: 'TOKEN' | 'TOPIC' | 'USER' | 'CONTRACT',
        limit: number = 20
    ): Promise<SearchResponse> {
        return this.get<SearchResponse>('/search', {
            query,
            type,
            limit,
        });
    }
}

// ============ Singleton Instance ============

let searchServiceInstance: SearchService | null = null;

export function getSearchService(): SearchService {
    if (!searchServiceInstance) {
        searchServiceInstance = new SearchService();
    }
    return searchServiceInstance;
}
