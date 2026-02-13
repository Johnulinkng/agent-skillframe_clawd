/**
 * User Tools
 * Purpose: Agent tools for user profile and tasks
 * Tools:
 *   - get_user_profile: Get user profile information
 *   - check_in: Daily check-in for points
 *   - get_task_list: Get available tasks
 */

import { globalRegistry, ToolResult } from '../tools';
import { getUserService } from '../../services/user.service';
import { getPointService } from '../../services/point.service';

// ============ Tool: get_user_profile ============

globalRegistry.register(
    'get_user_profile',
    {
        type: "function",
        function: {
            name: "get_user_profile",
            description: "Get user profile information including wallet addresses, level, and points.",
            parameters: {
                type: "object",
                properties: {}
            }
        }
    },
    async (args, ctx): Promise<ToolResult> => {
        try {
            const userService = getUserService();
            const profile = await userService.getProfile();

            return {
                status: "success",
                data: {
                    displayName: profile.displayName,
                    email: profile.email,
                    avatar: profile.avatar,
                    level: profile.level,
                    points: profile.points,
                    walletAddresses: profile.walletAddresses.map(w => ({
                        address: w.address,
                        network: w.network,
                        isPrimary: w.isPrimary
                    })),
                    createdAt: profile.createdAt
                }
            };
        } catch (error: any) {
            return {
                status: "error",
                message: `Failed to get user profile: ${error.message}`,
                code: error.code?.toString()
            };
        }
    },
    'user'
);

// ============ Tool: check_in ============

globalRegistry.register(
    'check_in',
    {
        type: "function",
        function: {
            name: "check_in",
            description: "Perform daily check-in to earn points. Returns points earned and streak bonus.",
            parameters: {
                type: "object",
                properties: {}
            }
        }
    },
    async (args, ctx): Promise<ToolResult> => {
        try {
            const pointService = getPointService();
            const result = await pointService.checkIn();

            if (result.success) {
                return {
                    status: "success",
                    data: {
                        pointsEarned: result.pointsEarned,
                        consecutiveDays: result.consecutiveDays,
                        streakBonus: result.streakBonus,
                        nextCheckInTime: result.nextCheckInTime,
                        message: `Check-in successful! Earned ${result.pointsEarned} points. Consecutive days: ${result.consecutiveDays}`
                    }
                };
            } else {
                return {
                    status: "error",
                    message: "Already checked in today. Come back tomorrow!"
                };
            }
        } catch (error: any) {
            return {
                status: "error",
                message: `Check-in failed: ${error.message}`,
                code: error.code?.toString()
            };
        }
    },
    'user'
);

// ============ Tool: get_task_list ============

globalRegistry.register(
    'get_task_list',
    {
        type: "function",
        function: {
            name: "get_task_list",
            description: "Get list of available tasks that user can complete to earn points.",
            parameters: {
                type: "object",
                properties: {
                    includeNewbie: {
                        type: "boolean",
                        description: "Include newbie tasks, default true"
                    }
                },
                required: []
            }
        }
    },
    async (args, ctx): Promise<ToolResult> => {
        try {
            const pointService = getPointService();
            const tasks = await pointService.getTaskList();

            let allTasks = [...tasks];

            // Include newbie tasks if requested
            if (args.includeNewbie !== false) {
                const newbieTasks = await pointService.getNewbieTaskList();
                allTasks = [...allTasks, ...newbieTasks];
            }

            return {
                status: "success",
                data: {
                    tasks: allTasks.map(t => ({
                        taskId: t.taskId,
                        name: t.name,
                        description: t.description,
                        type: t.type,
                        points: t.points,
                        status: t.status,
                        progress: `${t.progress}/${t.maxProgress}`,
                        canClaim: t.status === 'COMPLETED'
                    })),
                    totalTasks: allTasks.length,
                    completedTasks: allTasks.filter(t => t.status === 'COMPLETED' || t.status === 'CLAIMED').length
                }
            };
        } catch (error: any) {
            return {
                status: "error",
                message: `Failed to get task list: ${error.message}`,
                code: error.code?.toString()
            };
        }
    },
    'user'
);

// ============ Tool: claim_task_reward ============

globalRegistry.register(
    'claim_task_reward',
    {
        type: "function",
        function: {
            name: "claim_task_reward",
            description: "Claim reward for a completed task.",
            parameters: {
                type: "object",
                properties: {
                    taskId: {
                        type: "string",
                        description: "The task ID to claim reward for"
                    }
                },
                required: ["taskId"]
            }
        }
    },
    async (args, ctx): Promise<ToolResult> => {
        try {
            const pointService = getPointService();
            const result = await pointService.claimReward(args.taskId);

            if (result.success) {
                return {
                    status: "success",
                    data: {
                        taskId: args.taskId,
                        pointsEarned: result.pointsEarned,
                        totalPoints: result.totalPoints,
                        message: `Reward claimed! Earned ${result.pointsEarned} points. Total: ${result.totalPoints}`
                    }
                };
            } else {
                return {
                    status: "error",
                    message: "Failed to claim reward. Task may not be completed."
                };
            }
        } catch (error: any) {
            return {
                status: "error",
                message: `Failed to claim reward: ${error.message}`,
                code: error.code?.toString()
            };
        }
    },
    'user'
);
