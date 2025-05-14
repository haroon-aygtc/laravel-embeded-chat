/**
 * Follow-Up Endpoints
 *
 * This file defines all endpoints for follow-up questions functionality.
 */

export const followUpEndpoints = {
    // Configuration management
    configs: "/follow-up/configs",
    config: (id: string) => `/follow-up/configs/${id}`,
    
    // Question management
    questions: (configId: string) => `/follow-up/configs/${configId}/questions`,
    question: (id: string) => `/follow-up/questions/${id}`,
    reorderQuestions: (configId: string) => `/follow-up/configs/${configId}/questions/reorder`,
    
    // Follow-up generation and processing
    generate: "/follow-up/generate",
    process: "/follow-up/process",
}; 