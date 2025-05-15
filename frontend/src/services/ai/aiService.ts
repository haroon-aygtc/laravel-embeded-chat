/**
 * AI Service Module (Adapter)
 * 
 * This is an adapter for the new API structure to maintain backward compatibility.
 * It imports from the new aiFeatures module but exposes the same interface as the old aiService.
 */

import { aiFeatures } from "../api/features/aiService";
import logger from "@/utils/logger";
import { AIModelRequest, AIModelResponse } from "./types";

// Re-export interfaces for backward compatibility
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

// Adapter service that maintains the old interface but uses the new implementation
const aiService = {
    /**
     * Get available AI models
     */
    getModels: async (): Promise<AIModel[]> => {
        try {
            const response = await aiFeatures.getModels();
            if (!response.success || !response.data) {
                throw new Error('Failed to fetch AI models');
            }
            return response.data;
        } catch (error) {
            logger.error('Error fetching AI models:', error);
            return [];
        }
    },

    /**
     * Generate a response from AI
     */
    generate: async (prompt: string, options: GenerateOptions = {}): Promise<GenerateResponse | null> => {
        try {
            const response = await aiFeatures.generate(prompt, options);

            if (!response.success || !response.data) {
                throw new Error('Failed to generate AI response');
            }

            return response.data;
        } catch (error) {
            logger.error('Error generating AI response:', error);
            return null;
        }
    },

    /**
     * Generate a streaming response from AI
     */
    streamGenerate: async (prompt: string, options: StreamingOptions = {}): Promise<void> => {
        return aiFeatures.streamGenerate(prompt, options);
    },

    /**
     * Get AI interaction logs
     */
    getLogs: async (page: number = 1, perPage: number = 20): Promise<any> => {
        try {
            const response = await aiFeatures.getLogs(page, perPage);

            if (!response.success || !response.data) {
                throw new Error('Failed to fetch AI logs');
            }

            return response.data;
        } catch (error) {
            logger.error('Error fetching AI logs:', error);
            return { logs: [], total: 0, page: 1, perPage: 20, lastPage: 1 };
        }
    },

    /**
     * Generate a response using AI models
     */
    generateResponse: async (
        options: {
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
    ): Promise<AIModelResponse> => {
        try {
            const response = await aiFeatures.generateResponse(options);

            if (!response.success || !response.data) {
                throw new Error(
                    response.error?.message || "Failed to generate AI response",
                );
            }

            return response.data;
        } catch (error) {
            logger.error("Error generating AI response:", error);

            // Return a fallback response
            return {
                content: "I'm sorry, I encountered an error processing your request. Please try again later.",
                modelUsed: "fallback-model",
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
    }) => {
        try {
            const response = await aiFeatures.logInteraction(data);

            if (!response.success) {
                logger.error("Error logging AI interaction:", response.error);
                return false;
            }

            return true;
        } catch (error) {
            logger.error("Error logging AI interaction:", error);
            return false;
        }
    },

    /**
     * Get AI interaction logs with pagination and filtering
     */
    getInteractionLogs: async (params: {
        page: number;
        pageSize: number;
        query?: string;
        modelUsed?: string;
        contextRuleId?: string;
        startDate?: string;
        endDate?: string;
    }) => {
        try {
            const response = await aiFeatures.getInteractionLogs(params);

            if (!response.success) {
                throw new Error(
                    response.error?.message || "Failed to fetch AI interaction logs",
                );
            }

            return response.data || {
                logs: [],
                totalItems: 0,
                totalPages: 0,
                currentPage: params.page,
            };
        } catch (error) {
            logger.error("Error getting AI interaction logs:", error);
            return {
                logs: [],
                totalItems: 0,
                totalPages: 0,
                currentPage: params.page,
            };
        }
    },

    /**
     * Get available AI models
     */
    getAvailableModels: async () => {
        try {
            const response = await aiFeatures.getAvailableModels();

            if (!response.success) {
                throw new Error(
                    response.error?.message || "Failed to fetch available AI models",
                );
            }

            return response.data || [];
        } catch (error) {
            logger.error("Error getting available AI models:", error);
            return [];
        }
    },

    /**
     * Set the default AI model
     */
    setDefaultModel: async (modelId: string) => {
        try {
            const response = await aiFeatures.setDefaultModel(modelId);

            if (!response.success) {
                throw new Error(
                    response.error?.message || "Failed to set default AI model",
                );
            }

            return true;
        } catch (error) {
            logger.error("Error setting default AI model:", error);
            return false;
        }
    },

    /**
     * Get the default AI model
     */
    getDefaultModel: async () => {
        try {
            const response = await aiFeatures.getDefaultModel();

            if (!response.success) {
                throw new Error(
                    response.error?.message || "Failed to get default AI model",
                );
            }

            return response.data || null;
        } catch (error) {
            logger.error("Error getting default AI model:", error);
            return null;
        }
    },

    /**
     * Get AI model performance metrics
     */
    getModelPerformance: async (params: {
        timeRange?: string;
        startDate?: string;
        endDate?: string;
    } = {}) => {
        try {
            const response = await aiFeatures.getModelPerformance(params);

            if (!response.success) {
                throw new Error(
                    response.error?.message ||
                    "Failed to fetch AI model performance metrics",
                );
            }

            return response.data || {
                modelUsage: [],
                avgResponseTimes: [],
                dailyUsage: [],
                timeRange: params.timeRange || "7d",
            };
        } catch (error) {
            logger.error("Error getting AI model performance metrics:", error);
            return {
                modelUsage: [],
                avgResponseTimes: [],
                dailyUsage: [],
                timeRange: params.timeRange || "7d",
            };
        }
    },
};

export default aiService;