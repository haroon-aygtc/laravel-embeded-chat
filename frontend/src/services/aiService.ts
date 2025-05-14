/**
 * AI Service
 *
 * Provides methods for interacting with AI endpoints with robust error handling and fallbacks.
 */

import {
  aiApi,
  GenerateRequest,
  GenerateResponse,
  AIModel,
  AIInteractionLog,
  LogQueryParams,
  LogsResponse,
  PerformanceMetrics,
  AICompletionRequest,
  AICompletionResponse,
  AIStreamChunk,
  PromptTemplate,
} from "./api/features/aifeatures";
import { aiProviderApi } from "./api/features/aiProvidersfeatures";
import logger from "@/utils/logger";
import followUpService from "@/services/followUpService";
import { FollowUpQuestion, GenerateFollowUpsRequest } from "./api/features/followupfeatures";
import { knowledgeBaseService } from './knowledgeBaseService';
import type { KnowledgeEntry } from './api/features/knowledgebase/knowledgebasefeatures';

// Maximum number of retries for API calls
const MAX_RETRIES = 3;

// Delay between retries in milliseconds (with exponential backoff)
const BASE_RETRY_DELAY = 1000;

// Error patterns that indicate a retryable error
const RETRYABLE_ERROR_PATTERNS = [
  'timeout',
  'network error',
  'connection',
  'rate limit',
  'too many requests',
  'server error',
  '5\\d\\d', // 5xx status codes
  'capacity',
  'overloaded',
  'try again',
  'temporary',
];

interface AIQueryOptions {
  contextRuleId?: string | null;
  metadata?: Record<string, any>;
  followUpConfigId?: string | null;
  useKnowledgeBase?: boolean;
  knowledgeBaseIds?: string[];
}

interface AIQueryResponse {
  query: string;
  ai_response: string;
  model_used: string;
  processing_time: number;
  token_usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  follow_up_questions?: FollowUpQuestion[];
  follow_up_config?: string;
  knowledge_base_results?: KnowledgeEntry[];
}

/**
 * Service to handle AI operations with robust error handling and fallbacks
 */
class AIService {
  /**
   * Check if an error is retryable based on its message
   */
  private isRetryableError(error: any): boolean {
    if (!error) return false;

    const errorMessage = error.message || error.toString();
    const errorMessageLower = errorMessage.toLowerCase();

    return RETRYABLE_ERROR_PATTERNS.some(pattern =>
      new RegExp(pattern, 'i').test(errorMessageLower)
    );
  }

  /**
   * Sleep for a specified duration
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute a function with retry logic
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = MAX_RETRIES,
    baseDelay: number = BASE_RETRY_DELAY
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // If this is the last attempt or the error is not retryable, throw it
        if (attempt === maxRetries || !this.isRetryableError(error)) {
          throw error;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;

        logger.info(`Retrying after error: ${error.message}`, {
          attempt: attempt + 1,
          maxRetries,
          delay,
        });

        // Wait before the next attempt
        await this.sleep(delay);
      }
    }

    // This should never be reached due to the throw in the loop
    throw lastError;
  }

  /**
   * Get fallback models for a given model
   */
  private async getFallbackModels(primaryModelId: string): Promise<AIModel[]> {
    try {
      // Get all available models
      const allModels = await this.getModels();
      if (!allModels || allModels.length === 0) return [];

      // Find the primary model
      const primaryModel = allModels.find(model => model.id === primaryModelId);
      if (!primaryModel) return allModels.filter(model => model.is_available);

      // First, try models from the same provider
      const sameProviderModels = allModels.filter(model =>
        model.provider === primaryModel.provider &&
        model.id !== primaryModelId &&
        model.is_available
      );

      // Then, add models from other providers
      const otherProviderModels = allModels.filter(model =>
        model.provider !== primaryModel.provider &&
        model.is_available
      );

      // Combine and sort by priority
      return [...sameProviderModels, ...otherProviderModels].sort((a, b) =>
        (b.priority || 0) - (a.priority || 0)
      );
    } catch (error) {
      logger.error("Error getting fallback models:", error);
      return [];
    }
  }
  /**
   * Generate a response using AI models with retry and fallback logic
   */
  generateResponse = async (options: GenerateRequest): Promise<GenerateResponse> => {
    try {
      // Try with the primary model first
      return await this.withRetry(async () => {
        const response = await aiApi.generate(options);

        if (!response.success || !response.data) {
          throw new Error(
            response.error?.message || "Failed to generate AI response"
          );
        }

        // Log the interaction
        await this.logInteraction({
          userId: options.userId,
          query: options.query,
          response: response.data.content,
          modelUsed: response.data.modelUsed,
          contextRuleId: options.contextRuleId,
          knowledgeBaseResults: response.data.knowledgeBaseResults,
          knowledgeBaseIds: response.data.knowledgeBaseIds,
          metadata: response.data.metadata,
        });

        return response.data;
      });
    } catch (error) {
      logger.error("Error generating AI response with primary model:", error);

      // Try with fallback models if a preferred model was specified
      if (options.preferredModel) {
        try {
          const fallbackModels = await this.getFallbackModels(options.preferredModel);

          // Try each fallback model in order
          for (const fallbackModel of fallbackModels) {
            try {
              logger.info(`Trying fallback model: ${fallbackModel.id}`);

              const fallbackOptions = {
                ...options,
                preferredModel: fallbackModel.id,
              };

              const response = await this.withRetry(() => aiApi.generate(fallbackOptions));

              if (response.success && response.data) {
                // Log the interaction with fallback model
                await this.logInteraction({
                  userId: options.userId,
                  query: options.query,
                  response: response.data.content,
                  modelUsed: response.data.modelUsed,
                  contextRuleId: options.contextRuleId,
                  knowledgeBaseResults: response.data.knowledgeBaseResults,
                  knowledgeBaseIds: response.data.knowledgeBaseIds,
                  metadata: {
                    ...response.data.metadata,
                    fallback: true,
                    originalModel: options.preferredModel,
                  },
                });

                return response.data;
              }
            } catch (fallbackError) {
              logger.error(`Error with fallback model ${fallbackModel.id}:`, fallbackError);
              // Continue to the next fallback model
            }
          }
        } catch (fallbackError) {
          logger.error("Error using fallback models:", fallbackError);
        }
      }

      // If all models failed or no fallbacks were available, return a generic response
      return {
        content: "I'm sorry, I encountered an error processing your request. Please try again later.",
        modelUsed: "fallback-model",
      };
    }
  };

  /**
   * Generate a streaming response from AI models with retry and fallback logic
   */
  generateStreamingResponse = async (
    options: GenerateRequest,
    callbacks: {
      onChunk: (chunk: AIStreamChunk) => void;
      onComplete?: (data: any) => void;
      onError?: (error: any) => void;
      onFallback?: (fallbackModel: string) => void;
    }
  ): Promise<void> => {
    // Track the full response for logging
    const responseChunks: string[] = [];

    // Try with the primary model
    try {
      await this.withRetry(async () => {
        const stream = await aiApi.generateStream(options);
        const reader = stream.getReader();
        const decoder = new TextDecoder("utf-8");

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);

          try {
            const jsonChunk = JSON.parse(chunk);
            callbacks.onChunk(jsonChunk);

            // Collect the text for logging
            if (jsonChunk.text) {
              responseChunks.push(jsonChunk.text);
            }
          } catch (e) {
            // Handle non-JSON chunks if needed
            callbacks.onChunk({ text: chunk });
            responseChunks.push(chunk);
          }
        }

        if (callbacks.onComplete) {
          callbacks.onComplete({});
        }

        // Log the interaction after completion
        this.logInteraction({
          userId: options.userId,
          query: options.query,
          response: responseChunks.join(''),
          modelUsed: options.preferredModel || "unknown",
          contextRuleId: options.contextRuleId,
          metadata: { streaming: true },
        });

        return true;
      });
    } catch (error) {
      logger.error("Error generating streaming AI response with primary model:", error);

      // Try with fallback models if a preferred model was specified
      if (options.preferredModel) {
        try {
          const fallbackModels = await this.getFallbackModels(options.preferredModel);

          // Try each fallback model in order
          for (const fallbackModel of fallbackModels) {
            try {
              logger.info(`Trying fallback model for streaming: ${fallbackModel.id}`);

              // Notify about fallback if callback is provided
              if (callbacks.onFallback) {
                callbacks.onFallback(fallbackModel.id);
              }

              const fallbackOptions = {
                ...options,
                preferredModel: fallbackModel.id,
              };

              // Clear previous response chunks
              responseChunks.length = 0;

              // Try with the fallback model
              const fallbackStream = await this.withRetry(() => aiApi.generateStream(fallbackOptions));
              const reader = fallbackStream.getReader();
              const decoder = new TextDecoder("utf-8");

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);

                try {
                  const jsonChunk = JSON.parse(chunk);
                  callbacks.onChunk(jsonChunk);

                  // Collect the text for logging
                  if (jsonChunk.text) {
                    responseChunks.push(jsonChunk.text);
                  }
                } catch (e) {
                  // Handle non-JSON chunks if needed
                  callbacks.onChunk({ text: chunk });
                  responseChunks.push(chunk);
                }
              }

              if (callbacks.onComplete) {
                callbacks.onComplete({
                  fallback: true,
                  originalModel: options.preferredModel,
                  fallbackModel: fallbackModel.id,
                });
              }

              // Log the interaction with fallback model
              this.logInteraction({
                userId: options.userId,
                query: options.query,
                response: responseChunks.join(''),
                modelUsed: fallbackModel.id,
                contextRuleId: options.contextRuleId,
                metadata: {
                  streaming: true,
                  fallback: true,
                  originalModel: options.preferredModel,
                },
              });

              // Successfully used a fallback model
              return;
            } catch (fallbackError) {
              logger.error(`Error with fallback streaming model ${fallbackModel.id}:`, fallbackError);
              // Continue to the next fallback model
            }
          }
        } catch (fallbackError) {
          logger.error("Error using fallback models for streaming:", fallbackError);
        }
      }

      // If all models failed, call the error callback
      if (callbacks.onError) {
        callbacks.onError(error);
      }

      // Send a fallback error message as a chunk
      callbacks.onChunk({
        text: "I'm sorry, I encountered an error processing your request. Please try again later.",
        error: true,
      });

      if (callbacks.onComplete) {
        callbacks.onComplete({ error: true });
      }
    }
  };

  /**
   * Log an AI interaction to the database
   */
  logInteraction = async (data: {
    userId: string;
    query: string;
    response: string;
    modelUsed: string;
    contextRuleId?: string;
    knowledgeBaseResults?: number;
    knowledgeBaseIds?: string[];
    metadata?: Record<string, any>;
  }): Promise<boolean> => {
    try {
      const response = await aiApi.logInteraction(data);

      if (!response.success) {
        logger.error("Error logging AI interaction:", response.error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error("Error logging AI interaction:", error);
      return false;
    }
  };

  /**
   * Get AI interaction logs with pagination and filtering
   */
  getInteractionLogs = async (params: LogQueryParams): Promise<LogsResponse> => {
    try {
      const response = await aiApi.getLogs(params);

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to fetch AI interaction logs"
        );
      }

      return response.data || {
        logs: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: params.page || 1,
      };
    } catch (error) {
      logger.error("Error getting AI interaction logs:", error);
      return {
        logs: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: params.page || 1,
      };
    }
  };

  /**
   * Get available AI models
   */
  getModels = async (): Promise<AIModel[]> => {
    try {
      const response = await aiApi.getModels();

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to fetch AI models");
      }

      return response.data || [];
    } catch (error) {
      logger.error("Error getting AI models:", error);
      return [];
    }
  };

  /**
   * Get a specific AI model by ID
   */
  getModel = async (id: string): Promise<AIModel | null> => {
    try {
      const response = await aiApi.getModelById(id);

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to fetch AI model");
      }

      return response.data || null;
    } catch (error) {
      logger.error("Error getting AI model:", error);
      return null;
    }
  };

  /**
   * Set the default AI model
   */
  setDefaultModel = async (modelId: string): Promise<boolean> => {
    try {
      const response = await aiApi.setDefaultModel(modelId);

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to set default AI model"
        );
      }

      return true;
    } catch (error) {
      logger.error("Error setting default AI model:", error);
      return false;
    }
  };

  /**
   * Get the default AI model
   */
  getDefaultModel = async (): Promise<AIModel | null> => {
    try {
      const response = await aiApi.getDefaultModel();

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to get default AI model"
        );
      }

      return response.data || null;
    } catch (error) {
      logger.error("Error getting default AI model:", error);
      return null;
    }
  };

  /**
   * Get AI model performance metrics
   */
  getModelPerformance = async (timeRange: string = "7d"): Promise<PerformanceMetrics> => {
    try {
      const response = await aiApi.getPerformance(timeRange);

      if (!response.success) {
        throw new Error(
          response.error?.message ||
          "Failed to fetch AI model performance metrics"
        );
      }

      return response.data || {
        modelUsage: [],
        avgResponseTimes: [],
        dailyUsage: [],
        timeRange: timeRange || "7d",
      };
    } catch (error) {
      logger.error("Error getting AI model performance metrics:", error);
      return {
        modelUsage: [],
        avgResponseTimes: [],
        dailyUsage: [],
        timeRange: timeRange || "7d",
      };
    }
  };

  /**
   * Get prompt templates
   */
  getPromptTemplates = async (): Promise<PromptTemplate[]> => {
    try {
      const response = await aiApi.getPromptTemplates();

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to fetch prompt templates");
      }

      return response.data || [];
    } catch (error) {
      logger.error("Error getting prompt templates:", error);
      return [];
    }
  };

  /**
   * Get a specific prompt template by ID
   */
  getPromptTemplate = async (id: string): Promise<PromptTemplate | null> => {
    try {
      const response = await aiApi.getPromptTemplateById(id);

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to fetch prompt template");
      }

      return response.data || null;
    } catch (error) {
      logger.error("Error getting prompt template:", error);
      return null;
    }
  };

  /**
   * Apply a prompt template with variables
   */
  applyTemplate = async (
    templateId: string,
    variables: Record<string, string>
  ): Promise<string> => {
    try {
      const response = await aiApi.applyTemplate(templateId, variables);

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to apply prompt template");
      }

      return response.data?.prompt || "";
    } catch (error) {
      logger.error("Error applying prompt template:", error);
      return "";
    }
  };

  /**
   * Send a query to the AI with optional follow-up integration, using retry and fallback logic
   */
  sendQuery = async (query: string, options: AIQueryOptions = {}): Promise<AIQueryResponse> => {
    try {
      // Use the existing generate endpoint with retry logic
      const request: GenerateRequest = {
        query: query,
        contextRuleId: options.contextRuleId || undefined,
        userId: "current", // This will be determined by the backend
        preferredModel: options.metadata?.preferredModel,
        additionalParams: options.metadata
      };

      // Use the generateResponse method which already has retry and fallback logic
      const response = await this.generateResponse(request);

      const aiResponse: AIQueryResponse = {
        query: query,
        ai_response: response.content,
        model_used: response.modelUsed,
        processing_time: 0, // Not available in the current API
        token_usage: response.tokenUsage
      };

      // Generate follow-up questions if a config was specified
      if (options.followUpConfigId) {
        try {
          const followUpRequest: GenerateFollowUpsRequest = {
            user_query: query,
            ai_response: aiResponse.ai_response,
            context: options.metadata,
            config_id: options.followUpConfigId,
          };

          // Use retry logic for follow-up generation
          const followUpQuestions = await this.withRetry(() =>
            followUpService.generateFollowUps(followUpRequest)
          );

          if (followUpQuestions.length > 0) {
            aiResponse.follow_up_questions = followUpQuestions;
            aiResponse.follow_up_config = options.followUpConfigId;
          }
        } catch (error) {
          logger.error("Error generating follow-up questions:", error);
          // Continue without follow-up questions if there's an error
        }
      }

      return aiResponse;
    } catch (error) {
      logger.error("Error in AI query:", error);

      // Return a fallback response
      return {
        query: query,
        ai_response: "I'm sorry, I encountered an error processing your request. Please try again later.",
        model_used: "fallback-model",
        processing_time: 0,
      };
    }
  };

  /**
   * Process a follow-up question
   */
  processFollowUp = async (
    selectedQuestion: FollowUpQuestion,
    previousQuery: string,
    previousResponse: string,
    contextRuleId?: string | null,
    metadata?: Record<string, any>
  ): Promise<AIQueryResponse> => {
    try {
      // First get the modified prompt
      const modifiedPrompt = await followUpService.processFollowUp({
        selected_question: selectedQuestion.question,
        previous_query: previousQuery,
        previous_response: previousResponse,
        context: metadata,
      });

      // Then send it to the AI
      return this.sendQuery(modifiedPrompt || selectedQuestion.question, {
        contextRuleId,
        metadata,
      });
    } catch (error) {
      console.error("Error processing follow-up:", error);
      throw error;
    }
  };

  /**
   * Send a query to the AI with knowledge base context, using retry and fallback logic
   */
  sendQueryWithKnowledge = async (
    query: string,
    options: AIQueryOptions = {}
  ): Promise<AIQueryResponse> => {
    try {
      // First, fetch knowledge base entries with retry logic
      let knowledgeEntries: KnowledgeEntry[] = [];

      if (options.useKnowledgeBase && options.knowledgeBaseIds && options.knowledgeBaseIds.length > 0) {
        try {
          knowledgeEntries = await this.withRetry(() =>
            this.searchKnowledgeBaseForQuery(query, options.knowledgeBaseIds)
          );

          logger.info(`Found ${knowledgeEntries.length} knowledge base entries for query`);
        } catch (kbError) {
          logger.error("Error searching knowledge base:", kbError);
          // Continue without knowledge base results if there's an error
        }
      }

      // Use the existing generate endpoint with knowledge base parameters
      const request: GenerateRequest = {
        query: query,
        contextRuleId: options.contextRuleId || undefined,
        userId: "current", // This will be determined by the backend
        knowledgeBaseIds: options.knowledgeBaseIds,
        preferredModel: options.metadata?.preferredModel,
        additionalParams: {
          ...options.metadata,
          useKnowledgeBase: true // This will be extracted on the backend
        }
      };

      // Use the generateResponse method which already has retry and fallback logic
      const response = await this.generateResponse(request);

      const aiResponse: AIQueryResponse = {
        query: query,
        ai_response: response.content,
        model_used: response.modelUsed,
        processing_time: 0, // Not available in the current API
        token_usage: response.tokenUsage
      };

      // Add knowledge base results if available
      if (knowledgeEntries.length > 0) {
        aiResponse.knowledge_base_results = knowledgeEntries;
      } else if (response.knowledgeBaseResults) {
        // If the backend returned knowledge base results, use those
        aiResponse.knowledge_base_results = response.knowledgeBaseResults;
      }

      // Generate follow-up questions if a config was specified
      if (options.followUpConfigId) {
        try {
          const followUpRequest: GenerateFollowUpsRequest = {
            user_query: query,
            ai_response: aiResponse.ai_response,
            context: {
              ...options.metadata,
              knowledgeBaseResults: knowledgeEntries.length > 0 ? knowledgeEntries : undefined
            },
            config_id: options.followUpConfigId,
          };

          // Use retry logic for follow-up generation
          const followUpQuestions = await this.withRetry(() =>
            followUpService.generateFollowUps(followUpRequest)
          );

          if (followUpQuestions.length > 0) {
            aiResponse.follow_up_questions = followUpQuestions;
            aiResponse.follow_up_config = options.followUpConfigId;
          }
        } catch (error) {
          logger.error("Error generating follow-up questions:", error);
          // Continue without follow-up questions if there's an error
        }
      }

      return aiResponse;
    } catch (error) {
      logger.error("Error in AI query with knowledge base:", error);

      // Return a fallback response
      return {
        query: query,
        ai_response: "I'm sorry, I encountered an error processing your request. Please try again later.",
        model_used: "fallback-model",
        processing_time: 0,
      };
    }
  };

  /**
   * Search knowledge bases for relevant content with retry logic
   */
  searchKnowledgeBaseForQuery = async (
    query: string,
    knowledgeBaseIds?: string[]
  ): Promise<KnowledgeEntry[]> => {
    try {
      // Use the knowledge base service search with retry logic
      const results = await this.withRetry(() => knowledgeBaseService.search(query));

      // Filter by specific knowledge bases if provided
      if (knowledgeBaseIds && knowledgeBaseIds.length > 0) {
        return results.filter(entry =>
          knowledgeBaseIds.includes(entry.knowledge_base_id)
        );
      }

      return results;
    } catch (error) {
      logger.error("Error searching knowledge bases:", error);
      return [];
    }
  };
}

// Create and export a singleton instance
export const aiService = new AIService();
export default aiService;
