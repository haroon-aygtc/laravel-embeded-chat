import { api, ApiResponse } from "../middleware/apiMiddleware";
import logger from "@/utils/logger";

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
}

export interface AIProviderModel {
    id: string;
    name: string;
    description?: string;
    maxTokens: number;
    contextWindow: number;
    capabilities: string[];
    pricing?: string;
}

export interface ProviderConfig {
    apiKey: string;
    baseUrl?: string;
    organizationId?: string;
    defaultModel?: string;
    customSettings?: Record<string, any>;
}

export interface TestConnectionResponse {
    success: boolean;
    message: string;
    models?: AIProviderModel[];
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

