/**
 * Lite Embedding Provider
 * Supports: Local (transformers.js), OpenAI, Qwen
 * Default: Local model (no API key needed)
 */

import type { EmbeddingConfig } from "./config";

export interface EmbeddingProvider {
    embed: (text: string) => Promise<number[]>;
    embedBatch: (texts: string[]) => Promise<number[][]>;
    model: string;
    provider: string;
}

// Lazy-loaded transformers pipeline
let localPipeline: any = null;
let pipelineLoading: Promise<any> | null = null;

/**
 * Create local embedding provider using transformers.js
 * Model: Xenova/all-MiniLM-L6-v2 (384-dim vectors)
 */
async function createLocalEmbeddingProvider(): Promise<EmbeddingProvider> {
    const MODEL_NAME = "Xenova/all-MiniLM-L6-v2";

    // Lazy load the pipeline
    const getPipeline = async () => {
        if (localPipeline) return localPipeline;
        if (pipelineLoading) return pipelineLoading;

        pipelineLoading = (async () => {
            console.log(`[embedding] Loading local model: ${MODEL_NAME}...`);
            const { pipeline } = await import("@huggingface/transformers");
            localPipeline = await pipeline("feature-extraction", MODEL_NAME, {
                // Use ONNX backend for performance
                dtype: "fp32",
            });
            console.log(`[embedding] Local model loaded successfully`);
            return localPipeline;
        })();

        return pipelineLoading;
    };

    // Mean pooling to get sentence embedding from token embeddings
    const meanPool = (embeddings: number[][]): number[] => {
        if (embeddings.length === 0) return [];
        const dim = embeddings[0].length;
        const result = new Array(dim).fill(0);
        for (const emb of embeddings) {
            for (let i = 0; i < dim; i++) {
                result[i] += emb[i];
            }
        }
        for (let i = 0; i < dim; i++) {
            result[i] /= embeddings.length;
        }
        return result;
    };

    // Normalize vector to unit length
    const normalize = (vec: number[]): number[] => {
        let norm = 0;
        for (const v of vec) norm += v * v;
        norm = Math.sqrt(norm);
        if (norm === 0) return vec;
        return vec.map((v) => v / norm);
    };

    return {
        model: MODEL_NAME,
        provider: "local",

        embed: async (text: string): Promise<number[]> => {
            const pipe = await getPipeline();
            const output = await pipe(text, { pooling: "mean", normalize: true });
            // The output is a Tensor, convert to array
            const data = Array.from(output.data as Float32Array);
            return data;
        },

        embedBatch: async (texts: string[]): Promise<number[][]> => {
            if (texts.length === 0) return [];
            const pipe = await getPipeline();
            const results: number[][] = [];

            // Process one by one to avoid memory issues
            for (const text of texts) {
                const output = await pipe(text, { pooling: "mean", normalize: true });
                const data = Array.from(output.data as Float32Array);
                results.push(data);
            }
            return results;
        },
    };
}

/**
 * Create an embedding provider based on config
 */
export async function createEmbeddingProvider(
    config: EmbeddingConfig
): Promise<EmbeddingProvider> {
    // Use local provider by default or if explicitly specified
    if (config.provider === "local") {
        return createLocalEmbeddingProvider();
    }

    // Remote providers (OpenAI/Qwen) require API key
    const apiKey = config.apiKey || getDefaultApiKey(config.provider);
    if (!apiKey) {
        console.log(`[embedding] No API key for ${config.provider}, falling back to local model`);
        return createLocalEmbeddingProvider();
    }

    const baseUrl = config.baseUrl || getDefaultBaseUrl(config.provider);

    return {
        model: config.model,
        provider: config.provider,

        embed: async (text: string): Promise<number[]> => {
            const result = await callEmbeddingApi(baseUrl, apiKey, config.model, [text]);
            return result[0] || [];
        },

        embedBatch: async (texts: string[]): Promise<number[][]> => {
            if (texts.length === 0) return [];
            // Batch in groups of 20 to avoid rate limits
            const batchSize = 20;
            const results: number[][] = [];
            for (let i = 0; i < texts.length; i += batchSize) {
                const batch = texts.slice(i, i + batchSize);
                const embeddings = await callEmbeddingApi(baseUrl, apiKey, config.model, batch);
                results.push(...embeddings);
            }
            return results;
        },
    };
}

function getDefaultApiKey(provider: "openai" | "qwen" | "local"): string | undefined {
    if (provider === "local") return undefined;
    return provider === "openai"
        ? process.env.OPENAI_API_KEY
        : process.env.DASHSCOPE_API_KEY;
}

function getDefaultBaseUrl(provider: "openai" | "qwen" | "local"): string {
    if (provider === "local") return "";
    return provider === "openai"
        ? "https://api.openai.com/v1"
        : "https://dashscope.aliyuncs.com/compatible-mode/v1";
}

/**
 * Call OpenAI-compatible embedding API
 */
async function callEmbeddingApi(
    baseUrl: string,
    apiKey: string,
    model: string,
    inputs: string[]
): Promise<number[][]> {
    const response = await fetch(`${baseUrl}/embeddings`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            input: inputs,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Embedding API error (${response.status}): ${error}`);
    }

    const data = await response.json() as {
        data: Array<{ embedding: number[]; index: number }>;
    };

    // Sort by index to ensure correct order
    const sorted = data.data.sort((a, b) => a.index - b.index);
    return sorted.map((item) => item.embedding);
}

/**
 * Compute cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length === 0 || b.length === 0) return 0;
    const len = Math.min(a.length, b.length);
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < len; i++) {
        const av = a[i] ?? 0;
        const bv = b[i] ?? 0;
        dot += av * bv;
        normA += av * av;
        normB += bv * bv;
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
