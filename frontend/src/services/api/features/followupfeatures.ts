/**
 * Follow-Up API Service
 *
 * This service provides methods for interacting with follow-up configuration endpoints
 */

import { api, ApiResponse } from "../middleware/apiMiddleware";
import { followUpEndpoints } from "../endpoints/followUpEndpoints";

export interface FollowUpQuestion {
    id: string;
    config_id: string;
    question: string;
    display_order: number;
    is_active: boolean;
    priority: "high" | "medium" | "low";
    display_position: "beginning" | "middle" | "end";
    category?: string;
    metadata?: Record<string, any>;
    created_at?: string;
    updated_at?: string;
}

export interface FollowUpConfig {
    id: string;
    user_id: number;
    name: string;
    enable_follow_up_questions: boolean;
    max_follow_up_questions: number;
    show_follow_up_as: "buttons" | "chips" | "dropdown" | "list";
    generate_automatically: boolean;
    is_default: boolean;
    predefined_question_sets?: Record<string, any>[];
    topic_based_question_sets?: Record<string, any>[];
    created_at?: string;
    updated_at?: string;
    questions?: FollowUpQuestion[];
}

// Alternative interface format used in some services
export interface FollowUpConfigData {
  id?: string;
  userId: string;
  name: string;
  enableFollowUpQuestions: boolean;
  maxFollowUpQuestions: number;
  showFollowUpAs: "buttons" | "chips" | "list";
  generateAutomatically: boolean;
  isDefault?: boolean;
  predefinedQuestionSets?: PredefinedQuestionSetData[];
  topicBasedQuestionSets?: TopicBasedQuestionSetData[];
}

export interface PredefinedQuestionSetData {
  id?: string;
  name: string;
  description?: string;
  triggerKeywords?: string[];
  questions: string[];
}

export interface TopicBasedQuestionSetData {
  id?: string;
  topic: string;
  questions: string[];
}

export interface GenerateFollowUpsRequest {
    user_query: string;
    ai_response: string;
    context?: Record<string, any>;
    config_id?: string;
}

export interface GenerateFollowUpsResponse {
    follow_up_questions: FollowUpQuestion[];
    config_used: string | null;
    source: "predefined" | "generated";
}

export interface ProcessFollowUpRequest {
    selected_question: string;
    previous_query: string;
    previous_response: string;
    context?: Record<string, any>;
}

export interface ProcessFollowUpResponse {
    modified_prompt: string;
    context_updated: boolean;
}

/**
 * API methods for follow-up functionality
 */
export const followUpApi = {
    /**
     * Get all follow-up configurations
     */
    getConfigs: async (userId?: number): Promise<ApiResponse<FollowUpConfig[]>> => {
        const params = userId ? { user_id: userId } : {};
        return api.get(followUpEndpoints.configs, { params });
    },

    /**
     * Get a specific follow-up configuration
     */
    getConfig: async (id: string): Promise<ApiResponse<FollowUpConfig>> => {
        return api.get(followUpEndpoints.config(id));
    },

    /**
     * Create a new follow-up configuration
     */
    createConfig: async (config: Partial<FollowUpConfig>): Promise<ApiResponse<FollowUpConfig>> => {
        return api.post(followUpEndpoints.configs, config);
    },

    /**
     * Update a follow-up configuration
     */
    updateConfig: async (id: string, config: Partial<FollowUpConfig>): Promise<ApiResponse<FollowUpConfig>> => {
        return api.put(followUpEndpoints.config(id), config);
    },

    /**
     * Delete a follow-up configuration
     */
    deleteConfig: async (id: string): Promise<ApiResponse<{ message: string }>> => {
        return api.delete(followUpEndpoints.config(id));
    },

    /**
     * Get questions for a specific configuration
     */
    getQuestions: async (configId: string): Promise<ApiResponse<FollowUpQuestion[]>> => {
        return api.get(followUpEndpoints.questions(configId));
    },

    /**
     * Add a question to a configuration
     */
    addQuestion: async (configId: string, question: Partial<FollowUpQuestion>): Promise<ApiResponse<FollowUpQuestion>> => {
        return api.post(followUpEndpoints.questions(configId), question);
    },

    /**
     * Update a question
     */
    updateQuestion: async (id: string, question: Partial<FollowUpQuestion>): Promise<ApiResponse<FollowUpQuestion>> => {
        return api.put(followUpEndpoints.question(id), question);
    },

    /**
     * Delete a question
     */
    deleteQuestion: async (id: string): Promise<ApiResponse<{ message: string }>> => {
        return api.delete(followUpEndpoints.question(id));
    },

    /**
     * Reorder questions in a configuration
     */
    reorderQuestions: async (configId: string, questionIds: string[]): Promise<ApiResponse<{ message: string }>> => {
        return api.put(followUpEndpoints.reorderQuestions(configId), { question_ids: questionIds });
    },

    /**
     * Generate follow-up questions based on conversation context
     */
    generateFollowUps: async (request: GenerateFollowUpsRequest): Promise<ApiResponse<GenerateFollowUpsResponse>> => {
        return api.post(followUpEndpoints.generate, request);
    },

    /**
     * Process a selected follow-up question
     */
    processFollowUp: async (request: ProcessFollowUpRequest): Promise<ApiResponse<ProcessFollowUpResponse>> => {
        return api.post(followUpEndpoints.process, request);
    },
}; 