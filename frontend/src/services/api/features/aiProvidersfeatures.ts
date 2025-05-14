/**
 * AI Providers API Features
 *
 * Provides types and API functions for managing AI providers.
 */

import { api, ApiResponse } from "../middleware/apiMiddleware";
import logger from "@/utils/logger";
import { aiProviderEndpoints } from '../endpoints';

export interface AIProvider {
    id: string;
    name: string;
    description: string;
    logoUrl: string;
    website: string;
    defaultModel: string;
    isConfigured: boolean;
    isEnabled: boolean;
    models?: AIProviderModel[];
    capabilities?: string[];
    priority?: number;
    retryAttempts?: number;
    retryDelay?: number;
    timeout?: number;
    status?: ProviderStatus;
}

export interface AIProviderModel {
    id: string;
    name: string;
    description?: string;
    maxTokens: number;
    contextWindow: number;
    capabilities: string[];
    pricing?: string;
    priority?: number;
    isAvailable?: boolean;
}

export interface ProviderConfig {
    apiKey: string;
    baseUrl?: string;
    organizationId?: string;
    defaultModel?: string;
    customSettings?: Record<string, any>;
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
}

export interface TestConnectionResponse {
    success: boolean;
    message: string;
    models?: AIProviderModel[];
    error?: string;
}

export interface ProviderStatus {
    isActive: boolean;
    isConfigured: boolean;
    lastChecked: string;
    error?: string;
    responseTime?: number;
    availableModels?: number;
}

// List of all supported providers from config/ai.php
export const PROVIDER_IDS = [
    'openai',
    'anthropic',
    'gemini',
    'grok',
    'huggingface',
    'openrouter',
    'mistral',
    'deepseek',
    'cohere'
] as const;

export type ProviderId = typeof PROVIDER_IDS[number];

/**
 * Get all available AI providers
 */
export async function getAIProviders(): Promise<ApiResponse<AIProvider[]>> {
    try {
        return await api.get<AIProvider[]>("/ai/providers");
    } catch (error) {
        logger.error('Error fetching AI providers:', error);
        return {
            success: false,
            data: [],
            error: {
                code: 'ERR_FETCH_PROVIDERS',
                message: 'Failed to fetch AI providers'
            }
        };
    }
}

/**
 * Get a specific provider's details
 */
export async function getAIProvider(providerId: ProviderId): Promise<ApiResponse<AIProvider>> {
    try {
        return await api.get<AIProvider>(`/ai/providers/${providerId}`);
    } catch (error) {
        logger.error(`Error fetching provider ${providerId}:`, error);
        return {
            success: false,
            data: null,
            error: {
                code: 'ERR_FETCH_PROVIDER',
                message: `Failed to fetch provider: ${providerId}`
            }
        };
    }
}

/**
 * Configure a provider with API key and settings
 */
export async function configureAIProvider(
    providerId: ProviderId,
    config: ProviderConfig
): Promise<ApiResponse<{ success: boolean; message?: string }>> {
    try {
        return await api.post(`/ai/providers/${providerId}/configure`, config);
    } catch (error) {
        logger.error(`Error configuring provider ${providerId}:`, error);
        return {
            success: false,
            data: null,
            error: {
                code: 'ERR_CONFIGURE_PROVIDER',
                message: `Failed to configure provider: ${providerId}`
            }
        };
    }
}

/**
 * Test a provider connection with the given API key
 */
export async function testAIProviderConnection(
    providerId: ProviderId,
    config: ProviderConfig
): Promise<ApiResponse<TestConnectionResponse>> {
    try {
        return await api.post<TestConnectionResponse>(`/ai/providers/${providerId}/test`, config);
    } catch (error) {
        logger.error(`Error testing provider ${providerId}:`, error);
        return {
            success: false,
            data: {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error occurred'
            },
            error: {
                code: 'ERR_TEST_PROVIDER',
                message: 'Error testing provider connection'
            }
        };
    }
}

/**
 * Enable or disable a provider
 */
export async function toggleAIProviderStatus(
    providerId: ProviderId,
    isEnabled: boolean
): Promise<ApiResponse<{ success: boolean }>> {
    try {
        return await api.post(`/ai/providers/${providerId}/status`, { isEnabled });
    } catch (error) {
        logger.error(`Error updating provider status for ${providerId}:`, error);
        return {
            success: false,
            data: { success: false },
            error: {
                code: 'ERR_TOGGLE_PROVIDER',
                message: 'Failed to update provider status'
            }
        };
    }
}

/**
 * Get models available for a specific provider
 */
export async function getAIProviderModels(providerId: ProviderId): Promise<ApiResponse<AIProviderModel[]>> {
    try {
        return await api.get<AIProviderModel[]>(`/ai/providers/${providerId}/models`);
    } catch (error) {
        logger.error(`Error fetching models for provider ${providerId}:`, error);
        return {
            success: false,
            data: [],
            error: {
                code: 'ERR_FETCH_MODELS',
                message: `Failed to fetch models for provider: ${providerId}`
            }
        };
    }
}

/**
 * Set the default model for a provider
 */
export async function setAIProviderDefaultModel(
    providerId: ProviderId,
    modelId: string
): Promise<ApiResponse<{ success: boolean }>> {
    try {
        return await api.post(`/ai/providers/${providerId}/default-model`, { modelId });
    } catch (error) {
        logger.error(`Error setting default model for ${providerId}:`, error);
        return {
            success: false,
            data: { success: false },
            error: {
                code: 'ERR_SET_DEFAULT_MODEL',
                message: 'Failed to set default model'
            }
        };
    }
}

/**
 * Get provider capabilities
 */
export async function getAIProviderCapabilities(providerId: ProviderId): Promise<ApiResponse<string[]>> {
    try {
        return await api.get<string[]>(`/ai/providers/${providerId}/capabilities`);
    } catch (error) {
        logger.error(`Error fetching capabilities for provider ${providerId}:`, error);
        return {
            success: false,
            data: [],
            error: {
                code: 'ERR_FETCH_CAPABILITIES',
                message: `Failed to fetch capabilities for provider: ${providerId}`
            }
        };
    }
}

/**
 * Check provider health
 */
export async function checkAIProviderHealth(providerId: ProviderId): Promise<ApiResponse<ProviderStatus>> {
    try {
        return await api.get<ProviderStatus>(`/ai/providers/${providerId}/health`);
    } catch (error) {
        logger.error(`Error checking health for provider ${providerId}:`, error);
        return {
            success: false,
            data: {
                isActive: false,
                isConfigured: false,
                lastChecked: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            },
            error: {
                code: 'ERR_CHECK_HEALTH',
                message: `Failed to check health for provider: ${providerId}`
            }
        };
    }
}

/**
 * Update provider retry settings
 */
export async function updateAIProviderRetrySettings(
    providerId: ProviderId,
    settings: { retryAttempts?: number; retryDelay?: number; timeout?: number }
): Promise<ApiResponse<{ success: boolean }>> {
    try {
        return await api.post(`/ai/providers/${providerId}/retry-settings`, settings);
    } catch (error) {
        logger.error(`Error updating retry settings for ${providerId}:`, error);
        return {
            success: false,
            data: { success: false },
            error: {
                code: 'ERR_UPDATE_RETRY_SETTINGS',
                message: 'Failed to update retry settings'
            }
        };
    }
}

/**
 * Update provider priority
 */
export async function updateAIProviderPriority(
    providerId: ProviderId,
    priority: number
): Promise<ApiResponse<{ success: boolean }>> {
    try {
        return await api.post(`/ai/providers/${providerId}/priority`, { priority });
    } catch (error) {
        logger.error(`Error updating priority for ${providerId}:`, error);
        return {
            success: false,
            data: { success: false },
            error: {
                code: 'ERR_UPDATE_PRIORITY',
                message: 'Failed to update provider priority'
            }
        };
    }
}

/**
 * Create a unified API object for AI provider operations
 */
export const aiProviderApi = {
    getProviders: getAIProviders,
    getProvider: getAIProvider,
    configureProvider: configureAIProvider,
    testConnection: testAIProviderConnection,
    toggleStatus: toggleAIProviderStatus,
    getModels: getAIProviderModels,
    setDefaultModel: setAIProviderDefaultModel,
    getCapabilities: getAIProviderCapabilities,
    checkHealth: checkAIProviderHealth,
    updateRetrySettings: updateAIProviderRetrySettings,
    updatePriority: updateAIProviderPriority
};

