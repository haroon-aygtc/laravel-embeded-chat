/**
 * AI Service
 * 
 * Provides methods for interacting with AI endpoints.
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
import logger from "@/utils/logger";
import followUpService from "@/services/followUpService";
import { FollowUpQuestion, GenerateFollowUpsRequest } from "./api/features/followupfeatures";
import { knowledgeBaseService } from './knowledgeBaseService';
import type { KnowledgeEntry } from './api/features/knowledgebase/knowledgebasefeatures';

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
 * Service to handle AI operations
 */
class AIService {
  /**
   * Generate a response using AI models
   */
  generateResponse = async (options: GenerateRequest): Promise<GenerateResponse> => {
    try {
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
    } catch (error) {
      logger.error("Error generating AI response:", error);

      // Return a fallback response
      return {
        content: "I'm sorry, I encountered an error processing your request. Please try again later.",
        modelUsed: "fallback-model",
      };
    }
  };

  /**
   * Generate a streaming response from AI models
   */
  generateStreamingResponse = async (
    options: GenerateRequest,
    callbacks: {
      onChunk: (chunk: AIStreamChunk) => void;
      onComplete?: (data: any) => void;
      onError?: (error: any) => void;
    }
  ): Promise<void> => {
    try {
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
        } catch (e) {
          // Handle non-JSON chunks if needed
          callbacks.onChunk({ text: chunk });
        }
      }

      if (callbacks.onComplete) {
        callbacks.onComplete({});
      }

      // Log the interaction after completion
      this.logInteraction({
        userId: options.userId,
        query: options.query,
        response: "[STREAM RESPONSE]", // You might want to collect the full response during streaming
        modelUsed: options.preferredModel || "unknown",
        contextRuleId: options.contextRuleId,
        metadata: { streaming: true },
      });
    } catch (error) {
      logger.error("Error generating streaming AI response:", error);
      if (callbacks.onError) {
        callbacks.onError(error);
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
   * Send a query to the AI with optional follow-up integration
   */
  sendQuery = async (query: string, options: AIQueryOptions = {}): Promise<AIQueryResponse> => {
    try {
      // Use the existing generate endpoint
      const request: GenerateRequest = {
        query: query,
        contextRuleId: options.contextRuleId || undefined,
        userId: "current", // This will be determined by the backend
        additionalParams: options.metadata
      };

      const response = await aiApi.generate(request);

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to get response from AI");
      }

      const aiResponse: AIQueryResponse = {
        query: query,
        ai_response: response.data.content,
        model_used: response.data.modelUsed,
        processing_time: 0, // Not available in the current API
        token_usage: undefined // Not available in the current API
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

          const followUpQuestions = await followUpService.generateFollowUps(followUpRequest);

          if (followUpQuestions.length > 0) {
            aiResponse.follow_up_questions = followUpQuestions;
            aiResponse.follow_up_config = options.followUpConfigId;
          }
        } catch (error) {
          console.error("Error generating follow-up questions:", error);
          // Continue without follow-up questions if there's an error
        }
      }

      return aiResponse;
    } catch (error) {
      console.error("Error in AI query:", error);
      throw error;
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
   * Send a query to the AI with knowledge base context
   */
  sendQueryWithKnowledge = async (
    query: string,
    options: AIQueryOptions = {}
  ): Promise<AIQueryResponse> => {
    try {
      // Use the existing generate endpoint with knowledge base parameters
      const request: GenerateRequest = {
        query: query,
        contextRuleId: options.contextRuleId || undefined,
        userId: "current", // This will be determined by the backend
        knowledgeBaseIds: options.knowledgeBaseIds,
        additionalParams: {
          ...options.metadata,
          useKnowledgeBase: true // This will be extracted on the backend
        }
      };

      const response = await aiApi.generate(request);

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to get response from AI");
      }

      const aiResponse: AIQueryResponse = {
        query: query,
        ai_response: response.data.content,
        model_used: response.data.modelUsed,
        processing_time: 0, // Not available in the current API
        token_usage: undefined // Not available in the current API
      };

      // Get knowledge base results if available
      if (response.data.knowledgeBaseResults) {
        // The backend will need to be updated to return the actual entries
        // For now, we'll just search manually if needed
        if (options.knowledgeBaseIds && options.knowledgeBaseIds.length > 0) {
          try {
            const knowledgeEntries = await this.searchKnowledgeBaseForQuery(query, options.knowledgeBaseIds);
            if (knowledgeEntries.length > 0) {
              aiResponse.knowledge_base_results = knowledgeEntries;
            }
          } catch (error) {
            console.error("Error fetching knowledge base entries:", error);
          }
        }
      }

      // Generate follow-up questions if a config was specified
      if (options.followUpConfigId) {
        try {
          const followUpRequest: GenerateFollowUpsRequest = {
            user_query: query,
            ai_response: aiResponse.ai_response,
            context: options.metadata,
            config_id: options.followUpConfigId,
          };

          const followUpQuestions = await followUpService.generateFollowUps(followUpRequest);

          if (followUpQuestions.length > 0) {
            aiResponse.follow_up_questions = followUpQuestions;
            aiResponse.follow_up_config = options.followUpConfigId;
          }
        } catch (error) {
          console.error("Error generating follow-up questions:", error);
          // Continue without follow-up questions if there's an error
        }
      }

      return aiResponse;
    } catch (error) {
      console.error("Error in AI query with knowledge base:", error);
      throw error;
    }
  };

  /**
   * Search knowledge bases for relevant content
   */
  searchKnowledgeBaseForQuery = async (
    query: string,
    knowledgeBaseIds?: string[]
  ): Promise<KnowledgeEntry[]> => {
    try {
      // Use the knowledge base service search
      const results = await knowledgeBaseService.search(query);

      // Filter by specific knowledge bases if provided
      if (knowledgeBaseIds && knowledgeBaseIds.length > 0) {
        return results.filter(entry =>
          knowledgeBaseIds.includes(entry.knowledge_base_id)
        );
      }

      return results;
    } catch (error) {
      console.error("Error searching knowledge bases:", error);
      return [];
    }
  };
}

// Create and export a singleton instance
export const aiService = new AIService();
export default aiService;
