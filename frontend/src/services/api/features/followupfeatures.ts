/**
 * Follow-Up API Service
 *
 * This service provides methods for interacting with follow-up configuration endpoints
 */

import { api, ApiResponse } from "../middleware/apiMiddleware";

export interface FollowUpQuestion {
    id: string;
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
        return api.get("/follow-up/configs", { params });
    },

    /**
     * Get a specific follow-up configuration
     */
    getConfig: async (id: string): Promise<ApiResponse<FollowUpConfig>> => {
        return api.get(`/follow-up/configs/${id}`);
    },

    /**
     * Create a new follow-up configuration
     */
    createConfig: async (config: Partial<FollowUpConfig>): Promise<ApiResponse<FollowUpConfig>> => {
        return api.post("/follow-up/configs", config);
    },

    /**
     * Update a follow-up configuration
     */
    updateConfig: async (id: string, config: Partial<FollowUpConfig>): Promise<ApiResponse<FollowUpConfig>> => {
        return api.put(`/follow-up/configs/${id}`, config);
    },

    /**
     * Delete a follow-up configuration
     */
    deleteConfig: async (id: string): Promise<ApiResponse<{ message: string }>> => {
        return api.delete(`/follow-up/configs/${id}`);
    },

    /**
     * Get questions for a specific configuration
     */
    getQuestions: async (configId: string): Promise<ApiResponse<FollowUpQuestion[]>> => {
        return api.get(`/follow-up/configs/${configId}/questions`);
    },

    /**
     * Add a question to a configuration
     */
    addQuestion: async (configId: string, question: Partial<FollowUpQuestion>): Promise<ApiResponse<FollowUpQuestion>> => {
        return api.post(`/follow-up/configs/${configId}/questions`, question);
    },

    /**
     * Update a question
     */
    updateQuestion: async (id: string, question: Partial<FollowUpQuestion>): Promise<ApiResponse<FollowUpQuestion>> => {
        return api.put(`/follow-up/questions/${id}`, question);
    },

    /**
     * Delete a question
     */
    deleteQuestion: async (id: string): Promise<ApiResponse<{ message: string }>> => {
        return api.delete(`/follow-up/questions/${id}`);
    },

    /**
     * Generate follow-up questions based on conversation context
     */
    generateFollowUps: async (request: GenerateFollowUpsRequest): Promise<ApiResponse<GenerateFollowUpsResponse>> => {
        return api.post("/follow-up/generate", request);
    },

    /**
     * Process a selected follow-up question
     */
    processFollowUp: async (request: ProcessFollowUpRequest): Promise<ApiResponse<ProcessFollowUpResponse>> => {
        return api.post("/follow-up/process", request);
    },
}; 