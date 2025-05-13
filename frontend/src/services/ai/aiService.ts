import { api } from '../api/middleware/apiMiddleware';
import logger from '@/utils/logger';

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

const aiService = {
    /**
     * Get available AI models
     */
    getModels: async (): Promise<AIModel[]> => {
        try {
            const response = await api.get<AIModel[]>('/ai/models');
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
            const payload = {
                prompt,
                model: options.model || 'gpt-3.5-turbo',
                temperature: options.temperature || 0.7,
                maxTokens: options.maxTokens || 1000,
                contextData: options.contextData,
            };

            const response = await api.post<any>('/ai/generate', payload);

            if (!response.success || !response.data) {
                throw new Error('Failed to generate AI response');
            }

            // Parse the response into the expected format
            return {
                id: response.data.id,
                content: response.data.choices[0].message.content,
                usage: {
                    promptTokens: response.data.usage.prompt_tokens,
                    completionTokens: response.data.usage.completion_tokens,
                    totalTokens: response.data.usage.total_tokens,
                },
            };
        } catch (error) {
            logger.error('Error generating AI response:', error);
            return null;
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

            const response = await api.post<any>('/ai/generate', payload);

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
    getLogs: async (page: number = 1, perPage: number = 20): Promise<any> => {
        try {
            const response = await api.get('/ai/logs', {
                params: { page, perPage }
            });

            if (!response.success || !response.data) {
                throw new Error('Failed to fetch AI logs');
            }

            return response.data;
        } catch (error) {
            logger.error('Error fetching AI logs:', error);
            return { logs: [], total: 0, page: 1, perPage: 20, lastPage: 1 };
        }
    },
};

export default aiService; 