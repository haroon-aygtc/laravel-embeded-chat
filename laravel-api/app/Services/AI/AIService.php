<?php

declare(strict_types=1);

namespace App\Services\AI;

use App\Models\AI\AIModel;
use App\Models\AI\AIInteractionLog;
use App\Models\AI\AIPromptTemplate;
use App\Models\AI\AICacheItem;
use App\Models\AI\FollowUpConfig;
use App\Models\AI\FollowUpQuestion;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Models\KnowledgeBase;
use App\Models\KnowledgeEntry;
use App\Services\KnowledgeBase\VectorSearch\VectorSearchService;

class AIService
{
    /**
     * Generate a response from AI
     */
    public function generate(array $data): JsonResponse
    {
        $startTime = microtime(true);
        $user = auth()->user();
        $modelId = $data['model'] ?? $this->getDefaultModelId();
        $temperature = $data['temperature'] ?? 0.7;
        $maxTokens = $data['maxTokens'] ?? 1000;
        $contextData = $data['contextData'] ?? null;
        $cacheKey = $this->generateCacheKey($data['prompt'], $modelId, $temperature, $maxTokens);

        // Check if response is cached
        if ($cachedResponse = $this->getCachedResponse($cacheKey)) {
            return response()->json($cachedResponse);
        }

        try {
            // Get the model configuration
            $model = AIModel::find($modelId);
            if (!$model || !$model->is_available) {
                return response()->json([
                    'message' => 'Model not available',
                ], 400);
            }

            // Retrieve knowledge base results if needed
            $knowledgeResults = null;
            if (!empty($data['use_knowledge_base']) && $data['use_knowledge_base'] === true) {
                // Search knowledge bases for relevant information
                $knowledgeResults = $this->searchKnowledgeBases(
                    $data['prompt'],
                    $data['knowledge_base_ids'] ?? null
                );

                // Set for logging
                if (!empty($knowledgeResults)) {
                    $data['knowledge_base_results'] = count($knowledgeResults);
                    $data['knowledge_base_ids'] = array_map(function($result) {
                        return $result['knowledge_base']['id'];
                    }, $knowledgeResults);
                }
            }

            // Process the request based on the model provider
            $response = $this->processModelRequest($model, $data['prompt'], $temperature, $maxTokens, $contextData, $knowledgeResults);

            // Add knowledge base results to the response metadata
            if (!empty($knowledgeResults)) {
                $response['knowledge_base_results'] = $knowledgeResults;
            }

            // Calculate latency
            $latency = (int) ((microtime(true) - $startTime) * 1000);

            // Log the interaction
            $this->logInteraction([
                'user_id' => $user->id,
                'model_used' => $model->id,
                'query' => $data['prompt'],
                'response' => $response['choices'][0]['message']['content'],
                'prompt_tokens' => $response['usage']['prompt_tokens'] ?? null,
                'completion_tokens' => $response['usage']['completion_tokens'] ?? null,
                'total_tokens' => $response['usage']['total_tokens'] ?? null,
                'context_rule_id' => $data['contextRuleId'] ?? null,
                'knowledge_base_results' => $data['knowledge_base_results'] ?? null,
                'knowledge_base_ids' => $data['knowledge_base_ids'] ?? null,
                'metadata' => $data['metadata'] ?? null,
                'latency_ms' => $latency,
                'success' => true,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);

            // Cache the response
            $this->cacheResponse($cacheKey, $response, $model->id);

            return response()->json($response);
        } catch (\Exception $e) {
            Log::error('AI Generation Error', [
                'error' => $e->getMessage(),
                'prompt' => $data['prompt'],
                'model' => $modelId,
            ]);

            // Log the failed interaction
            $this->logInteraction([
                'user_id' => $user->id,
                'model_used' => $modelId,
                'query' => $data['prompt'],
                'response' => 'Error: ' . $e->getMessage(),
                'context_rule_id' => $data['contextRuleId'] ?? null,
                'metadata' => ['error' => $e->getMessage()],
                'latency_ms' => (int) ((microtime(true) - $startTime) * 1000),
                'success' => false,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);

            return response()->json([
                'message' => 'Failed to generate AI response: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Stream a response from AI
     */
    public function streamGenerate(array $data): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $startTime = microtime(true);
        $user = auth()->user();
        $modelId = $data['model'] ?? $this->getDefaultModelId();
        $temperature = $data['temperature'] ?? 0.7;
        $maxTokens = $data['maxTokens'] ?? 1000;
        $contextData = $data['contextData'] ?? null;

        try {
            // Get the model configuration
            $model = AIModel::find($modelId);
            if (!$model || !$model->is_available) {
                return response()->json([
                    'message' => 'Model not available',
                ], 400);
            }

            // Create a StreamedResponse
            return response()->stream(function () use ($model, $data, $temperature, $maxTokens, $contextData, $user, $startTime) {
                // Set appropriate headers for SSE
                header('Content-Type: text/event-stream');
                header('Cache-Control: no-cache');
                header('Connection: keep-alive');
                header('X-Accel-Buffering: no'); // For NGINX

                // Log the start of the interaction
                $logId = (string) Str::uuid();

                // Send the SSE start event
                echo "event: start\n";
                echo "data: " . json_encode(['requestId' => $logId]) . "\n\n";
                flush();

                $chunks = [];
                $totalTokens = 0;

                try {
                    // Process based on model provider
                    switch ($model->provider) {
                        case 'openai':
                            $this->streamOpenAI($model, $data['prompt'], $temperature, $maxTokens, $contextData, $chunks, $totalTokens);
                            break;
                        case 'anthropic':
                            $this->streamAnthropic($model, $data['prompt'], $temperature, $maxTokens, $contextData, $chunks, $totalTokens);
                            break;
                        case 'google':
                            $this->streamGoogle($model, $data['prompt'], $temperature, $maxTokens, $contextData, $chunks, $totalTokens);
                            break;
                        default:
                            throw new \Exception("Streaming not supported for provider: {$model->provider}");
                    }

                    // Send the done event
                    echo "event: done\n";
                    echo "data: " . json_encode(['requestId' => $logId]) . "\n\n";
                    flush();

                    // Calculate latency
                    $latency = (int)((microtime(true) - $startTime) * 1000);

                    // Log the completed interaction
                    $fullResponse = implode('', $chunks);
                    $this->logInteraction([
                        'id' => $logId,
                        'user_id' => $user->id,
                        'model_used' => $model->id,
                        'query' => $data['prompt'],
                        'response' => $fullResponse,
                        'context_rule_id' => $data['contextRuleId'] ?? null,
                        'knowledge_base_results' => $data['knowledge_base_results'] ?? null,
                        'knowledge_base_ids' => $data['knowledge_base_ids'] ?? null,
                        'metadata' => array_merge($data['metadata'] ?? [], ['is_streaming' => true]),
                        'prompt_tokens' => $totalTokens['prompt'] ?? null,
                        'completion_tokens' => $totalTokens['completion'] ?? null,
                        'total_tokens' => $totalTokens['total'] ?? null,
                        'latency_ms' => $latency,
                        'success' => true,
                        'ip_address' => request()->ip(),
                        'user_agent' => request()->userAgent(),
                    ]);

                } catch (\Exception $e) {
                    // Send error event
                    echo "event: error\n";
                    echo "data: " . json_encode(['error' => $e->getMessage()]) . "\n\n";
                    flush();

                    // Log error
                    Log::error('AI Streaming Error', [
                        'error' => $e->getMessage(),
                        'model' => $model->id,
                        'prompt' => $data['prompt'],
                    ]);

                    // Log the failed interaction
                    $this->logInteraction([
                        'id' => $logId,
                        'user_id' => $user->id,
                        'model_used' => $model->id,
                        'query' => $data['prompt'],
                        'response' => 'Error: ' . $e->getMessage(),
                        'context_rule_id' => $data['contextRuleId'] ?? null,
                        'metadata' => ['error' => $e->getMessage(), 'is_streaming' => true],
                        'latency_ms' => (int)((microtime(true) - $startTime) * 1000),
                        'success' => false,
                        'ip_address' => request()->ip(),
                        'user_agent' => request()->userAgent(),
                    ]);
                }

            }, 200, [
                'Cache-Control' => 'no-cache',
                'X-Accel-Buffering' => 'no',
                'Content-Type' => 'text/event-stream',
            ]);
        } catch (\Exception $e) {
            Log::error('AI Streaming Setup Error', [
                'error' => $e->getMessage(),
                'prompt' => $data['prompt'],
                'model' => $modelId,
            ]);

            // Log the failed interaction
            $this->logInteraction([
                'user_id' => $user->id,
                'model_used' => $modelId,
                'query' => $data['prompt'],
                'response' => 'Error: ' . $e->getMessage(),
                'context_rule_id' => $data['contextRuleId'] ?? null,
                'metadata' => ['error' => $e->getMessage(), 'is_streaming' => true],
                'latency_ms' => (int)((microtime(true) - $startTime) * 1000),
                'success' => false,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);

            return response()->json([
                'message' => 'Failed to generate streaming AI response: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get available AI models
     */
    public function getModels(): JsonResponse
    {
        try {
            $models = AIModel::where('is_available', true)->get();
            return response()->json($models);
        } catch (\Exception $e) {
            Log::error('Failed to get AI models', [
                'error' => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Failed to get AI models'], 500);
        }
    }

    /**
     * Get a specific AI model by ID
     */
    public function getModel(string $id): JsonResponse
    {
        try {
            $model = AIModel::find($id);
            if (!$model) {
                return response()->json(['message' => 'Model not found'], 404);
            }
            return response()->json($model);
        } catch (\Exception $e) {
            Log::error('Failed to get AI model', [
                'error' => $e->getMessage(),
                'model_id' => $id,
            ]);
            return response()->json(['message' => 'Failed to get AI model'], 500);
        }
    }

    /**
     * Get the default AI model
     */
    public function getDefaultModel(): JsonResponse
    {
        try {
            $model = AIModel::where('is_default', true)->first();
            if (!$model) {
                // If no default is set, return the first available model
                $model = AIModel::where('is_available', true)->first();
                if (!$model) {
                    return response()->json(['message' => 'No models available'], 404);
                }
            }
            return response()->json($model);
        } catch (\Exception $e) {
            Log::error('Failed to get default AI model', [
                'error' => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Failed to get default AI model'], 500);
        }
    }

    /**
     * Get AI interaction logs
     */
    public function getLogs(array $filters = []): JsonResponse
    {
        try {
            $query = AIInteractionLog::query()
                ->with(['user:id,name,email'])
                ->orderBy('created_at', 'desc');

            // Apply filters
            if (isset($filters['userId'])) {
                $query->where('user_id', $filters['userId']);
            }

            if (isset($filters['modelUsed'])) {
                $query->where('model_used', $filters['modelUsed']);
            }

            if (isset($filters['contextRuleId'])) {
                $query->where('context_rule_id', $filters['contextRuleId']);
            }

            if (isset($filters['startDate'])) {
                $query->where('created_at', '>=', $filters['startDate']);
            }

            if (isset($filters['endDate'])) {
                $query->where('created_at', '<=', $filters['endDate']);
            }

            if (isset($filters['query'])) {
                $query->where('query', 'like', '%' . $filters['query'] . '%');
            }

            // Pagination
            $page = $filters['page'] ?? 1;
            $perPage = $filters['perPage'] ?? 15;
            $logs = $query->paginate($perPage, ['*'], 'page', $page);

            return response()->json([
                'logs' => $logs->items(),
                'totalPages' => $logs->lastPage(),
                'currentPage' => $logs->currentPage(),
                'totalItems' => $logs->total(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get AI logs', [
                'error' => $e->getMessage(),
                'filters' => $filters,
            ]);
            return response()->json(['message' => 'Failed to get AI logs'], 500);
        }
    }

    /**
     * Get a specific AI interaction log
     */
    public function getLog(string $id): JsonResponse
    {
        try {
            $log = AIInteractionLog::with(['user:id,name,email'])->find($id);
            if (!$log) {
                return response()->json(['message' => 'Log not found'], 404);
            }
            return response()->json($log);
        } catch (\Exception $e) {
            Log::error('Failed to get AI log', [
                'error' => $e->getMessage(),
                'id' => $id,
            ]);
            return response()->json(['message' => 'Failed to get AI log'], 500);
        }
    }

    /**
     * Get AI performance metrics
     */
    public function getPerformance(string $timeRange = '30d'): JsonResponse
    {
        try {
            // Determine start date based on time range
            $startDate = match($timeRange) {
                '7d' => now()->subDays(7)->startOfDay(),
                '30d' => now()->subDays(30)->startOfDay(),
                '90d' => now()->subDays(90)->startOfDay(),
                '365d' => now()->subDays(365)->startOfDay(),
                default => now()->subDays(30)->startOfDay(),
            };

            // Calculate overall metrics
            $totalRequests = AIInteractionLog::where('created_at', '>=', $startDate)->count();
            $successfulRequests = AIInteractionLog::where('created_at', '>=', $startDate)
                ->where('success', true)
                ->count();
            $successRate = $totalRequests > 0 ? ($successfulRequests / $totalRequests) * 100 : 0;
            $avgLatency = AIInteractionLog::where('created_at', '>=', $startDate)
                ->where('latency_ms', '>', 0)
                ->avg('latency_ms');

            // Calculate per-model metrics
            $modelUsage = AIInteractionLog::selectRaw('model_used, COUNT(*) as count')
                ->where('created_at', '>=', $startDate)
                ->groupBy('model_used')
                ->orderBy('count', 'desc')
                ->get()
                ->map(function ($item) use ($totalRequests) {
                    $model = AIModel::find($item->model_used);
                    return [
                        'model' => $model ? $model->name : $item->model_used,
                        'count' => $item->count,
                        'percentage' => $totalRequests > 0 ? ($item->count / $totalRequests) * 100 : 0,
                    ];
                });

            // Calculate average response times by model
            $avgResponseTimes = AIInteractionLog::selectRaw('model_used, AVG(latency_ms) as avg_time')
                ->where('created_at', '>=', $startDate)
                ->where('latency_ms', '>', 0)
                ->groupBy('model_used')
                ->get()
                ->map(function ($item) {
                    $model = AIModel::find($item->model_used);
                    return [
                        'model' => $model ? $model->name : $item->model_used,
                        'avgTime' => round($item->avg_time, 2),
                    ];
                });

            // Get usage metrics for the period
            $dailyUsage = AIInteractionLog::selectRaw('DATE(created_at) as date, COUNT(*) as count')
                ->where('created_at', '>=', $startDate)
                ->groupBy('date')
                ->orderBy('date')
                ->get()
                ->map(function ($item) {
                    return [
                        'date' => $item->date,
                        'count' => $item->count,
                    ];
                });

            return response()->json([
                'summary' => [
                    'totalRequests' => $totalRequests,
                    'successRate' => round($successRate, 1),
                    'avgLatency' => round($avgLatency ?? 0, 1),
                ],
                'modelUsage' => $modelUsage,
                'avgResponseTimes' => $avgResponseTimes,
                'dailyUsage' => $dailyUsage,
                'timeframe' => [
                    'start' => $startDate->toIso8601String(),
                    'end' => now()->toIso8601String(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get AI performance', [
                'error' => $e->getMessage(),
                'timeRange' => $timeRange,
            ]);
            return response()->json(['message' => 'Failed to get AI performance metrics'], 500);
        }
    }

    /**
     * Get AI cache status
     */
    public function getCache(): JsonResponse
    {
        try {
            $cacheItems = AICacheItem::orderBy('hit_count', 'desc')
                ->take(50)
                ->get();

            $totalItems = AICacheItem::count();
            $hitRate = AICacheItem::where('hit_count', '>', 0)->count() / ($totalItems ?: 1) * 100;
            $totalSize = AICacheItem::sum(DB::raw('LENGTH(prompt) + LENGTH(response)')) / 1024 / 1024; // approx MB

            return response()->json([
                'enabled' => true,
                'size' => round($totalSize, 2),
                'items' => $totalItems,
                'hitRate' => round($hitRate, 1),
                'ttl' => config('cache.ttl', 3600),
                'recentItems' => $cacheItems->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'model' => $item->model,
                        'promptPreview' => Str::limit($item->prompt, 100),
                        'tokens' => $item->tokens,
                        'hits' => $item->hit_count,
                        'created' => $item->created_at->toIso8601String(),
                        'expires' => $item->expires_at ? $item->expires_at->toIso8601String() : null,
                    ];
                }),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get AI cache status', [
                'error' => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Failed to get AI cache status'], 500);
        }
    }

    /**
     * Get a specific item from the AI cache
     */
    public function getCacheItem(string $id): JsonResponse
    {
        try {
            $cacheItem = AICacheItem::find($id);
            if (!$cacheItem) {
                return response()->json(['message' => 'Cache item not found'], 404);
            }

            return response()->json([
                'id' => $cacheItem->id,
                'prompt' => $cacheItem->prompt,
                'response' => $cacheItem->response,
                'model' => $cacheItem->model,
                'tokens' => $cacheItem->tokens,
                'created' => $cacheItem->created_at->toIso8601String(),
                'expires' => $cacheItem->expires_at ? $cacheItem->expires_at->toIso8601String() : null,
                'hits' => $cacheItem->hit_count,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get AI cache item', [
                'error' => $e->getMessage(),
                'id' => $id,
            ]);
            return response()->json(['message' => 'Failed to get AI cache item'], 500);
        }
    }

    /**
     * Clear the AI cache
     */
    public function clearCache(): JsonResponse
    {
        try {
            $count = AICacheItem::count();
            AICacheItem::truncate();

            return response()->json([
                'message' => 'Cache cleared successfully',
                'cleared' => $count,
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to clear AI cache', [
                'error' => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Failed to clear AI cache'], 500);
        }
    }

    /**
     * Get prompt templates
     */
    public function getPromptTemplates(): JsonResponse
    {
        try {
            $user = auth()->user();
            $templates = AIPromptTemplate::where(function ($query) use ($user) {
                $query->where('is_public', true)
                    ->orWhere('user_id', $user->id);
            })
            ->orderBy('created_at', 'desc')
            ->get();

            return response()->json($templates);
        } catch (\Exception $e) {
            Log::error('Failed to get prompt templates', [
                'error' => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Failed to get prompt templates'], 500);
        }
    }

    /**
     * Get a specific prompt template
     */
    public function getPromptTemplate(string $id): JsonResponse
    {
        try {
            $user = auth()->user();
            $template = AIPromptTemplate::where('id', $id)
                ->where(function ($query) use ($user) {
                    $query->where('is_public', true)
                        ->orWhere('user_id', $user->id);
                })
                ->first();

            if (!$template) {
                return response()->json(['message' => 'Prompt template not found'], 404);
            }

            return response()->json($template);
        } catch (\Exception $e) {
            Log::error('Failed to get prompt template', [
                'error' => $e->getMessage(),
                'id' => $id,
            ]);
            return response()->json(['message' => 'Failed to get prompt template'], 500);
        }
    }

    /**
     * Create a prompt template
     */
    public function createPromptTemplate(array $data): JsonResponse
    {
        try {
            $user = auth()->user();
            $template = new AIPromptTemplate();
            $template->id = (string) Str::uuid();
            $template->user_id = $user->id;
            $template->name = $data['name'];
            $template->description = $data['description'] ?? null;
            $template->content = $data['content'];
            $template->category = $data['category'] ?? null;
            $template->is_public = $data['isPublic'] ?? false;
            $template->is_default = $data['isDefault'] ?? false;
            $template->metadata = $data['metadata'] ?? null;
            $template->save();

            return response()->json($template, 201);
        } catch (\Exception $e) {
            Log::error('Failed to create prompt template', [
                'error' => $e->getMessage(),
                'data' => $data,
            ]);
            return response()->json(['message' => 'Failed to create prompt template'], 500);
        }
    }

    /**
     * Update a prompt template
     */
    public function updatePromptTemplate(string $id, array $data): JsonResponse
    {
        try {
            $user = auth()->user();
            $template = AIPromptTemplate::where('id', $id)
                ->where('user_id', $user->id)
                ->first();

            if (!$template) {
                return response()->json(['message' => 'Prompt template not found or access denied'], 404);
            }

            if (isset($data['name'])) {
                $template->name = $data['name'];
            }

            if (isset($data['description'])) {
                $template->description = $data['description'];
            }

            if (isset($data['content'])) {
                $template->content = $data['content'];
            }

            if (isset($data['category'])) {
                $template->category = $data['category'];
            }

            if (isset($data['isPublic'])) {
                $template->is_public = $data['isPublic'];
            }

            if (isset($data['isDefault'])) {
                $template->is_default = $data['isDefault'];
            }

            if (isset($data['metadata'])) {
                $template->metadata = $data['metadata'];
            }

            $template->save();

            return response()->json($template);
        } catch (\Exception $e) {
            Log::error('Failed to update prompt template', [
                'error' => $e->getMessage(),
                'id' => $id,
                'data' => $data,
            ]);
            return response()->json(['message' => 'Failed to update prompt template'], 500);
        }
    }

    /**
     * Delete a prompt template
     */
    public function deletePromptTemplate(string $id): JsonResponse
    {
        try {
            $user = auth()->user();
            $template = AIPromptTemplate::where('id', $id)
                ->where('user_id', $user->id)
                ->first();

            if (!$template) {
                return response()->json(['message' => 'Prompt template not found or access denied'], 404);
            }

            $template->delete();

            return response()->json(['message' => 'Prompt template deleted successfully']);
        } catch (\Exception $e) {
            Log::error('Failed to delete prompt template', [
                'error' => $e->getMessage(),
                'id' => $id,
            ]);
            return response()->json(['message' => 'Failed to delete prompt template'], 500);
        }
    }

    /**
     * Get the default model ID
     */
    private function getDefaultModelId(): string
    {
        $defaultModel = AIModel::where('is_default', true)->first();
        return $defaultModel ? $defaultModel->id : 'gpt-3.5-turbo'; // Fallback to a default if none set
    }

    /**
     * Generate a cache key for the request
     */
    private function generateCacheKey(string $prompt, string $modelId, float $temperature, int $maxTokens): string
    {
        return md5($prompt . $modelId . $temperature . $maxTokens);
    }

    /**
     * Get a cached response if available
     */
    private function getCachedResponse(string $cacheKey): ?array
    {
        try {
            $cacheItem = AICacheItem::where('id', $cacheKey)->first();
            if ($cacheItem) {
                // Check if expired
                if ($cacheItem->hasExpired()) {
                    $cacheItem->delete();
                    return null;
                }

                // Increment hit count and return cached response
                $cacheItem->incrementHitCount();
                return json_decode($cacheItem->response, true);
            }
            return null;
        } catch (\Exception $e) {
            Log::error('Error retrieving cached response', [
                'error' => $e->getMessage(),
                'cache_key' => $cacheKey,
            ]);
            return null;
        }
    }

    /**
     * Cache a response
     */
    private function cacheResponse(string $cacheKey, array $response, string $modelId): void
    {
        try {
            // Set expiration time (e.g., 1 hour)
            $expiresAt = now()->addHour();
            $tokens = $response['usage']['total_tokens'] ?? 0;

            // Store in database
            AICacheItem::create([
                'id' => $cacheKey,
                'prompt' => $response['choices'][0]['message']['content'] ?? json_encode($response),
                'response' => json_encode($response),
                'model' => $modelId,
                'tokens' => $tokens,
                'hit_count' => 1,
                'expires_at' => $expiresAt,
            ]);
        } catch (\Exception $e) {
            Log::error('Error caching response', [
                'error' => $e->getMessage(),
                'cache_key' => $cacheKey,
            ]);
        }
    }

    /**
     * Process the model request based on provider with fallback
     */
    private function processModelRequest(AIModel $model, string $prompt, float $temperature, int $maxTokens, ?array $contextData, ?array $knowledgeResults = null): array
    {
        // Get fallback models in case the primary model fails
        $fallbackModels = $this->getFallbackModels($model);
        $exceptions = [];

        // Try the primary model first
        try {
            return $this->processModelRequestWithProvider($model, $prompt, $temperature, $maxTokens, $contextData, $knowledgeResults);
        } catch (\Exception $e) {
            Log::warning("Primary model {$model->id} failed: {$e->getMessage()}", [
                'model' => $model->id,
                'provider' => $model->provider,
                'error' => $e->getMessage(),
            ]);
            $exceptions[] = $e;

            // If primary model fails, try fallbacks in order
            foreach ($fallbackModels as $fallbackModel) {
                try {
                    Log::info("Trying fallback model {$fallbackModel->id} after primary model failed");
                    return $this->processModelRequestWithProvider($fallbackModel, $prompt, $temperature, $maxTokens, $contextData, $knowledgeResults);
                } catch (\Exception $fallbackException) {
                    Log::warning("Fallback model {$fallbackModel->id} failed: {$fallbackException->getMessage()}", [
                        'model' => $fallbackModel->id,
                        'provider' => $fallbackModel->provider,
                        'error' => $fallbackException->getMessage(),
                    ]);
                    $exceptions[] = $fallbackException;
                    continue;
                }
            }

            // If all models failed, throw an exception with details
            $errorMessages = array_map(fn($e) => $e->getMessage(), $exceptions);
            throw new \Exception("All AI models failed: " . implode("; ", $errorMessages));
        }
    }

    /**
     * Process the model request with a specific provider
     */
    private function processModelRequestWithProvider(AIModel $model, string $prompt, float $temperature, int $maxTokens, ?array $contextData, ?array $knowledgeResults = null): array
    {
        // Implement retry logic with exponential backoff
        $maxRetries = config('ai.retry_attempts', 3);
        $baseDelay = config('ai.retry_delay', 1000); // milliseconds

        for ($attempt = 0; $attempt <= $maxRetries; $attempt++) {
            try {
                switch ($model->provider) {
                    case 'openai':
                        return $this->processOpenAIRequest($model, $prompt, $temperature, $maxTokens, $contextData, $knowledgeResults);
                    case 'anthropic':
                        return $this->processAnthropicRequest($model, $prompt, $temperature, $maxTokens, $contextData, $knowledgeResults);
                    case 'google':
                        return $this->processGoogleRequest($model, $prompt, $temperature, $maxTokens, $contextData, $knowledgeResults);
                    case 'grok':
                        return $this->processGrokRequest($model, $prompt, $temperature, $maxTokens, $contextData, $knowledgeResults);
                    case 'huggingface':
                        return $this->processHuggingFaceRequest($model, $prompt, $temperature, $maxTokens, $contextData, $knowledgeResults);
                    case 'openrouter':
                        return $this->processOpenRouterRequest($model, $prompt, $temperature, $maxTokens, $contextData, $knowledgeResults);
                    case 'mistral':
                        return $this->processMistralRequest($model, $prompt, $temperature, $maxTokens, $contextData, $knowledgeResults);
                    case 'deepseek':
                        return $this->processDeepSeekRequest($model, $prompt, $temperature, $maxTokens, $contextData, $knowledgeResults);
                    case 'cohere':
                        return $this->processCohereRequest($model, $prompt, $temperature, $maxTokens, $contextData, $knowledgeResults);
                    default:
                        throw new \Exception("Unsupported AI provider: {$model->provider}");
                }
            } catch (\Exception $e) {
                // Check if this is the last attempt
                if ($attempt === $maxRetries) {
                    throw $e; // Re-throw the exception if we've exhausted all retries
                }

                // Check if the error is retryable
                if (!$this->isRetryableError($e)) {
                    throw $e; // Don't retry if the error is not retryable
                }

                // Calculate delay with exponential backoff and jitter
                $delay = $baseDelay * pow(2, $attempt) + rand(0, 1000);
                Log::info("Retrying AI request after error: {$e->getMessage()}", [
                    'attempt' => $attempt + 1,
                    'max_retries' => $maxRetries,
                    'delay_ms' => $delay,
                ]);

                // Sleep for the calculated delay
                usleep($delay * 1000);
            }
        }

        // This should never be reached due to the throw in the loop
        throw new \Exception("Failed to process model request after {$maxRetries} retries");
    }

    /**
     * Get fallback models for a given model
     */
    private function getFallbackModels(AIModel $primaryModel): array
    {
        // Get fallback models from configuration or database
        $fallbackModels = [];

        // First, try to get models from the same provider
        $sameProviderModels = AIModel::where('provider', $primaryModel->provider)
            ->where('id', '!=', $primaryModel->id)
            ->where('is_available', true)
            ->orderBy('priority', 'desc')
            ->get();

        if ($sameProviderModels->isNotEmpty()) {
            $fallbackModels = array_merge($fallbackModels, $sameProviderModels->all());
        }

        // Then, try to get models from other providers
        $otherProviderModels = AIModel::where('provider', '!=', $primaryModel->provider)
            ->where('is_available', true)
            ->orderBy('priority', 'desc')
            ->get();

        if ($otherProviderModels->isNotEmpty()) {
            $fallbackModels = array_merge($fallbackModels, $otherProviderModels->all());
        }

        return $fallbackModels;
    }

    /**
     * Check if an error is retryable
     */
    private function isRetryableError(\Exception $e): bool
    {
        // List of error patterns that are retryable
        $retryablePatterns = [
            'rate limit',
            'timeout',
            'connection',
            'server error',
            '5\d\d', // 5xx status codes
            'too many requests',
            'capacity',
            'overloaded',
            'try again',
            'temporary',
        ];

        $message = strtolower($e->getMessage());

        foreach ($retryablePatterns as $pattern) {
            if (preg_match('/' . $pattern . '/i', $message)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Process request for OpenAI models
     */
    private function processOpenAIRequest(AIModel $model, string $prompt, float $temperature, int $maxTokens, ?array $contextData, ?array $knowledgeResults = null): array
    {
        $apiKey = env('OPENAI_API_KEY');
        if (!$apiKey) {
            throw new \Exception('OpenAI API key is not configured');
        }

        $url = 'https://api.openai.com/v1/chat/completions';

        $messages = [];
        if ($contextData && isset($contextData['systemPrompt'])) {
            $messages[] = [
                'role' => 'system',
                'content' => $contextData['systemPrompt']
            ];
        } else {
            $messages[] = [
                'role' => 'system',
                'content' => 'You are a helpful assistant.'
            ];
        }

        // Add knowledge base context if available
        if (!empty($knowledgeResults)) {
            $knowledgeContext = $this->formatKnowledgeBaseContext($knowledgeResults);

            $messages[] = [
                'role' => 'system',
                'content' => $knowledgeContext
            ];
        }

        $messages[] = [
            'role' => 'user',
            'content' => $prompt
        ];

        $payload = [
            'model' => $model->id,
            'messages' => $messages,
            'temperature' => $temperature,
            'max_tokens' => $maxTokens,
        ];

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$apiKey}",
            'Content-Type' => 'application/json',
        ])->post($url, $payload);

        if ($response->failed()) {
            $error = $response->json();
            Log::error('OpenAI API Error', ['error' => $error]);
            throw new \Exception('OpenAI API Error: ' . ($error['error']['message'] ?? 'Unknown error'));
        }

        return $response->json();
    }

    /**
     * Process request for Anthropic models
     */
    private function processAnthropicRequest(AIModel $model, string $prompt, float $temperature, int $maxTokens, ?array $contextData): array
    {
        $apiKey = env('ANTHROPIC_API_KEY');
        if (!$apiKey) {
            throw new \Exception('Anthropic API key is not configured');
        }

        $url = 'https://api.anthropic.com/v1/messages';

        $systemPrompt = '';
        if ($contextData && isset($contextData['systemPrompt'])) {
            $systemPrompt = $contextData['systemPrompt'];
        }

        $payload = [
            'model' => $model->id,
            'messages' => [
                [
                    'role' => 'user',
                    'content' => $prompt
                ]
            ],
            'temperature' => $temperature,
            'max_tokens' => $maxTokens,
        ];

        if ($systemPrompt) {
            $payload['system'] = $systemPrompt;
        }

        $response = Http::withHeaders([
            'x-api-key' => $apiKey,
            'anthropic-version' => '2023-06-01',
            'Content-Type' => 'application/json',
        ])->post($url, $payload);

        if ($response->failed()) {
            $error = $response->json();
            Log::error('Anthropic API Error', ['error' => $error]);
            throw new \Exception('Anthropic API Error: ' . ($error['error']['message'] ?? 'Unknown error'));
        }

        // Transform Anthropic response to match OpenAI format for consistency
        $anthropicResponse = $response->json();
        return [
            'id' => $anthropicResponse['id'],
            'object' => 'chat.completion',
            'created' => now()->timestamp,
            'model' => $model->id,
            'choices' => [
                [
                    'index' => 0,
                    'message' => [
                        'role' => 'assistant',
                        'content' => $anthropicResponse['content'][0]['text'],
                    ],
                    'finish_reason' => $anthropicResponse['stop_reason'],
                ],
            ],
            'usage' => [
                'prompt_tokens' => $anthropicResponse['usage']['input_tokens'],
                'completion_tokens' => $anthropicResponse['usage']['output_tokens'],
                'total_tokens' => $anthropicResponse['usage']['input_tokens'] + $anthropicResponse['usage']['output_tokens'],
            ],
        ];
    }

    /**
     * Process request for Google models
     */
    private function processGoogleRequest(AIModel $model, string $prompt, float $temperature, int $maxTokens, ?array $contextData): array
    {
        $apiKey = env('GOOGLE_AI_API_KEY');
        if (!$apiKey) {
            throw new \Exception('Google AI API key is not configured');
        }

        $url = "https://generativelanguage.googleapis.com/v1/models/{$model->id}:generateContent?key={$apiKey}";

        $systemPrompt = '';
        if ($contextData && isset($contextData['systemPrompt'])) {
            $systemPrompt = $contextData['systemPrompt'];
        }

        $contents = [];
        if ($systemPrompt) {
            $contents[] = [
                'role' => 'system',
                'parts' => [
                    ['text' => $systemPrompt]
                ]
            ];
        }

        $contents[] = [
            'role' => 'user',
            'parts' => [
                ['text' => $prompt]
            ]
        ];

        $payload = [
            'contents' => $contents,
            'generationConfig' => [
                'temperature' => $temperature,
                'maxOutputTokens' => $maxTokens,
            ],
        ];

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
        ])->post($url, $payload);

        if ($response->failed()) {
            $error = $response->json();
            Log::error('Google AI API Error', ['error' => $error]);
            throw new \Exception('Google AI API Error: ' . ($error['error']['message'] ?? 'Unknown error'));
        }

        // Transform Google response to match OpenAI format for consistency
        $googleResponse = $response->json();
        $content = '';

        if (isset($googleResponse['candidates'][0]['content']['parts'][0]['text'])) {
            $content = $googleResponse['candidates'][0]['content']['parts'][0]['text'];
        }

        return [
            'id' => Str::uuid()->toString(),
            'object' => 'chat.completion',
            'created' => now()->timestamp,
            'model' => $model->id,
            'choices' => [
                [
                    'index' => 0,
                    'message' => [
                        'role' => 'assistant',
                        'content' => $content,
                    ],
                    'finish_reason' => 'stop',
                ],
            ],
            'usage' => [
                'prompt_tokens' => $googleResponse['usageMetadata']['promptTokenCount'] ?? 0,
                'completion_tokens' => $googleResponse['usageMetadata']['candidatesTokenCount'] ?? 0,
                'total_tokens' => ($googleResponse['usageMetadata']['promptTokenCount'] ?? 0) +
                                 ($googleResponse['usageMetadata']['candidatesTokenCount'] ?? 0),
            ],
        ];
    }

    /**
     * Stream response from OpenAI
     */
    private function streamOpenAI(AIModel $model, string $prompt, float $temperature, int $maxTokens, ?array $contextData, array &$chunks, array &$totalTokens): void
    {
        $apiKey = env('OPENAI_API_KEY');
        if (!$apiKey) {
            throw new \Exception('OpenAI API key is not configured');
        }

        $url = 'https://api.openai.com/v1/chat/completions';

        $messages = [];
        if ($contextData && isset($contextData['systemPrompt'])) {
            $messages[] = [
                'role' => 'system',
                'content' => $contextData['systemPrompt']
            ];
        } else {
            $messages[] = [
                'role' => 'system',
                'content' => 'You are a helpful assistant.'
            ];
        }

        $messages[] = [
            'role' => 'user',
            'content' => $prompt
        ];

        $payload = [
            'model' => $model->id,
            'messages' => $messages,
            'temperature' => $temperature,
            'max_tokens' => $maxTokens,
            'stream' => true,
        ];

        // Use a streamed request with a callback for each chunk
        Http::withOptions([
            'stream' => true,
            'connect_timeout' => 30,
            'read_timeout' => 600, // 10 minutes max for long completions
        ])->withHeaders([
            'Authorization' => "Bearer {$apiKey}",
            'Content-Type' => 'application/json',
            'Accept' => 'text/event-stream',
        ])->post($url, $payload)->then(function ($response) use (&$chunks, &$totalTokens) {
            $buffer = '';
            $promptTokens = 0;
            $completionTokens = 0;

            $response->body()->each(function ($chunk) use (&$buffer, &$chunks, &$promptTokens, &$completionTokens) {
                $buffer .= $chunk;

                // Process complete SSE events
                while (($pos = strpos($buffer, "\n\n")) !== false) {
                    $event = substr($buffer, 0, $pos);
                    $buffer = substr($buffer, $pos + 2);

                    // Skip empty events and heartbeats
                    if (empty($event) || $event === 'data: [DONE]') {
                        continue;
                    }

                    // Parse the event data
                    if (preg_match('/^data: (.*)$/m', $event, $matches)) {
                        $data = json_decode($matches[1], true);

                        // Handle token counts
                        if (isset($data['usage'])) {
                            $promptTokens = $data['usage']['prompt_tokens'] ?? 0;
                            $completionTokens = $data['usage']['completion_tokens'] ?? 0;
                        }

                        // Extract and send content delta
                        if (isset($data['choices'][0]['delta']['content'])) {
                            $contentDelta = $data['choices'][0]['delta']['content'];
                            $chunks[] = $contentDelta;

                            // Send the chunk to the client
                            echo "event: chunk\n";
                            echo "data: " . json_encode(['text' => $contentDelta]) . "\n\n";
                            flush();
                        }
                    }
                }
            });

            $totalTokens = [
                'prompt' => $promptTokens,
                'completion' => $completionTokens,
                'total' => $promptTokens + $completionTokens
            ];
        });
    }

    /**
     * Stream response from Anthropic
     */
    private function streamAnthropic(AIModel $model, string $prompt, float $temperature, int $maxTokens, ?array $contextData, array &$chunks, array &$totalTokens): void
    {
        $apiKey = env('ANTHROPIC_API_KEY');
        if (!$apiKey) {
            throw new \Exception('Anthropic API key is not configured');
        }

        $url = 'https://api.anthropic.com/v1/messages';

        $systemPrompt = '';
        if ($contextData && isset($contextData['systemPrompt'])) {
            $systemPrompt = $contextData['systemPrompt'];
        }

        $payload = [
            'model' => $model->id,
            'messages' => [
                [
                    'role' => 'user',
                    'content' => $prompt
                ]
            ],
            'temperature' => $temperature,
            'max_tokens' => $maxTokens,
            'stream' => true,
        ];

        if ($systemPrompt) {
            $payload['system'] = $systemPrompt;
        }

        // Use a streamed request with a callback for each chunk
        Http::withOptions([
            'stream' => true,
            'connect_timeout' => 30,
            'read_timeout' => 600, // 10 minutes max for long completions
        ])->withHeaders([
            'x-api-key' => $apiKey,
            'anthropic-version' => '2023-06-01',
            'Content-Type' => 'application/json',
        ])->post($url, $payload)->then(function ($response) use (&$chunks, &$totalTokens) {
            $buffer = '';
            $inputTokens = 0;
            $outputTokens = 0;

            $response->body()->each(function ($chunk) use (&$buffer, &$chunks, &$inputTokens, &$outputTokens) {
                $buffer .= $chunk;

                // Process complete SSE events
                while (($pos = strpos($buffer, "\n\n")) !== false) {
                    $event = substr($buffer, 0, $pos);
                    $buffer = substr($buffer, $pos + 2);

                    // Skip empty events and heartbeats
                    if (empty($event) || $event === 'data: [DONE]') {
                        continue;
                    }

                    // Parse the event data
                    if (preg_match('/^data: (.*)$/m', $event, $matches)) {
                        $data = json_decode($matches[1], true);

                        // Handle usage data
                        if (isset($data['usage'])) {
                            $inputTokens = $data['usage']['input_tokens'] ?? 0;
                            $outputTokens = $data['usage']['output_tokens'] ?? 0;
                        }

                        // Extract and send content delta
                        if (isset($data['delta']['text'])) {
                            $contentDelta = $data['delta']['text'];
                            $chunks[] = $contentDelta;

                            // Send the chunk to the client
                            echo "event: chunk\n";
                            echo "data: " . json_encode(['text' => $contentDelta]) . "\n\n";
                            flush();
                        }
                    }
                }
            });

            $totalTokens = [
                'prompt' => $inputTokens,
                'completion' => $outputTokens,
                'total' => $inputTokens + $outputTokens
            ];
        });
    }

    /**
     * Stream response from Google AI
     */
    private function streamGoogle(AIModel $model, string $prompt, float $temperature, int $maxTokens, ?array $contextData, array &$chunks, array &$totalTokens): void
    {
        $apiKey = env('GOOGLE_AI_API_KEY');
        if (!$apiKey) {
            throw new \Exception('Google AI API key is not configured');
        }

        $url = "https://generativelanguage.googleapis.com/v1/models/{$model->id}:streamGenerateContent?key={$apiKey}";

        $systemPrompt = '';
        if ($contextData && isset($contextData['systemPrompt'])) {
            $systemPrompt = $contextData['systemPrompt'];
        }

        $contents = [];
        if ($systemPrompt) {
            $contents[] = [
                'role' => 'system',
                'parts' => [
                    ['text' => $systemPrompt]
                ]
            ];
        }

        $contents[] = [
            'role' => 'user',
            'parts' => [
                ['text' => $prompt]
            ]
        ];

        $payload = [
            'contents' => $contents,
            'generationConfig' => [
                'temperature' => $temperature,
                'maxOutputTokens' => $maxTokens,
            ],
        ];

        // Use a streamed request with a callback for each chunk
        Http::withOptions([
            'stream' => true,
            'connect_timeout' => 30,
            'read_timeout' => 600, // 10 minutes max for long completions
        ])->withHeaders([
            'Content-Type' => 'application/json',
        ])->post($url, $payload)->then(function ($response) use (&$chunks, &$totalTokens) {
            $buffer = '';
            $promptTokens = 0;
            $completionTokens = 0;

            $response->body()->each(function ($chunk) use (&$buffer, &$chunks, &$promptTokens, &$completionTokens) {
                $buffer .= $chunk;

                // Process complete JSON objects (Google doesn't use SSE format)
                if (substr($buffer, -1) === '}' && $this->isValidJson($buffer)) {
                    $data = json_decode($buffer, true);
                    $buffer = '';

                    // Handle usage data (may be in a separate chunk)
                    if (isset($data['usageMetadata'])) {
                        $promptTokens = $data['usageMetadata']['promptTokenCount'] ?? 0;
                        $completionTokens = $data['usageMetadata']['candidatesTokenCount'] ?? 0;
                    }

                    // Extract and send content
                    if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                        $contentDelta = $data['candidates'][0]['content']['parts'][0]['text'];
                        $chunks[] = $contentDelta;

                        // Send the chunk to the client
                        echo "event: chunk\n";
                        echo "data: " . json_encode(['text' => $contentDelta]) . "\n\n";
                        flush();
                    }
                }
            });

            $totalTokens = [
                'prompt' => $promptTokens,
                'completion' => $completionTokens,
                'total' => $promptTokens + $completionTokens
            ];
        });
    }

    /**
     * Process request for Grok models
     */
    private function processGrokRequest(AIModel $model, string $prompt, float $temperature, int $maxTokens, ?array $contextData, ?array $knowledgeResults = null): array
    {
        $apiKey = env('GROK_API_KEY');
        if (!$apiKey) {
            throw new \Exception('Grok API key is not configured');
        }

        $baseUrl = env('GROK_API_URL', 'https://api.grok.ai/v1');
        $url = "{$baseUrl}/chat/completions";

        $messages = [];
        if ($contextData && isset($contextData['systemPrompt'])) {
            $messages[] = [
                'role' => 'system',
                'content' => $contextData['systemPrompt']
            ];
        } else {
            $messages[] = [
                'role' => 'system',
                'content' => 'You are a helpful assistant.'
            ];
        }

        // Add knowledge base context if available
        if (!empty($knowledgeResults)) {
            $knowledgeContext = $this->formatKnowledgeBaseContext($knowledgeResults);

            $messages[] = [
                'role' => 'system',
                'content' => $knowledgeContext
            ];
        }

        $messages[] = [
            'role' => 'user',
            'content' => $prompt
        ];

        $payload = [
            'model' => $model->id,
            'messages' => $messages,
            'temperature' => $temperature,
            'max_tokens' => $maxTokens,
        ];

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$apiKey}",
            'Content-Type' => 'application/json',
        ])->post($url, $payload);

        if ($response->failed()) {
            $error = $response->json();
            Log::error('Grok API Error', ['error' => $error]);
            throw new \Exception('Grok API Error: ' . ($error['error']['message'] ?? 'Unknown error'));
        }

        return $response->json();
    }

    /**
     * Process request for HuggingFace models
     */
    private function processHuggingFaceRequest(AIModel $model, string $prompt, float $temperature, int $maxTokens, ?array $contextData, ?array $knowledgeResults = null): array
    {
        $apiKey = env('HUGGINGFACE_API_KEY');
        if (!$apiKey) {
            throw new \Exception('HuggingFace API key is not configured');
        }

        $baseUrl = env('HUGGINGFACE_API_URL', 'https://api-inference.huggingface.co/models');
        $url = "{$baseUrl}/{$model->id}";

        // Format the prompt based on the model
        $formattedPrompt = $prompt;

        // Add system prompt if available
        if ($contextData && isset($contextData['systemPrompt'])) {
            $formattedPrompt = $contextData['systemPrompt'] . "\n\n" . $prompt;
        }

        // Add knowledge base context if available
        if (!empty($knowledgeResults)) {
            $knowledgeContext = $this->formatKnowledgeBaseContext($knowledgeResults);
            $formattedPrompt = $knowledgeContext . "\n\n" . $formattedPrompt;
        }

        $payload = [
            'inputs' => $formattedPrompt,
            'parameters' => [
                'temperature' => $temperature,
                'max_new_tokens' => $maxTokens,
                'return_full_text' => false,
            ],
        ];

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$apiKey}",
            'Content-Type' => 'application/json',
        ])->post($url, $payload);

        if ($response->failed()) {
            $error = $response->json();
            Log::error('HuggingFace API Error', ['error' => $error]);
            throw new \Exception('HuggingFace API Error: ' . ($error['error'] ?? 'Unknown error'));
        }

        $hfResponse = $response->json();
        $content = '';

        // Extract content based on response format
        if (is_array($hfResponse) && isset($hfResponse[0]['generated_text'])) {
            $content = $hfResponse[0]['generated_text'];
        } elseif (is_string($hfResponse)) {
            $content = $hfResponse;
        }

        // Transform HuggingFace response to match OpenAI format for consistency
        return [
            'id' => Str::uuid()->toString(),
            'object' => 'chat.completion',
            'created' => now()->timestamp,
            'model' => $model->id,
            'choices' => [
                [
                    'index' => 0,
                    'message' => [
                        'role' => 'assistant',
                        'content' => $content,
                    ],
                    'finish_reason' => 'stop',
                ],
            ],
            'usage' => [
                'prompt_tokens' => strlen($formattedPrompt) / 4, // Rough estimate
                'completion_tokens' => strlen($content) / 4, // Rough estimate
                'total_tokens' => (strlen($formattedPrompt) + strlen($content)) / 4, // Rough estimate
            ],
        ];
    }

    /**
     * Process request for OpenRouter models
     */
    private function processOpenRouterRequest(AIModel $model, string $prompt, float $temperature, int $maxTokens, ?array $contextData, ?array $knowledgeResults = null): array
    {
        $apiKey = env('OPENROUTER_API_KEY');
        if (!$apiKey) {
            throw new \Exception('OpenRouter API key is not configured');
        }

        $baseUrl = env('OPENROUTER_API_URL', 'https://openrouter.ai/api/v1');
        $url = "{$baseUrl}/chat/completions";

        $messages = [];
        if ($contextData && isset($contextData['systemPrompt'])) {
            $messages[] = [
                'role' => 'system',
                'content' => $contextData['systemPrompt']
            ];
        } else {
            $messages[] = [
                'role' => 'system',
                'content' => 'You are a helpful assistant.'
            ];
        }

        // Add knowledge base context if available
        if (!empty($knowledgeResults)) {
            $knowledgeContext = $this->formatKnowledgeBaseContext($knowledgeResults);

            $messages[] = [
                'role' => 'system',
                'content' => $knowledgeContext
            ];
        }

        $messages[] = [
            'role' => 'user',
            'content' => $prompt
        ];

        $payload = [
            'model' => $model->id,
            'messages' => $messages,
            'temperature' => $temperature,
            'max_tokens' => $maxTokens,
        ];

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$apiKey}",
            'HTTP-Referer' => config('app.url'),
            'X-Title' => config('app.name'),
            'Content-Type' => 'application/json',
        ])->post($url, $payload);

        if ($response->failed()) {
            $error = $response->json();
            Log::error('OpenRouter API Error', ['error' => $error]);
            throw new \Exception('OpenRouter API Error: ' . ($error['error']['message'] ?? 'Unknown error'));
        }

        return $response->json();
    }

    /**
     * Process request for Mistral models
     */
    private function processMistralRequest(AIModel $model, string $prompt, float $temperature, int $maxTokens, ?array $contextData, ?array $knowledgeResults = null): array
    {
        $apiKey = env('MISTRAL_API_KEY');
        if (!$apiKey) {
            throw new \Exception('Mistral API key is not configured');
        }

        $baseUrl = env('MISTRAL_API_URL', 'https://api.mistral.ai/v1');
        $url = "{$baseUrl}/chat/completions";

        $messages = [];
        if ($contextData && isset($contextData['systemPrompt'])) {
            $messages[] = [
                'role' => 'system',
                'content' => $contextData['systemPrompt']
            ];
        }

        // Add knowledge base context if available
        if (!empty($knowledgeResults)) {
            $knowledgeContext = $this->formatKnowledgeBaseContext($knowledgeResults);

            $messages[] = [
                'role' => 'system',
                'content' => $knowledgeContext
            ];
        }

        $messages[] = [
            'role' => 'user',
            'content' => $prompt
        ];

        $payload = [
            'model' => $model->id,
            'messages' => $messages,
            'temperature' => $temperature,
            'max_tokens' => $maxTokens,
        ];

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$apiKey}",
            'Content-Type' => 'application/json',
        ])->post($url, $payload);

        if ($response->failed()) {
            $error = $response->json();
            Log::error('Mistral API Error', ['error' => $error]);
            throw new \Exception('Mistral API Error: ' . ($error['error']['message'] ?? 'Unknown error'));
        }

        return $response->json();
    }

    /**
     * Process request for DeepSeek models
     */
    private function processDeepSeekRequest(AIModel $model, string $prompt, float $temperature, int $maxTokens, ?array $contextData, ?array $knowledgeResults = null): array
    {
        $apiKey = env('DEEPSEEK_API_KEY');
        if (!$apiKey) {
            throw new \Exception('DeepSeek API key is not configured');
        }

        $baseUrl = env('DEEPSEEK_API_URL', 'https://api.deepseek.com/v1');
        $url = "{$baseUrl}/chat/completions";

        $messages = [];
        if ($contextData && isset($contextData['systemPrompt'])) {
            $messages[] = [
                'role' => 'system',
                'content' => $contextData['systemPrompt']
            ];
        } else {
            $messages[] = [
                'role' => 'system',
                'content' => 'You are a helpful assistant.'
            ];
        }

        // Add knowledge base context if available
        if (!empty($knowledgeResults)) {
            $knowledgeContext = $this->formatKnowledgeBaseContext($knowledgeResults);

            $messages[] = [
                'role' => 'system',
                'content' => $knowledgeContext
            ];
        }

        $messages[] = [
            'role' => 'user',
            'content' => $prompt
        ];

        $payload = [
            'model' => $model->id,
            'messages' => $messages,
            'temperature' => $temperature,
            'max_tokens' => $maxTokens,
        ];

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$apiKey}",
            'Content-Type' => 'application/json',
        ])->post($url, $payload);

        if ($response->failed()) {
            $error = $response->json();
            Log::error('DeepSeek API Error', ['error' => $error]);
            throw new \Exception('DeepSeek API Error: ' . ($error['error']['message'] ?? 'Unknown error'));
        }

        return $response->json();
    }

    /**
     * Process request for Cohere models
     */
    private function processCohereRequest(AIModel $model, string $prompt, float $temperature, int $maxTokens, ?array $contextData, ?array $knowledgeResults = null): array
    {
        $apiKey = env('COHERE_API_KEY');
        if (!$apiKey) {
            throw new \Exception('Cohere API key is not configured');
        }

        $baseUrl = env('COHERE_API_URL', 'https://api.cohere.ai/v1');

        // Cohere uses a different endpoint for chat vs. generation
        $isChatModel = strpos($model->id, 'command') !== false;
        $url = $isChatModel ? "{$baseUrl}/chat" : "{$baseUrl}/generate";

        // Format the request based on endpoint type
        if ($isChatModel) {
            // Chat endpoint
            $payload = [
                'model' => $model->id,
                'message' => $prompt,
                'temperature' => $temperature,
                'max_tokens' => $maxTokens,
            ];

            // Add system prompt if available
            if ($contextData && isset($contextData['systemPrompt'])) {
                $payload['preamble'] = $contextData['systemPrompt'];
            }

            // Add knowledge base context if available
            if (!empty($knowledgeResults)) {
                $knowledgeContext = $this->formatKnowledgeBaseContext($knowledgeResults);
                $payload['documents'] = array_map(function($result) {
                    return [
                        'title' => $result['title'] ?? '',
                        'snippet' => $result['content'] ?? $result['text'] ?? '',
                    ];
                }, $knowledgeResults);
            }
        } else {
            // Generate endpoint
            $formattedPrompt = $prompt;

            // Add system prompt if available
            if ($contextData && isset($contextData['systemPrompt'])) {
                $formattedPrompt = $contextData['systemPrompt'] . "\n\n" . $prompt;
            }

            // Add knowledge base context if available
            if (!empty($knowledgeResults)) {
                $knowledgeContext = $this->formatKnowledgeBaseContext($knowledgeResults);
                $formattedPrompt = $knowledgeContext . "\n\n" . $formattedPrompt;
            }

            $payload = [
                'model' => $model->id,
                'prompt' => $formattedPrompt,
                'temperature' => $temperature,
                'max_tokens' => $maxTokens,
            ];
        }

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$apiKey}",
            'Content-Type' => 'application/json',
        ])->post($url, $payload);

        if ($response->failed()) {
            $error = $response->json();
            Log::error('Cohere API Error', ['error' => $error]);
            throw new \Exception('Cohere API Error: ' . ($error['message'] ?? 'Unknown error'));
        }

        $cohereResponse = $response->json();

        // Transform Cohere response to match OpenAI format for consistency
        if ($isChatModel) {
            $content = $cohereResponse['text'] ?? '';
            $promptTokens = $cohereResponse['meta']['prompt_tokens'] ?? 0;
            $completionTokens = $cohereResponse['meta']['response_tokens'] ?? 0;
        } else {
            $content = $cohereResponse['generations'][0]['text'] ?? '';
            $promptTokens = $cohereResponse['meta']['prompt_tokens'] ?? 0;
            $completionTokens = $cohereResponse['meta']['completion_tokens'] ?? 0;
        }

        return [
            'id' => $cohereResponse['id'] ?? Str::uuid()->toString(),
            'object' => 'chat.completion',
            'created' => now()->timestamp,
            'model' => $model->id,
            'choices' => [
                [
                    'index' => 0,
                    'message' => [
                        'role' => 'assistant',
                        'content' => $content,
                    ],
                    'finish_reason' => 'stop',
                ],
            ],
            'usage' => [
                'prompt_tokens' => $promptTokens,
                'completion_tokens' => $completionTokens,
                'total_tokens' => $promptTokens + $completionTokens,
            ],
        ];
    }

    /**
     * Check if a string is valid JSON
     */
    private function isValidJson(string $string): bool
    {
        json_decode($string);
        return json_last_error() === JSON_ERROR_NONE;
    }

    /**
     * Log an AI interaction
     */
    private function logInteraction(array $data): void
    {
        try {
            $data['id'] = $data['id'] ?? (string) Str::uuid();
            AIInteractionLog::create($data);
        } catch (\Exception $e) {
            Log::error('Failed to log AI interaction', [
                'error' => $e->getMessage(),
                'data' => $data,
            ]);
        }
    }

    /**
     * Create a log entry for an AI interaction
     */
    public function createLog(array $data): JsonResponse
    {
        try {
            $log = new AIInteractionLog();
            $log->id = (string) Str::uuid();
            $log->user_id = $data['userId'];
            $log->model_used = $data['modelUsed'];
            $log->query = $data['query'];
            $log->response = $data['response'];
            $log->context_rule_id = $data['contextRuleId'] ?? null;
            $log->knowledge_base_results = $data['knowledgeBaseResults'] ?? null;
            $log->knowledge_base_ids = $data['knowledgeBaseIds'] ?? null;
            $log->prompt_tokens = $data['promptTokens'] ?? null;
            $log->completion_tokens = $data['completionTokens'] ?? null;
            $log->total_tokens = $data['totalTokens'] ?? null;
            $log->latency_ms = $data['latencyMs'] ?? null;
            $log->success = $data['success'] ?? true;
            $log->metadata = $data['metadata'] ?? null;
            $log->ip_address = request()->ip();
            $log->user_agent = request()->userAgent();
            $log->save();

            return response()->json(['id' => $log->id], 201);
        } catch (\Exception $e) {
            Log::error('Failed to create AI log', [
                'error' => $e->getMessage(),
                'data' => $data,
            ]);
            return response()->json(['message' => 'Failed to create AI log'], 500);
        }
    }

    /**
     * Set the default AI model
     */
    public function setDefaultModel(string $modelId): JsonResponse
    {
        try {
            $model = AIModel::find($modelId);
            if (!$model) {
                return response()->json(['message' => 'Model not found'], 404);
            }

            // Reset all default flags
            AIModel::where('is_default', true)->update(['is_default' => false]);

            // Set new default
            $model->is_default = true;
            $model->save();

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error('Failed to set default AI model', [
                'error' => $e->getMessage(),
                'model_id' => $modelId,
            ]);
            return response()->json(['message' => 'Failed to set default AI model'], 500);
        }
    }

    /**
     * Process a user query with the AI model, including follow-up integration
     */
    public function processQueryWithFollowUps(string $query, ?string $userId = null, ?string $contextRuleId = null, ?string $followUpConfigId = null): array
    {
        // First process the regular AI query
        $response = $this->processQuery($query, $userId, $contextRuleId);

        // Then, if follow-up config is specified, generate follow-up questions
        if ($followUpConfigId) {
            $followUpConfig = FollowUpConfig::find($followUpConfigId);

            // If no specific config ID was provided, try to find the default one
            if (!$followUpConfig) {
                $followUpConfig = FollowUpConfig::where('is_default', true)->first();
            }

            if ($followUpConfig && $followUpConfig->enable_follow_up_questions) {
                $followUps = $this->generateFollowUpQuestions(
                    $query,
                    $response['ai_response'],
                    $followUpConfig
                );

                // Add follow-up questions to the response
                $response['follow_up_questions'] = $followUps;
                $response['follow_up_config'] = $followUpConfig->id;
            }
        }

        return $response;
    }

    /**
     * Generate follow-up questions based on query and AI response
     */
    public function generateFollowUpQuestions(string $query, string $aiResponse, FollowUpConfig $config): array
    {
        // If automatic generation is off, return predefined questions
        if (!$config->generate_automatically) {
            return $config->questions()
                ->where('is_active', true)
                ->orderBy('priority', 'desc')
                ->orderBy('display_order')
                ->limit($config->max_follow_up_questions)
                ->get()
                ->toArray();
        }

        // For automatic generation, we would normally use the AI model
        // to generate contextually relevant questions
        // Here we'll use a simple heuristic approach for now

        $generatedQuestions = [];
        $keywords = ['how', 'what', 'why', 'when', 'where'];
        $queryWords = explode(' ', strtolower($query));

        foreach ($keywords as $keyword) {
            if (in_array($keyword, $queryWords)) {
                $generatedQuestions[] = $this->createFollowUpQuestion($keyword, $query);

                if (count($generatedQuestions) >= $config->max_follow_up_questions) {
                    break;
                }
            }
        }

        // If we didn't generate enough questions, add some generic ones
        if (count($generatedQuestions) < $config->max_follow_up_questions) {
            $genericQuestions = [
                'Would you like me to explain any part of this in more detail?',
                'Is there anything specific you want to know about this topic?',
                'Do you need additional information on this subject?',
                'Would you like examples related to this topic?',
                'Is there a specific aspect of this you want to focus on?'
            ];

            $neededCount = min($config->max_follow_up_questions - count($generatedQuestions), count($genericQuestions));

            for ($i = 0; $i < $neededCount; $i++) {
                $generatedQuestions[] = [
                    'id' => (string) Str::uuid(),
                    'question' => $genericQuestions[$i],
                    'display_position' => 'end',
                    'priority' => 'medium',
                ];
            }
        }

        return $generatedQuestions;
    }

    /**
     * Create a follow-up question based on keyword and original query
     */
    private function createFollowUpQuestion(string $keyword, string $query): array
    {
        $question = '';
        $priority = 'medium';

        switch ($keyword) {
            case 'how':
                $question = 'Would you like more detailed steps on this process?';
                $priority = 'high';
                break;
            case 'what':
                $question = 'Do you want examples of this concept?';
                $priority = 'medium';
                break;
            case 'why':
                $question = 'Would you like me to explain the reasoning in more detail?';
                $priority = 'high';
                break;
            case 'when':
                $question = 'Do you need more specific timing information?';
                $priority = 'medium';
                break;
            case 'where':
                $question = 'Would you like more location-specific details?';
                $priority = 'medium';
                break;
            default:
                $question = 'Would you like to know more about this topic?';
                $priority = 'low';
        }

        return [
            'id' => (string) Str::uuid(),
            'question' => $question,
            'display_position' => 'end',
            'priority' => $priority,
        ];
    }

    /**
     * Process a selected follow-up question
     */
    public function processFollowUpQuestion(string $selectedQuestion, string $previousQuery, string $aiResponse, ?string $userId = null): array
    {
        // Create a new prompt that includes the context of the previous exchange
        $followUpPrompt = "Previous question: {$previousQuery}\n" .
                          "Previous answer: {$aiResponse}\n" .
                          "Follow-up question: {$selectedQuestion}";

        // Process this follow-up prompt with the AI
        return $this->processQuery($followUpPrompt, $userId);
    }

    /**
     * Search knowledge bases for relevant information
     */
    public function searchKnowledgeBases(string $query, ?array $knowledgeBaseIds = null): array
    {
        try {
            $user = auth()->user();

            // Query to get bases accessible to the user
            $basesQuery = KnowledgeBase::where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhere('is_public', true);
            })
            ->where('is_active', true);

            // Filter by specific knowledge bases if provided
            if ($knowledgeBaseIds) {
                $basesQuery->whereIn('id', $knowledgeBaseIds);
            }

            $accessibleBaseIds = $basesQuery->pluck('id')->toArray();

            if (empty($accessibleBaseIds)) {
                return [];
            }

            // Use the new VectorSearchService for improved semantic search
            $vectorSearchService = app(\App\Services\KnowledgeBase\VectorSearch\VectorSearchService::class);

            // First try hybrid search (combining vector and keyword search)
            if (strlen($query) > 5) {
                $results = [];
                $limit = 5; // Limit to top 5 most relevant results

                // Perform hybrid search for each knowledge base
                foreach ($accessibleBaseIds as $baseId) {
                    $knowledgeBase = KnowledgeBase::find($baseId);
                    if (!$knowledgeBase) continue;

                    // Use the knowledge base's specific settings
                    $minSimilarity = $knowledgeBase->similarity_threshold ?? 0.7;

                    // Check if hybrid search is enabled for this knowledge base
                    if ($knowledgeBase->use_hybrid_search ?? true) {
                        $vectorResults = $vectorSearchService->hybridSearch(
                            $query,
                            $knowledgeBase,
                            $limit,
                            $minSimilarity,
                            $knowledgeBase->vector_search_weight ?? 70,
                            $knowledgeBase->keyword_search_weight ?? 30
                        );
                    } else {
                        // Fallback to vector-only search if hybrid is disabled
                        $vectorResults = $vectorSearchService->vectorSearch(
                            $query,
                            $knowledgeBase,
                            $limit,
                            $minSimilarity
                        );
                    }

                    // Merge results from this knowledge base
                    foreach ($vectorResults as $entry) {
                        $results[] = [
                            'id' => $entry->id,
                            'title' => $entry->title,
                            'content' => $entry->content,
                            'summary' => $entry->summary,
                            'source_url' => $entry->source_url,
                            'source_type' => $entry->source_type,
                            'similarity_score' => $entry->similarity_score,
                            'knowledge_base' => [
                                'id' => $entry->knowledge_base_id,
                                'name' => $knowledgeBase->name,
                                'source_type' => $knowledgeBase->source_type,
                            ],
                        ];
                    }
                }

                // Sort results by similarity score and take the top ones
                if (!empty($results)) {
                    usort($results, function($a, $b) {
                        return $b['similarity_score'] <=> $a['similarity_score'];
                    });

                    return array_slice($results, 0, $limit);
                }
            }

            // Fall back to traditional full-text search if vector search didn't yield results
            $entries = KnowledgeEntry::whereIn('knowledge_base_id', $accessibleBaseIds)
                ->where('is_active', true)
                ->whereFullText(['title', 'content'], $query)
                ->with('knowledgeBase:id,name,source_type')
                ->orderByRaw('MATCH(title, content) AGAINST(? IN BOOLEAN MODE) DESC', [$query])
                ->limit(5) // Limit to top 5 most relevant results
                ->get();

            $results = [];
            foreach ($entries as $entry) {
                $results[] = [
                    'id' => $entry->id,
                    'title' => $entry->title,
                    'content' => $entry->formatted_content ?? $entry->content,
                    'summary' => $entry->summary,
                    'source_url' => $entry->source_url,
                    'source_type' => $entry->source_type,
                    'knowledge_base' => [
                        'id' => $entry->knowledgeBase->id,
                        'name' => $entry->knowledgeBase->name,
                        'source_type' => $entry->knowledgeBase->source_type,
                    ],
                ];
            }

            return $results;
        } catch (\Exception $e) {
            Log::error('Error searching knowledge bases', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'query' => $query,
            ]);
            return [];
        }
    }

    /**
     * Format knowledge base results into context for AI prompts
     * This is a public method to allow other services to format knowledge base context without duplicating code
     */
    public function formatKnowledgeBaseContext(array $knowledgeResults): string
    {
        if (empty($knowledgeResults)) {
            return '';
        }

        $knowledgeContext = "I am providing you with some relevant information from my knowledge base. Please use this information to help answer the user's question if applicable:\n\n";

        foreach ($knowledgeResults as $index => $result) {
            $knowledgeContext .= "--- Information #{$index} from {$result['knowledge_base']['name']} ---\n";
            $knowledgeContext .= "Title: {$result['title']}\n";
            $knowledgeContext .= "Content: {$result['content']}\n";

            if (!empty($result['source_url'])) {
                $knowledgeContext .= "Source: {$result['source_url']}\n";
            }

            if (!empty($result['similarity_score'])) {
                $confidence = number_format($result['similarity_score'] * 100, 1);
                $knowledgeContext .= "Relevance: {$confidence}%\n";
            }

            $knowledgeContext .= "---\n\n";
        }

        $knowledgeContext .= "When referencing this information in your response, please cite the source as [Knowledge Base #X] where X is the information number.\n";
        $knowledgeContext .= "If the provided information doesn't fully answer the query, use your general knowledge to supplement it.\n";

        return $knowledgeContext;
    }
}
