/**
 * AI Service Features Module
 *
 * Provides API functionality for interacting with AI capabilities.
 */

import { api, ApiResponse } from "../middleware/apiMiddleware";
import { aiEndpoints } from "../endpoints/aiEndpoints";
import logger from "@/utils/logger";
import { AIModelRequest, AIModelResponse } from "@/services/ai/types";

export interface AIModel {
    id: string;
    name: string;
    description: string;
    maxTokens: number;
    trainingData: string;
    isAvailable: boolean;
}

export interface GenerateOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    contextData?: any;
}

export interface GenerateResponse {
    id: string;
    content: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

export interface StreamingOptions extends GenerateOptions {
    onProgress?: (content: string) => void;
    onComplete?: (response: GenerateResponse) => void;
    onError?: (error: Error) => void;
}

interface AIInteractionLogsParams {
    page: number;
    pageSize: number;
    query?: string;
    modelUsed?: string;
    contextRuleId?: string;
    startDate?: string;
    endDate?: string;
}

interface GenerateResponseOptions {
    query: string;
    contextRuleId?: string;
    userId: string;
    knowledgeBaseIds?: string[];
    promptTemplate?: string;
    systemPrompt?: string;
    preferredModel?: string;
    maxTokens?: number;
    temperature?: number;
    additionalParams?: Record<string, any>;
}

interface ModelPerformanceParams {
    timeRange?: string;
    startDate?: string;
    endDate?: string;
}

export const aiFeatures = {
    /**
     * Get available AI models
     */
    getModels: async (): Promise<ApiResponse<AIModel[]>> => {
        try {
            return await api.get<AIModel[]>(aiEndpoints.models);
        } catch (error) {
            logger.error('Error fetching AI models:', error);
            return {
                success: false,
                data: [],
                error: { message: 'Failed to fetch AI models', code: 'AI_MODELS_FETCH_ERROR' }
            };
        }
    },

    /**
     * Generate a response from AI
     */
    generate: async (prompt: string, options: GenerateOptions = {}): Promise<ApiResponse<GenerateResponse>> => {
        try {
            const payload = {
                prompt,
                model: options.model || 'gpt-3.5-turbo',
                temperature: options.temperature || 0.7,
                maxTokens: options.maxTokens || 1000,
                contextData: options.contextData,
            };

            const response = await api.post<any>(aiEndpoints.generate, payload);

            if (!response.success || !response.data) {
                return {
                    success: false,
                    error: { message: 'Failed to generate AI response', code: 'AI_RESPONSE_GENERATION_ERROR' }
                };
            }

            // Parse the response into the expected format
            const result: GenerateResponse = {
                id: response.data.id,
                content: response.data.choices[0].message.content,
                usage: {
                    promptTokens: response.data.usage.prompt_tokens,
                    completionTokens: response.data.usage.completion_tokens,
                    totalTokens: response.data.usage.total_tokens,
                },
            };

            return {
                success: true,
                data: result
            };
        } catch (error) {
            logger.error('Error generating AI response:', error);
            return {
                success: false,
                error: { message: 'Error generating AI response', code: 'AI_RESPONSE_GENERATION_ERROR' }
            };
        }
    },

    /**
     * Generate a streaming response from AI
     */
    streamGenerate: async (prompt: string, options: StreamingOptions = {}): Promise<void> => {
        try {
            const payload = {
                prompt,
                model: options.model || 'gpt-3.5-turbo',
                temperature: options.temperature || 0.7,
                maxTokens: options.maxTokens || 1000,
                contextData: options.contextData,
            };

            // In a real implementation, you would use fetch with ReadableStream
            // or EventSource to handle streaming. For now, we'll simulate it
            // with the normal endpoint.

            const response = await api.post<any>(aiEndpoints.generate, payload);

            if (!response.success || !response.data) {
                throw new Error('Failed to generate AI response');
            }

            // Simulate streaming by breaking the response into chunks
            const content = response.data.choices[0].message.content;
            const chunks = content.split(' ');

            let accumulatedContent = '';

            // Process chunks with a slight delay to simulate streaming
            for (const chunk of chunks) {
                await new Promise(resolve => setTimeout(resolve, 50));
                accumulatedContent += chunk + ' ';

                if (options.onProgress) {
                    options.onProgress(accumulatedContent);
                }
            }

            if (options.onComplete) {
                options.onComplete({
                    id: response.data.id,
                    content: accumulatedContent,
                    usage: {
                        promptTokens: response.data.usage.prompt_tokens,
                        completionTokens: response.data.usage.completion_tokens,
                        totalTokens: response.data.usage.total_tokens,
                    },
                });
            }
        } catch (error) {
            logger.error('Error streaming AI response:', error);

            if (options.onError && error instanceof Error) {
                options.onError(error);
            }
        }
    },

    /**
     * Get AI interaction logs
     */
    getLogs: async (page: number = 1, perPage: number = 20): Promise<ApiResponse<any>> => {
        try {
            return await api.get(aiEndpoints.logs, {
                params: { page, perPage }
            });
        } catch (error) {
            logger.error('Error fetching AI logs:', error);
            return {
                success: false,
                data: { logs: [], total: 0, page: 1, perPage: 20, lastPage: 1 },
                error: { message: 'Failed to fetch AI logs', code: 'AI_LOGS_FETCH_ERROR' }
            };
        }
    },

    /**
     * Generate a response using AI models
     */
    generateResponse: async (
        options: GenerateResponseOptions,
    ): Promise<ApiResponse<AIModelResponse>> => {
        try {
            // Convert options to AIModelRequest format
            const modelRequest: AIModelRequest = {
                query: options.query,
                contextRuleId: options.contextRuleId,
                userId: options.userId,
                knowledgeBaseIds: options.knowledgeBaseIds,
                promptTemplate: options.promptTemplate,
                systemPrompt: options.systemPrompt,
                preferredModel: options.preferredModel,
                maxTokens: options.maxTokens,
                temperature: options.temperature,
                additionalParams: options.additionalParams,
            };

            // Use the API to generate a response
            const response = await api.post<AIModelResponse>(
                aiEndpoints.generate,
                modelRequest,
            );

            if (!response.success || !response.data) {
                return {
                    success: false,
                    error: { message: response.error?.message || "Failed to generate AI response", code: 'AI_RESPONSE_GENERATION_ERROR' }
                };
            }

            // Log the interaction
            await aiFeatures.logInteraction({
                userId: options.userId,
                query: options.query,
                response: response.data.content,
                modelUsed: response.data.modelUsed,
                contextRuleId: options.contextRuleId,
                knowledgeBaseResults: response.data.knowledgeBaseResults || 0,
                knowledgeBaseIds: response.data.knowledgeBaseIds || [],
                metadata: response.data.metadata,
            });

            return response;
        } catch (error) {
            logger.error("Error generating AI response:", error);

            // Return a fallback response
            const fallbackResponse: AIModelResponse = {
                content: "I'm sorry, I encountered an error processing your request. Please try again later.",
                modelUsed: "fallback-model",
            };

            // Try to log the error
            try {
                await aiFeatures.logInteraction({
                    userId: options.userId,
                    query: options.query,
                    response: fallbackResponse.content,
                    modelUsed: fallbackResponse.modelUsed,
                    contextRuleId: options.contextRuleId,
                    metadata: {
                        error: error instanceof Error ? error.message : String(error),
                    },
                });
            } catch (logError) {
                logger.error("Failed to log AI interaction error:", logError);
            }

            return {
                success: true,
                data: fallbackResponse
            };
        }
    },

    /**
     * Log an AI interaction to the database
     */
    logInteraction: async (data: {
        userId: string;
        query: string;
        response: string;
        modelUsed: string;
        contextRuleId?: string;
        knowledgeBaseResults?: number;
        knowledgeBaseIds?: string[];
        metadata?: Record<string, any>;
    }): Promise<ApiResponse<{ id: string }>> => {
        try {
            return await api.post<{ id: string }>(aiEndpoints.logs, data);
        } catch (error) {
            logger.error("Error logging AI interaction:", error);
            return {
                success: false,
                error: { message: "Error logging AI interaction", code: 'AI_LOG_INTERACTION_ERROR' }
            };
        }
    },

    /**
     * Get AI interaction logs with pagination and filtering
     */
    getInteractionLogs: async (params: AIInteractionLogsParams): Promise<ApiResponse<{
        logs: any[];
        totalItems: number;
        totalPages: number;
        currentPage: number;
    }>> => {
        try {
            return await api.get<{
                logs: any[];
                totalItems: number;
                totalPages: number;
                currentPage: number;
            }>(aiEndpoints.logs, { params });
        } catch (error) {
            logger.error("Error getting AI interaction logs:", error);
            return {
                success: false,
                data: {
                    logs: [],
                    totalItems: 0,
                    totalPages: 0,
                    currentPage: params.page,
                },
                error: { message: "Failed to fetch AI interaction logs", code: 'AI_LOGS_FETCH_ERROR' }
            };
        }
    },

    /**
     * Get available AI models
     */
    getAvailableModels: async (): Promise<ApiResponse<Array<{
        id: string;
        name: string;
        provider: string;
    }>>> => {
        try {
            return await api.get<Array<{
                id: string;
                name: string;
                provider: string;
            }>>(aiEndpoints.models);
        } catch (error) {
            logger.error("Error getting available AI models:", error);
            return {
                success: false,
                data: [],
                error: { message: "Failed to fetch available AI models", code: 'AI_MODELS_FETCH_ERROR' }
            };
        }
    },

    /**
     * Set the default AI model
     */
    setDefaultModel: async (modelId: string): Promise<ApiResponse<boolean>> => {
        try {
            return await api.post<boolean>(aiEndpoints.defaultModel, {
                modelId,
            });
        } catch (error) {
            logger.error("Error setting default AI model:", error);
            return {
                success: false,
                data: false,
                error: { message: "Failed to set default AI model", code: 'AI_DEFAULT_MODEL_SET_ERROR' }
            };
        }
    },

    /**
     * Get the default AI model
     */
    getDefaultModel: async (): Promise<ApiResponse<{
        id: string;
        name: string;
        provider: string;
    }>> => {
        try {
            return await api.get<{
                id: string;
                name: string;
                provider: string;
            }>(aiEndpoints.defaultModel);
        } catch (error) {
            logger.error("Error getting default AI model:", error);
            return {
                success: false,
                data: null,
                error: { message: "Failed to get default AI model", code: 'AI_DEFAULT_MODEL_FETCH_ERROR' }
            };
        }
    },

    /**
     * Get AI model performance metrics
     */
    getModelPerformance: async (params: ModelPerformanceParams = {}): Promise<ApiResponse<{
        modelUsage: any[];
        avgResponseTimes: any[];
        dailyUsage: any[];
        timeRange: string;
    }>> => {
        try {
            return await api.get<{
                modelUsage: any[];
                avgResponseTimes: any[];
                dailyUsage: any[];
                timeRange: string;
            }>(aiEndpoints.performance, { params });
        } catch (error) {
            logger.error("Error getting AI model performance metrics:", error);
            return {
                success: false,
                data: {
                    modelUsage: [],
                    avgResponseTimes: [],
                    dailyUsage: [],
                    timeRange: params.timeRange || "7d",
                },
                error: { message: "Failed to fetch AI model performance metrics", code: 'AI_MODEL_PERFORMANCE_FETCH_ERROR' }
            };
        }
    },
};

// Alias for backward compatibility
export const aiApi = aiFeatures;

// Default export
export default aiFeatures; 