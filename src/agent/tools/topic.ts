/**
 * Topic Tools
 * Purpose: Agent tools for topic/news management
 * Tools:
 *   - get_topic_list: Get topic list
 *   - get_topic_detail: Get topic detail
 *   - get_hot_topics: Get hot topics
 *   - follow_topic: Follow a topic
 */

import { globalRegistry, ToolResult } from '../tools';
import { getTopicService } from '../../services/topic.service';

// ============ Tool: get_topic_list ============

globalRegistry.register(
    'get_topic_list',
    {
        type: "function",
        function: {
            name: "get_topic_list",
            description: "Get list of news topics. Can filter by category. Use for browsing news and market updates.",
            parameters: {
                type: "object",
                properties: {
                    category: {
                        type: "string",
                        description: "Filter by category (e.g., 'market', 'defi', 'nft')"
                    },
                    page: {
                        type: "number",
                        description: "Page number, default 1"
                    },
                    size: {
                        type: "number",
                        description: "Page size, default 10"
                    }
                },
                required: []
            }
        }
    },
    async (args, ctx): Promise<ToolResult> => {
        try {
            const topicService = getTopicService();
            const topics = await topicService.getList(
                args.category,
                args.page || 1,
                args.size || 10
            );

            return {
                status: "success",
                data: {
                    category: args.category || 'all',
                    topics: topics.map(t => ({
                        id: t.id,
                        title: t.title,
                        summary: t.summary,
                        category: t.category,
                        tags: t.tags,
                        relatedTokens: t.relatedTokens?.map(rt => rt.symbol) || [],
                        publishedAt: t.publishedAt,
                        views: t.views
                    })),
                    totalCount: topics.length
                }
            };
        } catch (error: any) {
            return {
                status: "error",
                message: `Failed to get topics: ${error.message}`,
                code: error.code?.toString()
            };
        }
    },
    'topic'
);

// ============ Tool: get_topic_detail ============

globalRegistry.register(
    'get_topic_detail',
    {
        type: "function",
        function: {
            name: "get_topic_detail",
            description: "Get detailed content of a specific topic by ID. Returns full article content and AI analysis.",
            parameters: {
                type: "object",
                properties: {
                    topicId: {
                        type: "string",
                        description: "The topic ID to fetch"
                    }
                },
                required: ["topicId"]
            }
        }
    },
    async (args, ctx): Promise<ToolResult> => {
        try {
            const topicService = getTopicService();
            const detail = await topicService.getDetail(args.topicId);

            return {
                status: "success",
                data: {
                    id: detail.id,
                    title: detail.title,
                    content: detail.content,
                    summary: detail.summary,
                    author: detail.author,
                    publishedAt: detail.publishedAt,
                    category: detail.category,
                    tags: detail.tags,
                    relatedTokens: detail.relatedTokens,
                    aiAnalysis: detail.aiAnalysis ? {
                        sentiment: detail.aiAnalysis.sentiment,
                        summary: detail.aiAnalysis.summary,
                        impactScore: detail.aiAnalysis.impactScore
                    } : null,
                    sources: detail.sources
                }
            };
        } catch (error: any) {
            return {
                status: "error",
                message: `Failed to get topic detail: ${error.message}`,
                code: error.code?.toString()
            };
        }
    },
    'topic'
);

// ============ Tool: get_hot_topics ============

globalRegistry.register(
    'get_hot_topics',
    {
        type: "function",
        function: {
            name: "get_hot_topics",
            description: "Get trending/hot topics. Use to show user what's hot in the crypto world.",
            parameters: {
                type: "object",
                properties: {}
            }
        }
    },
    async (args, ctx): Promise<ToolResult> => {
        try {
            const topicService = getTopicService();
            const hotTopics = await topicService.getHotTopics();

            return {
                status: "success",
                data: {
                    topics: hotTopics.slice(0, 10).map(t => ({
                        id: t.id,
                        title: t.title,
                        summary: t.summary,
                        views: t.views,
                        relatedTokens: t.relatedTokens?.map(rt => rt.symbol) || []
                    }))
                }
            };
        } catch (error: any) {
            return {
                status: "error",
                message: `Failed to get hot topics: ${error.message}`,
                code: error.code?.toString()
            };
        }
    },
    'topic'
);

// ============ Tool: follow_topic ============

globalRegistry.register(
    'follow_topic',
    {
        type: "function",
        function: {
            name: "follow_topic",
            description: "Follow or unfollow a topic to get updates.",
            parameters: {
                type: "object",
                properties: {
                    topicId: {
                        type: "string",
                        description: "The topic ID to follow/unfollow"
                    },
                    action: {
                        type: "string",
                        enum: ["follow", "unfollow"],
                        description: "Follow or unfollow action"
                    }
                },
                required: ["topicId", "action"]
            }
        }
    },
    async (args, ctx): Promise<ToolResult> => {
        try {
            const topicService = getTopicService();

            if (args.action === 'follow') {
                await topicService.follow(args.topicId);
            } else {
                await topicService.unfollow(args.topicId);
            }

            return {
                status: "success",
                data: {
                    topicId: args.topicId,
                    action: args.action,
                    message: args.action === 'follow'
                        ? 'Successfully followed the topic!'
                        : 'Successfully unfollowed the topic!'
                }
            };
        } catch (error: any) {
            return {
                status: "error",
                message: `Failed to ${args.action} topic: ${error.message}`,
                code: error.code?.toString()
            };
        }
    },
    'topic'
);
