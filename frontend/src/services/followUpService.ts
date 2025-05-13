/**
 * Follow-Up Service
 * 
 * Provides a simplified interface for managing follow-up questions using the followUpApi feature.
 */

import { followUpApi, FollowUpConfig, FollowUpQuestion, GenerateFollowUpsRequest, ProcessFollowUpRequest } from "./api/features/followupfeatures";
import logger from "@/utils/logger";

/**
 * Service to handle follow-up question operations
 */
class FollowUpService {
    /**
     * Get all follow-up configurations
     */
    getConfigurations = async (userId?: number): Promise<FollowUpConfig[]> => {
        try {
            const response = await followUpApi.getConfigs(userId);

            if (!response.success) {
                throw new Error(response.error?.message || "Failed to fetch follow-up configurations");
            }

            return response.data || [];
        } catch (error) {
            logger.error("Error fetching follow-up configurations:", error);
            return [];
        }
    };

    /**
     * Get a specific follow-up configuration
     */
    getConfiguration = async (id: string): Promise<FollowUpConfig | null> => {
        try {
            const response = await followUpApi.getConfig(id);

            if (!response.success) {
                throw new Error(response.error?.message || "Failed to fetch follow-up configuration");
            }

            return response.data || null;
        } catch (error) {
            logger.error(`Error fetching follow-up configuration ${id}:`, error);
            return null;
        }
    };

    /**
     * Create a new follow-up configuration
     */
    createConfiguration = async (config: Partial<FollowUpConfig>): Promise<FollowUpConfig | null> => {
        try {
            const response = await followUpApi.createConfig(config);

            if (!response.success) {
                throw new Error(response.error?.message || "Failed to create follow-up configuration");
            }

            return response.data || null;
        } catch (error) {
            logger.error("Error creating follow-up configuration:", error);
            return null;
        }
    };

    /**
     * Update a follow-up configuration
     */
    updateConfiguration = async (id: string, config: Partial<FollowUpConfig>): Promise<FollowUpConfig | null> => {
        try {
            const response = await followUpApi.updateConfig(id, config);

            if (!response.success) {
                throw new Error(response.error?.message || "Failed to update follow-up configuration");
            }

            return response.data || null;
        } catch (error) {
            logger.error(`Error updating follow-up configuration ${id}:`, error);
            return null;
        }
    };

    /**
     * Delete a follow-up configuration
     */
    deleteConfiguration = async (id: string): Promise<boolean> => {
        try {
            const response = await followUpApi.deleteConfig(id);

            if (!response.success) {
                throw new Error(response.error?.message || "Failed to delete follow-up configuration");
            }

            return true;
        } catch (error) {
            logger.error(`Error deleting follow-up configuration ${id}:`, error);
            return false;
        }
    };

    /**
     * Get questions for a specific configuration
     */
    getQuestions = async (configId: string): Promise<FollowUpQuestion[]> => {
        try {
            const response = await followUpApi.getQuestions(configId);

            if (!response.success) {
                throw new Error(response.error?.message || "Failed to fetch follow-up questions");
            }

            return response.data || [];
        } catch (error) {
            logger.error(`Error fetching questions for configuration ${configId}:`, error);
            return [];
        }
    };

    /**
     * Add a question to a configuration
     */
    addQuestion = async (configId: string, question: Partial<FollowUpQuestion>): Promise<FollowUpQuestion | null> => {
        try {
            const response = await followUpApi.addQuestion(configId, question);

            if (!response.success) {
                throw new Error(response.error?.message || "Failed to add follow-up question");
            }

            return response.data || null;
        } catch (error) {
            logger.error(`Error adding question to configuration ${configId}:`, error);
            return null;
        }
    };

    /**
     * Update a question
     */
    updateQuestion = async (id: string, question: Partial<FollowUpQuestion>): Promise<FollowUpQuestion | null> => {
        try {
            const response = await followUpApi.updateQuestion(id, question);

            if (!response.success) {
                throw new Error(response.error?.message || "Failed to update follow-up question");
            }

            return response.data || null;
        } catch (error) {
            logger.error(`Error updating follow-up question ${id}:`, error);
            return null;
        }
    };

    /**
     * Delete a question
     */
    deleteQuestion = async (id: string): Promise<boolean> => {
        try {
            const response = await followUpApi.deleteQuestion(id);

            if (!response.success) {
                throw new Error(response.error?.message || "Failed to delete follow-up question");
            }

            return true;
        } catch (error) {
            logger.error(`Error deleting follow-up question ${id}:`, error);
            return false;
        }
    };

    /**
     * Generate follow-up questions based on conversation context
     */
    generateFollowUps = async (request: GenerateFollowUpsRequest): Promise<FollowUpQuestion[]> => {
        try {
            const response = await followUpApi.generateFollowUps(request);

            if (!response.success) {
                throw new Error(response.error?.message || "Failed to generate follow-up questions");
            }

            return response.data?.follow_up_questions || [];
        } catch (error) {
            logger.error("Error generating follow-up questions:", error);
            return [];
        }
    };

    /**
     * Process a selected follow-up question
     */
    processFollowUp = async (request: ProcessFollowUpRequest): Promise<string | null> => {
        try {
            const response = await followUpApi.processFollowUp(request);

            if (!response.success) {
                throw new Error(response.error?.message || "Failed to process follow-up question");
            }

            return response.data?.modified_prompt || null;
        } catch (error) {
            logger.error("Error processing follow-up question:", error);
            return null;
        }
    };
}

export default new FollowUpService(); 