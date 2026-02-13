/**
 * Topic Service
 * Purpose: Topic management - news topics, following, history
 * APIs:
 *   - GET /topic - Get topic list
 *   - GET /topic/detail/{id} - Get topic detail
 *   - GET /topic/following - Get followed topics
 *   - POST /topic/follow - Follow a topic
 *   - DELETE /topic/follow - Unfollow a topic
 *   - POST /topic/followBatch - Batch follow topics
 *   - GET /topic/history - Get topic view history
 *   - GET /topic/hot - Get hot topics
 */

import { BaseApiService, createServiceConfig, ApiConfig } from './api.base';

// ============ Types ============

export interface TopicItem {
    id: string;
    title: string;
    summary: string;
    category: string;
    tags: string[];
    relatedTokens: Array<{
        symbol: string;
        tokenAddress: string;
        network: string;
    }>;
    publishedAt: string;
    views: number;
    likes: number;
    imageUrl?: string;
}

export interface TopicDetail extends TopicItem {
    content: string;
    author: string;
    sources: string[];
    aiAnalysis?: {
        sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
        summary: string;
        impactScore: number;
    };
}

export interface TopicFollowStatus {
    topicId: string;
    followed: boolean;
    followedAt?: string;
}

// ============ Service Class ============

export class TopicService extends BaseApiService {
    constructor(config?: ApiConfig) {
        super(config || createServiceConfig());
    }

    /**
     * Get topic list
     * @param category - Filter by category (optional)
     * @param page - Page number
     * @param size - Page size
     */
    async getList(
        category?: string,
        page: number = 1,
        size: number = 20
    ): Promise<TopicItem[]> {
        return this.get<TopicItem[]>('/topic', {
            category,
            page,
            size,
        });
    }

    /**
     * Get topic detail by ID
     */
    async getDetail(topicId: string): Promise<TopicDetail> {
        return this.get<TopicDetail>(`/topic/detail/${topicId}`);
    }

    /**
     * Get hot topics
     */
    async getHotTopics(): Promise<TopicItem[]> {
        return this.get<TopicItem[]>('/topic/hot');
    }

    /**
     * Get followed topics
     */
    async getFollowing(page: number = 1, size: number = 20): Promise<TopicItem[]> {
        return this.get<TopicItem[]>('/topic/following', { page, size });
    }

    /**
     * Follow a topic
     */
    async follow(topicId: string): Promise<void> {
        await this.post<void>('/topic/follow', { topicId });
    }

    /**
     * Unfollow a topic
     */
    async unfollow(topicId: string): Promise<void> {
        await this.delete<void>('/topic/follow', { topicId });
    }

    /**
     * Batch follow topics
     */
    async followBatch(topicIds: string[]): Promise<void> {
        await this.post<void>('/topic/followBatch', { topicIds });
    }

    /**
     * Get topic view history
     */
    async getHistory(page: number = 1, size: number = 20): Promise<TopicItem[]> {
        return this.get<TopicItem[]>('/topic/history', { page, size });
    }
}

// ============ Singleton Instance ============

let topicServiceInstance: TopicService | null = null;

export function getTopicService(): TopicService {
    if (!topicServiceInstance) {
        topicServiceInstance = new TopicService();
    }
    return topicServiceInstance;
}
