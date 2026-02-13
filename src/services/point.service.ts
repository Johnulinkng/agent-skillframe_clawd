/**
 * Point Service
 * Purpose: Points and task management
 * APIs:
 *   - POST /pointTask/checkIn - Daily check-in
 *   - GET /pointTask/taskList - Get task list
 *   - GET /pointTask/newbieTaskList - Get newbie tasks
 *   - POST /pointTask/claimReward - Claim reward
 */

import { BaseApiService, createServiceConfig, ApiConfig } from './api.base';

// ============ Types ============

export interface PointTask {
    taskId: string;
    name: string;
    description: string;
    type: 'DAILY' | 'WEEKLY' | 'ONE_TIME' | 'SPECIAL';
    points: number;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CLAIMED';
    progress: number;
    maxProgress: number;
    expiresAt?: string;
}

export interface CheckInResult {
    success: boolean;
    pointsEarned: number;
    consecutiveDays: number;
    streakBonus?: number;
    nextCheckInTime: string;
}

export interface ClaimRewardResult {
    success: boolean;
    pointsEarned: number;
    totalPoints: number;
}

// ============ Service Class ============

export class PointService extends BaseApiService {
    constructor(config?: ApiConfig) {
        super(config || createServiceConfig());
    }

    /**
     * Daily check-in
     */
    async checkIn(): Promise<CheckInResult> {
        return this.post<CheckInResult>('/pointTask/checkIn');
    }

    /**
     * Get task list
     */
    async getTaskList(): Promise<PointTask[]> {
        return this.get<PointTask[]>('/pointTask/taskList');
    }

    /**
     * Get newbie task list
     */
    async getNewbieTaskList(): Promise<PointTask[]> {
        return this.get<PointTask[]>('/pointTask/newbieTaskList');
    }

    /**
     * Claim reward for completed task
     */
    async claimReward(taskId: string): Promise<ClaimRewardResult> {
        return this.post<ClaimRewardResult>('/pointTask/claimReward', { taskId });
    }
}

// ============ Singleton Instance ============

let pointServiceInstance: PointService | null = null;

export function getPointService(): PointService {
    if (!pointServiceInstance) {
        pointServiceInstance = new PointService();
    }
    return pointServiceInstance;
}
