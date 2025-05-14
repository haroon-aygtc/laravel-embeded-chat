<?php

declare(strict_types=1);

namespace App\Services\AI;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use GuzzleHttp\Exception\RequestException;

class AIProviderService
{
    private array $supportedProviders;

    public function __construct()
    {
        $this->supportedProviders = config('ai.providers', []);
    }

    /**
     * Get all available AI providers
     */
    public function getProviders(): JsonResponse
    {
        $providersConfig = $this->supportedProviders;
        $providers = [];

        foreach ($providersConfig as $id => $config) {
            $providers[] = [
                'id' => $id,
                'name' => $this->getProviderName($id),
                'description' => $this->getProviderDescription($id),
                'logoUrl' => $this->getProviderLogoUrl($id),
                'website' => $this->getProviderWebsite($id),
                'defaultModel' => $config['default_model'],
                'isConfigured' => $this->isProviderConfigured($id),
                'isEnabled' => $this->isProviderEnabled($id),
            ];
        }

        return response()->json($providers);
    }

    /**
     * Get a specific provider's details
     */
    public function getProvider(string $providerId): JsonResponse
    {
        if (!isset($this->supportedProviders[$providerId])) {
            return response()->json(['message' => 'Provider not found'], 404);
        }

        $config = $this->supportedProviders[$providerId];
        $provider = [
            'id' => $providerId,
            'name' => $this->getProviderName($providerId),
            'description' => $this->getProviderDescription($providerId),
            'logoUrl' => $this->getProviderLogoUrl($providerId),
            'website' => $this->getProviderWebsite($providerId),
            'defaultModel' => $config['default_model'],
            'isConfigured' => $this->isProviderConfigured($providerId),
            'isEnabled' => $this->isProviderEnabled($providerId),
        ];

        // Get cached models if available
        if ($this->isProviderConfigured($providerId)) {
            $provider['models'] = $this->getCachedProviderModels($providerId);
        }

        return response()->json($provider);
    }

    /**
     * Configure a provider with API key and settings
     */
    public function configureProvider(string $providerId, array $data): JsonResponse
    {
        if (!isset($this->supportedProviders[$providerId])) {
            return response()->json(['success' => false, 'message' => 'Provider not found'], 404);
        }

        try {
            // Store the API key securely in the database
            DB::table('api_keys')->updateOrInsert(
                ['provider' => $providerId],
                [
                    'api_key' => $data['apiKey'],
                    'organization_id' => $data['organizationId'] ?? null,
                    'base_url' => $data['baseUrl'] ?? $this->supportedProviders[$providerId]['base_url'],
                    'default_model' => $data['defaultModel'] ?? $this->supportedProviders[$providerId]['default_model'],
                    'custom_settings' => json_encode($data['customSettings'] ?? []),
                    'is_enabled' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );

            // Clear any cached models for this provider
            Cache::forget("ai_provider_{$providerId}_models");

            // Test the connection to verify the API key works
            $testResult = $this->testConnection($providerId, $data);
            $testData = json_decode($testResult->getContent(), true);

            if (!isset($testData['success']) || !$testData['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Provider configured but connection test failed',
                    'testResult' => $testData,
                ]);
            }

            // Cache the models
            if (isset($testData['models'])) {
                Cache::put("ai_provider_{$providerId}_models", $testData['models'], now()->addDay());
            }

            return response()->json([
                'success' => true,
                'message' => 'Provider configured successfully',
                'models' => $testData['models'] ?? [],
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to configure provider {$providerId}: " . $e->getMessage(), [
                'exception' => $e,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to configure provider: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Test a provider connection with the given API key
     */
    public function testConnection(string $providerId, array $data): JsonResponse
    {
        if (!isset($this->supportedProviders[$providerId])) {
            return response()->json(['success' => false, 'message' => 'Provider not found'], 404);
        }

        try {
            $apiKey = $data['apiKey'];
            $baseUrl = $data['baseUrl'] ?? $this->supportedProviders[$providerId]['base_url'];
            $defaultTimeout = $this->supportedProviders[$providerId]['timeout'] ?? 30;

            // Different test endpoint for each provider
            $models = [];
            switch ($providerId) {
                case 'openai':
                    $result = $this->testOpenAIConnection($apiKey, $baseUrl, $defaultTimeout, $data);
                    $models = $result['models'] ?? [];
                    break;
                case 'anthropic':
                    $result = $this->testAnthropicConnection($apiKey, $baseUrl, $defaultTimeout, $data);
                    $models = $result['models'] ?? [];
                    break;
                case 'gemini':
                    $result = $this->testGeminiConnection($apiKey, $baseUrl, $defaultTimeout, $data);
                    $models = $result['models'] ?? [];
                    break;
                case 'grok':
                    $result = $this->testGrokConnection($apiKey, $baseUrl, $defaultTimeout, $data);
                    $models = $result['models'] ?? [];
                    break;
                case 'huggingface':
                    $result = $this->testHuggingFaceConnection($apiKey, $baseUrl, $defaultTimeout, $data);
                    $models = $result['models'] ?? [];
                    break;
                case 'openrouter':
                    $result = $this->testOpenRouterConnection($apiKey, $baseUrl, $defaultTimeout, $data);
                    $models = $result['models'] ?? [];
                    break;
                case 'mistral':
                    $result = $this->testMistralConnection($apiKey, $baseUrl, $defaultTimeout, $data);
                    $models = $result['models'] ?? [];
                    break;
                case 'deepseek':
                    $result = $this->testDeepSeekConnection($apiKey, $baseUrl, $defaultTimeout, $data);
                    $models = $result['models'] ?? [];
                    break;
                case 'cohere':
                    $result = $this->testCohereConnection($apiKey, $baseUrl, $defaultTimeout, $data);
                    $models = $result['models'] ?? [];
                    break;
                default:
                    return response()->json([
                        'success' => false,
                        'message' => 'Provider connection testing not implemented',
                    ]);
            }

            if (empty($models)) {
                $models = $this->getDefaultModelsForProvider($providerId);
            }

            // Cache the models
            Cache::put("ai_provider_{$providerId}_models", $models, now()->addDay());

            return response()->json([
                'success' => true,
                'message' => 'Connection successful',
                'models' => $models,
            ]);
        } catch (RequestException $e) {
            Log::error("Connection test failed for provider {$providerId}: " . $e->getMessage(), [
                'exception' => $e,
            ]);

            $errorMessage = 'Connection failed';
            if ($e->hasResponse()) {
                $response = $e->getResponse();
                $body = (string) $response->getBody();
                $errorData = json_decode($body, true);
                $errorMessage = $errorData['error']['message'] ?? $errorMessage;
            }

            return response()->json([
                'success' => false,
                'message' => $errorMessage,
            ]);
        } catch (\Exception $e) {
            Log::error("Connection test failed for provider {$providerId}: " . $e->getMessage(), [
                'exception' => $e,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Connection failed: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Toggle provider status (enable/disable)
     */
    public function toggleProviderStatus(string $providerId, bool $isEnabled): JsonResponse
    {
        if (!isset($this->supportedProviders[$providerId])) {
            return response()->json(['success' => false, 'message' => 'Provider not found'], 404);
        }

        try {
            // Check if the provider is configured first
            if (!$this->isProviderConfigured($providerId)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Provider must be configured before enabling/disabling',
                ], 400);
            }

            // Update the status
            DB::table('api_keys')
                ->where('provider', $providerId)
                ->update([
                    'is_enabled' => $isEnabled,
                    'updated_at' => now(),
                ]);

            return response()->json([
                'success' => true,
                'message' => 'Provider status updated successfully',
                'isEnabled' => $isEnabled,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to toggle provider status for {$providerId}: " . $e->getMessage(), [
                'exception' => $e,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update provider status',
            ], 500);
        }
    }

    /**
     * Get models available for a specific provider
     */
    public function getProviderModels(string $providerId): JsonResponse
    {
        if (!isset($this->supportedProviders[$providerId])) {
            return response()->json(['message' => 'Provider not found'], 404);
        }

        try {
            // Check if the provider is configured and enabled
            if (!$this->isProviderConfigured($providerId)) {
                return response()->json([
                    'message' => 'Provider not configured',
                    'models' => [],
                ]);
            }

            // Get models from cache or fetch them
            $models = $this->getCachedProviderModels($providerId);

            return response()->json($models);
        } catch (\Exception $e) {
            Log::error("Failed to get models for provider {$providerId}: " . $e->getMessage(), [
                'exception' => $e,
            ]);

            return response()->json([
                'message' => 'Failed to get provider models',
                'models' => [],
            ], 500);
        }
    }

    /**
     * Set the default model for a provider
     */
    public function setDefaultModel(string $providerId, string $modelId): JsonResponse
    {
        if (!isset($this->supportedProviders[$providerId])) {
            return response()->json(['success' => false, 'message' => 'Provider not found'], 404);
        }

        try {
            // Check if the provider is configured
            if (!$this->isProviderConfigured($providerId)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Provider not configured',
                ], 400);
            }

            // Verify the model exists
            $models = $this->getCachedProviderModels($providerId);
            $modelExists = false;
            foreach ($models as $model) {
                if ($model['id'] === $modelId) {
                    $modelExists = true;
                    break;
                }
            }

            if (!$modelExists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Model not found for this provider',
                ], 404);
            }

            // Update the default model
            DB::table('api_keys')
                ->where('provider', $providerId)
                ->update([
                    'default_model' => $modelId,
                    'updated_at' => now(),
                ]);

            return response()->json([
                'success' => true,
                'message' => 'Default model updated successfully',
                'modelId' => $modelId,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to set default model for provider {$providerId}: " . $e->getMessage(), [
                'exception' => $e,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update default model',
            ], 500);
        }
    }

    /**
     * Check if a provider is configured
     */
    private function isProviderConfigured(string $providerId): bool
    {
        return DB::table('api_keys')
            ->where('provider', $providerId)
            ->exists();
    }

    /**
     * Check if a provider is enabled
     */
    private function isProviderEnabled(string $providerId): bool
    {
        return DB::table('api_keys')
            ->where('provider', $providerId)
            ->where('is_enabled', true)
            ->exists();
    }

    /**
     * Get cached models for a provider
     */
    private function getCachedProviderModels(string $providerId): array
    {
        $models = Cache::get("ai_provider_{$providerId}_models");
        if (!$models) {
            $models = $this->getDefaultModelsForProvider($providerId);
        }
        return $models;
    }

    /**
     * Get provider's human-readable name
     */
    private function getProviderName(string $providerId): string
    {
        $names = [
            'openai' => 'OpenAI',
            'anthropic' => 'Anthropic',
            'gemini' => 'Google Gemini',
            'grok' => 'xAI Grok',
            'huggingface' => 'Hugging Face',
            'openrouter' => 'OpenRouter',
            'mistral' => 'Mistral AI',
            'deepseek' => 'DeepSeek',
            'cohere' => 'Cohere',
        ];

        return $names[$providerId] ?? ucfirst($providerId);
    }

    /**
     * Get provider description
     */
    private function getProviderDescription(string $providerId): string
    {
        $descriptions = [
            'openai' => 'OpenAI offers powerful language models like GPT-4 and GPT-3.5 for a wide range of tasks.',
            'anthropic' => 'Anthropic\'s Claude models are known for their helpfulness, harmlessness, and honesty.',
            'gemini' => 'Google\'s Gemini models offer state-of-the-art capabilities for various AI tasks.',
            'grok' => 'xAI\'s Grok model is designed to be witty and have a bit of a rebellious personality.',
            'huggingface' => 'Access thousands of open-source models from the Hugging Face Hub.',
            'openrouter' => 'OpenRouter provides a unified API for dozens of different LLMs from various providers.',
            'mistral' => 'Mistral AI builds high-performance, multilingual language models with a focus on efficiency.',
            'deepseek' => 'DeepSeek offers powerful language models with strong coding capabilities.',
            'cohere' => 'Cohere specializes in natural language understanding and generation for businesses.',
        ];

        return $descriptions[$providerId] ?? 'AI language model provider';
    }

    /**
     * Get provider logo URL
     */
    private function getProviderLogoUrl(string $providerId): string
    {
        return asset("images/ai-providers/{$providerId}.svg");
    }

    /**
     * Get provider website
     */
    private function getProviderWebsite(string $providerId): string
    {
        $websites = [
            'openai' => 'https://openai.com',
            'anthropic' => 'https://anthropic.com',
            'gemini' => 'https://gemini.google.com',
            'grok' => 'https://grok.x.ai',
            'huggingface' => 'https://huggingface.co',
            'openrouter' => 'https://openrouter.ai',
            'mistral' => 'https://mistral.ai',
            'deepseek' => 'https://deepseek.ai',
            'cohere' => 'https://cohere.com',
        ];

        return $websites[$providerId] ?? '#';
    }

    /**
     * Get default models for a provider
     */
    private function getDefaultModelsForProvider(string $providerId): array
    {
        // Default models if we can't get them from the API
        $defaultModels = [
            'openai' => [
                [
                    'id' => 'gpt-4o',
                    'name' => 'GPT-4o',
                    'description' => 'Most capable model for complex tasks',
                    'maxTokens' => 128000,
                    'contextWindow' => 128000,
                    'capabilities' => ['text', 'code', 'reasoning'],
                ],
                [
                    'id' => 'gpt-4-turbo',
                    'name' => 'GPT-4 Turbo',
                    'description' => 'Advanced capabilities with more recent knowledge',
                    'maxTokens' => 128000,
                    'contextWindow' => 128000,
                    'capabilities' => ['text', 'code', 'reasoning'],
                ],
                [
                    'id' => 'gpt-3.5-turbo',
                    'name' => 'GPT-3.5 Turbo',
                    'description' => 'Fast and efficient for most everyday tasks',
                    'maxTokens' => 16385,
                    'contextWindow' => 16385,
                    'capabilities' => ['text', 'code'],
                ],
            ],
            'anthropic' => [
                [
                    'id' => 'claude-3-opus-20240229',
                    'name' => 'Claude 3 Opus',
                    'description' => 'Anthropic\'s most powerful model for highly complex tasks',
                    'maxTokens' => 200000,
                    'contextWindow' => 200000,
                    'capabilities' => ['text', 'code', 'reasoning', 'vision'],
                ],
                [
                    'id' => 'claude-3-sonnet-20240229',
                    'name' => 'Claude 3 Sonnet',
                    'description' => 'Excellent balance of intelligence and speed',
                    'maxTokens' => 200000,
                    'contextWindow' => 200000,
                    'capabilities' => ['text', 'code', 'reasoning', 'vision'],
                ],
                [
                    'id' => 'claude-3-haiku-20240307',
                    'name' => 'Claude 3 Haiku',
                    'description' => 'Fast and cost-effective for simpler tasks',
                    'maxTokens' => 200000,
                    'contextWindow' => 200000,
                    'capabilities' => ['text', 'code', 'vision'],
                ],
            ],
            'gemini' => [
                [
                    'id' => 'gemini-1.5-pro',
                    'name' => 'Gemini 1.5 Pro',
                    'description' => 'Google\'s most capable model for complex tasks',
                    'maxTokens' => 1000000,
                    'contextWindow' => 1000000,
                    'capabilities' => ['text', 'code', 'reasoning', 'vision'],
                ],
                [
                    'id' => 'gemini-1.5-flash',
                    'name' => 'Gemini 1.5 Flash',
                    'description' => 'Fast and efficient for everyday tasks',
                    'maxTokens' => 1000000,
                    'contextWindow' => 1000000,
                    'capabilities' => ['text', 'code', 'vision'],
                ],
                [
                    'id' => 'gemini-1.0-pro',
                    'name' => 'Gemini 1.0 Pro',
                    'description' => 'Balanced performance for most use cases',
                    'maxTokens' => 32768,
                    'contextWindow' => 32768,
                    'capabilities' => ['text', 'code'],
                ],
            ],
            // Add default models for other providers as needed
        ];

        return $defaultModels[$providerId] ?? [];
    }

    /**
     * Test OpenAI API connection
     */
    private function testOpenAIConnection(string $apiKey, string $baseUrl, int $timeout, array $data): array
    {
        $response = Http::withHeaders([
            'Authorization' => "Bearer {$apiKey}",
            'Content-Type' => 'application/json',
        ])->timeout($timeout)->get("{$baseUrl}/models");

        if (!$response->successful()) {
            throw new \Exception('Failed to connect to OpenAI API: ' . $response->body());
        }

        $models = [];
        $rawModels = $response->json('data', []);
        foreach ($rawModels as $model) {
            // Filter only the models we want to expose
            if (in_array($model['id'], ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'])) {
                $models[] = [
                    'id' => $model['id'],
                    'name' => $this->formatModelName($model['id']),
                    'maxTokens' => $this->getModelMaxTokens($model['id']),
                    'contextWindow' => $this->getModelContextWindow($model['id']),
                    'capabilities' => $this->getModelCapabilities($model['id']),
                ];
            }
        }

        return ['models' => $models];
    }

    /**
     * Test Anthropic API connection
     */
    private function testAnthropicConnection(string $apiKey, string $baseUrl, int $timeout, array $data): array
    {
        // Anthropic doesn't have a models endpoint, so we'll test with a simple completion
        $response = Http::withHeaders([
            'x-api-key' => $apiKey,
            'anthropic-version' => '2023-06-01',
            'Content-Type' => 'application/json',
        ])->timeout($timeout)->post("{$baseUrl}/messages", [
            'model' => 'claude-3-haiku-20240307',
            'max_tokens' => 10,
            'messages' => [
                ['role' => 'user', 'content' => 'Say hello']
            ],
        ]);

        if (!$response->successful()) {
            throw new \Exception('Failed to connect to Anthropic API: ' . $response->body());
        }

        // Return predefined models since Anthropic doesn't provide a models endpoint
        return [
            'models' => [
                [
                    'id' => 'claude-3-opus-20240229',
                    'name' => 'Claude 3 Opus',
                    'description' => 'Anthropic\'s most powerful model for highly complex tasks',
                    'maxTokens' => 200000,
                    'contextWindow' => 200000,
                    'capabilities' => ['text', 'code', 'reasoning', 'vision'],
                ],
                [
                    'id' => 'claude-3-sonnet-20240229',
                    'name' => 'Claude 3 Sonnet',
                    'description' => 'Excellent balance of intelligence and speed',
                    'maxTokens' => 200000,
                    'contextWindow' => 200000,
                    'capabilities' => ['text', 'code', 'reasoning', 'vision'],
                ],
                [
                    'id' => 'claude-3-haiku-20240307',
                    'name' => 'Claude 3 Haiku',
                    'description' => 'Fast and cost-effective for simpler tasks',
                    'maxTokens' => 200000,
                    'contextWindow' => 200000,
                    'capabilities' => ['text', 'code', 'vision'],
                ],
            ]
        ];
    }

    /**
     * Test Google Gemini API connection
     */
    private function testGeminiConnection(string $apiKey, string $baseUrl, int $timeout, array $data): array
    {
        // Gemini doesn't have a models endpoint, so we'll test with a model info call
        $response = Http::timeout($timeout)
            ->get("{$baseUrl}/models/gemini-1.5-flash?key={$apiKey}");

        if (!$response->successful()) {
            throw new \Exception('Failed to connect to Gemini API: ' . $response->body());
        }

        // Return predefined models
        return [
            'models' => [
                [
                    'id' => 'gemini-1.5-pro',
                    'name' => 'Gemini 1.5 Pro',
                    'description' => 'Google\'s most capable model for complex tasks',
                    'maxTokens' => 1000000,
                    'contextWindow' => 1000000,
                    'capabilities' => ['text', 'code', 'reasoning', 'vision'],
                ],
                [
                    'id' => 'gemini-1.5-flash',
                    'name' => 'Gemini 1.5 Flash',
                    'description' => 'Fast and efficient for everyday tasks',
                    'maxTokens' => 1000000,
                    'contextWindow' => 1000000,
                    'capabilities' => ['text', 'code', 'vision'],
                ],
                [
                    'id' => 'gemini-1.0-pro',
                    'name' => 'Gemini 1.0 Pro',
                    'description' => 'Balanced performance for most use cases',
                    'maxTokens' => 32768,
                    'contextWindow' => 32768,
                    'capabilities' => ['text', 'code'],
                ],
            ]
        ];
    }

    /**
     * Test Grok API connection
     */
    private function testGrokConnection(string $apiKey, string $baseUrl, int $timeout, array $data): array
    {
        $response = Http::withHeaders([
            'Authorization' => "Bearer {$apiKey}",
            'Content-Type' => 'application/json',
        ])->timeout($timeout)->post("{$baseUrl}/chat/completions", [
            'model' => 'grok-1',
            'messages' => [
                ['role' => 'user', 'content' => 'Hello']
            ],
            'max_tokens' => 10,
        ]);

        if (!$response->successful()) {
            throw new \Exception('Failed to connect to Grok API: ' . $response->body());
        }

        return [
            'models' => [
                [
                    'id' => 'grok-1',
                    'name' => 'Grok-1',
                    'description' => 'xAI\'s conversational AI model',
                    'maxTokens' => 8192,
                    'contextWindow' => 8192,
                    'capabilities' => ['text', 'code'],
                ]
            ]
        ];
    }

    /**
     * Test HuggingFace API connection
     */
    private function testHuggingFaceConnection(string $apiKey, string $baseUrl, int $timeout, array $data): array
    {
        // Test with a simple inference request to a popular model
        $model = $data['defaultModel'] ?? 'meta-llama/Llama-2-70b-chat-hf';
        $response = Http::withHeaders([
            'Authorization' => "Bearer {$apiKey}",
            'Content-Type' => 'application/json',
        ])->timeout($timeout)->post("{$baseUrl}/{$model}", [
            'inputs' => 'Hello, how are you?',
            'parameters' => [
                'max_new_tokens' => 10,
                'temperature' => 0.7,
            ],
        ]);

        if (!$response->successful()) {
            throw new \Exception('Failed to connect to HuggingFace API: ' . $response->body());
        }

        // Return predefined models since HuggingFace has thousands of models
        return [
            'models' => [
                [
                    'id' => 'meta-llama/Llama-2-70b-chat-hf',
                    'name' => 'Llama 2 70B Chat',
                    'description' => 'Meta\'s large language model optimized for chat',
                    'maxTokens' => 4096,
                    'contextWindow' => 4096,
                    'capabilities' => ['text', 'code'],
                ],
                [
                    'id' => 'mistralai/Mistral-7B-Instruct-v0.2',
                    'name' => 'Mistral 7B Instruct',
                    'description' => 'Mistral\'s instruction-tuned model',
                    'maxTokens' => 8192,
                    'contextWindow' => 8192,
                    'capabilities' => ['text', 'code'],
                ],
                [
                    'id' => 'google/gemma-7b-it',
                    'name' => 'Gemma 7B Instruct',
                    'description' => 'Google\'s lightweight instruction-tuned model',
                    'maxTokens' => 8192,
                    'contextWindow' => 8192,
                    'capabilities' => ['text', 'code'],
                ],
            ]
        ];
    }

    /**
     * Test OpenRouter API connection
     */
    private function testOpenRouterConnection(string $apiKey, string $baseUrl, int $timeout, array $data): array
    {
        $response = Http::withHeaders([
            'Authorization' => "Bearer {$apiKey}",
            'HTTP-Referer' => config('app.url'),
            'X-Title' => config('app.name'),
            'Content-Type' => 'application/json',
        ])->timeout($timeout)->post("{$baseUrl}/chat/completions", [
            'model' => 'openai/gpt-3.5-turbo',
            'messages' => [
                ['role' => 'user', 'content' => 'Hello']
            ],
            'max_tokens' => 10,
        ]);

        if (!$response->successful()) {
            throw new \Exception('Failed to connect to OpenRouter API: ' . $response->body());
        }

        // Get available models from OpenRouter
        $modelsResponse = Http::withHeaders([
            'Authorization' => "Bearer {$apiKey}",
            'Content-Type' => 'application/json',
        ])->timeout($timeout)->get("{$baseUrl}/models");

        $models = [];
        if ($modelsResponse->successful()) {
            $rawModels = $modelsResponse->json('data', []);
            foreach ($rawModels as $model) {
                $models[] = [
                    'id' => $model['id'],
                    'name' => $model['name'] ?? $this->formatModelName($model['id']),
                    'description' => $model['description'] ?? '',
                    'maxTokens' => $model['context_length'] ?? 4096,
                    'contextWindow' => $model['context_length'] ?? 4096,
                    'capabilities' => $this->getModelCapabilities($model['id']),
                ];
            }
        }

        return ['models' => $models];
    }

    /**
     * Test Mistral API connection
     */
    private function testMistralConnection(string $apiKey, string $baseUrl, int $timeout, array $data): array
    {
        $response = Http::withHeaders([
            'Authorization' => "Bearer {$apiKey}",
            'Content-Type' => 'application/json',
        ])->timeout($timeout)->post("{$baseUrl}/chat/completions", [
            'model' => 'mistral-large-latest',
            'messages' => [
                ['role' => 'user', 'content' => 'Hello']
            ],
            'max_tokens' => 10,
        ]);

        if (!$response->successful()) {
            throw new \Exception('Failed to connect to Mistral API: ' . $response->body());
        }

        // Get available models from Mistral
        $modelsResponse = Http::withHeaders([
            'Authorization' => "Bearer {$apiKey}",
            'Content-Type' => 'application/json',
        ])->timeout($timeout)->get("{$baseUrl}/models");

        $models = [];
        if ($modelsResponse->successful()) {
            $rawModels = $modelsResponse->json('data', []);
            foreach ($rawModels as $model) {
                $models[] = [
                    'id' => $model['id'],
                    'name' => $model['name'] ?? $this->formatModelName($model['id']),
                    'description' => $model['description'] ?? '',
                    'maxTokens' => $model['max_tokens'] ?? 8192,
                    'contextWindow' => $model['context_window'] ?? 8192,
                    'capabilities' => $this->getModelCapabilities($model['id']),
                ];
            }
        }

        // If no models were found, return predefined models
        if (empty($models)) {
            $models = [
                [
                    'id' => 'mistral-large-latest',
                    'name' => 'Mistral Large',
                    'description' => 'Mistral\'s most powerful model',
                    'maxTokens' => 32768,
                    'contextWindow' => 32768,
                    'capabilities' => ['text', 'code', 'reasoning'],
                ],
                [
                    'id' => 'mistral-medium-latest',
                    'name' => 'Mistral Medium',
                    'description' => 'Balanced performance for most use cases',
                    'maxTokens' => 32768,
                    'contextWindow' => 32768,
                    'capabilities' => ['text', 'code'],
                ],
                [
                    'id' => 'mistral-small-latest',
                    'name' => 'Mistral Small',
                    'description' => 'Fast and efficient for everyday tasks',
                    'maxTokens' => 32768,
                    'contextWindow' => 32768,
                    'capabilities' => ['text', 'code'],
                ],
            ];
        }

        return ['models' => $models];
    }

    /**
     * Test DeepSeek API connection
     */
    private function testDeepSeekConnection(string $apiKey, string $baseUrl, int $timeout, array $data): array
    {
        $response = Http::withHeaders([
            'Authorization' => "Bearer {$apiKey}",
            'Content-Type' => 'application/json',
        ])->timeout($timeout)->post("{$baseUrl}/chat/completions", [
            'model' => 'deepseek-chat',
            'messages' => [
                ['role' => 'user', 'content' => 'Hello']
            ],
            'max_tokens' => 10,
        ]);

        if (!$response->successful()) {
            throw new \Exception('Failed to connect to DeepSeek API: ' . $response->body());
        }

        return [
            'models' => [
                [
                    'id' => 'deepseek-chat',
                    'name' => 'DeepSeek Chat',
                    'description' => 'General purpose chat model',
                    'maxTokens' => 4096,
                    'contextWindow' => 4096,
                    'capabilities' => ['text', 'code'],
                ],
                [
                    'id' => 'deepseek-coder',
                    'name' => 'DeepSeek Coder',
                    'description' => 'Specialized for code generation and understanding',
                    'maxTokens' => 8192,
                    'contextWindow' => 8192,
                    'capabilities' => ['text', 'code'],
                ],
            ]
        ];
    }

    /**
     * Test Cohere API connection
     */
    private function testCohereConnection(string $apiKey, string $baseUrl, int $timeout, array $data): array
    {
        $response = Http::withHeaders([
            'Authorization' => "Bearer {$apiKey}",
            'Content-Type' => 'application/json',
        ])->timeout($timeout)->post("{$baseUrl}/generate", [
            'model' => 'command',
            'prompt' => 'Hello',
            'max_tokens' => 10,
        ]);

        if (!$response->successful()) {
            throw new \Exception('Failed to connect to Cohere API: ' . $response->body());
        }

        // Get available models from Cohere
        $models = [
            [
                'id' => 'command',
                'name' => 'Command',
                'description' => 'Cohere\'s flagship model for general purpose tasks',
                'maxTokens' => 4096,
                'contextWindow' => 4096,
                'capabilities' => ['text', 'code'],
            ],
            [
                'id' => 'command-light',
                'name' => 'Command Light',
                'description' => 'Faster and more efficient version of Command',
                'maxTokens' => 4096,
                'contextWindow' => 4096,
                'capabilities' => ['text'],
            ],
            [
                'id' => 'command-r',
                'name' => 'Command R',
                'description' => 'Optimized for reasoning tasks',
                'maxTokens' => 4096,
                'contextWindow' => 4096,
                'capabilities' => ['text', 'reasoning'],
            ],
        ];

        return ['models' => $models];
    }

    /**
     * Format a model name for display
     */
    private function formatModelName(string $modelId): string
    {
        // Convert model IDs to readable names
        return str_replace(['-', '_'], ' ', ucwords($modelId));
    }

    /**
     * Get max tokens for a model
     */
    private function getModelMaxTokens(string $modelId): int
    {
        $maxTokens = [
            'gpt-4o' => 128000,
            'gpt-4-turbo' => 128000,
            'gpt-4' => 8192,
            'gpt-3.5-turbo' => 16385,
            'claude-3-opus-20240229' => 200000,
            'claude-3-sonnet-20240229' => 200000,
            'claude-3-haiku-20240307' => 200000,
            'gemini-1.5-pro' => 1000000,
            'gemini-1.5-flash' => 1000000,
            'gemini-1.0-pro' => 32768,
            'grok-1' => 8192,
        ];

        return $maxTokens[$modelId] ?? 4096;
    }

    /**
     * Get context window size for a model
     */
    private function getModelContextWindow(string $modelId): int
    {
        $contextWindow = [
            'gpt-4o' => 128000,
            'gpt-4-turbo' => 128000,
            'gpt-4' => 8192,
            'gpt-3.5-turbo' => 16385,
            'claude-3-opus-20240229' => 200000,
            'claude-3-sonnet-20240229' => 200000,
            'claude-3-haiku-20240307' => 200000,
            'gemini-1.5-pro' => 1000000,
            'gemini-1.5-flash' => 1000000,
            'gemini-1.0-pro' => 32768,
            'grok-1' => 8192,
        ];

        return $contextWindow[$modelId] ?? 4096;
    }

    /**
     * Get capabilities for a model
     */
    private function getModelCapabilities(string $modelId): array
    {
        $capabilities = [
            'gpt-4o' => ['text', 'code', 'reasoning', 'vision'],
            'gpt-4-turbo' => ['text', 'code', 'reasoning', 'vision'],
            'gpt-4' => ['text', 'code', 'reasoning'],
            'gpt-3.5-turbo' => ['text', 'code'],
            'claude-3-opus-20240229' => ['text', 'code', 'reasoning', 'vision'],
            'claude-3-sonnet-20240229' => ['text', 'code', 'reasoning', 'vision'],
            'claude-3-haiku-20240307' => ['text', 'code', 'vision'],
            'gemini-1.5-pro' => ['text', 'code', 'reasoning', 'vision'],
            'gemini-1.5-flash' => ['text', 'code', 'vision'],
            'gemini-1.0-pro' => ['text', 'code'],
            'grok-1' => ['text', 'code'],
        ];

        return $capabilities[$modelId] ?? ['text'];
    }
}
