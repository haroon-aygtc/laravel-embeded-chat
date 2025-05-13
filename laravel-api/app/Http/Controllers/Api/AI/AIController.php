<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\AI;

use App\Http\Controllers\Controller;
use App\Services\AI\AIService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AIController extends Controller
{
    public function __construct(private readonly AIService $aiService) {}

    /**
     * Generate a response from AI
     */
    public function generate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'prompt' => 'required|string',
            'model' => 'sometimes|string',
            'temperature' => 'sometimes|numeric|min:0|max:2',
            'maxTokens' => 'sometimes|integer|min:1|max:4096',
            'contextRuleId' => 'sometimes|string',
            'knowledgeBaseIds' => 'sometimes|array',
            'contextData' => 'sometimes|array',
            'metadata' => 'sometimes|array',
        ]);

        return $this->aiService->generate($validated);
    }

    /**
     * Stream a response from AI
     */
    public function streamGenerate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'prompt' => 'required|string',
            'model' => 'sometimes|string',
            'temperature' => 'sometimes|numeric|min:0|max:2',
            'maxTokens' => 'sometimes|integer|min:1|max:4096',
            'contextRuleId' => 'sometimes|string',
            'knowledgeBaseIds' => 'sometimes|array',
            'contextData' => 'sometimes|array',
            'metadata' => 'sometimes|array',
        ]);

        return $this->aiService->streamGenerate($validated);
    }

    /**
     * Get available AI models
     */
    public function getModels(): JsonResponse
    {
        return $this->aiService->getModels();
    }

    /**
     * Get a specific AI model by ID
     */
    public function getModel(string $id): JsonResponse
    {
        return $this->aiService->getModel($id);
    }

    /**
     * Get the default AI model
     */
    public function getDefaultModel(): JsonResponse
    {
        return $this->aiService->getDefaultModel();
    }

    /**
     * Set the default AI model
     */
    public function setDefaultModel(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'modelId' => 'required|string',
        ]);

        return $this->aiService->setDefaultModel($validated['modelId']);
    }

    /**
     * Get AI interaction logs
     */
    public function getLogs(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'page' => 'sometimes|integer|min:1',
            'perPage' => 'sometimes|integer|min:1|max:100',
            'userId' => 'sometimes|integer',
            'modelUsed' => 'sometimes|string',
            'contextRuleId' => 'sometimes|string',
            'startDate' => 'sometimes|date',
            'endDate' => 'sometimes|date',
            'query' => 'sometimes|string',
        ]);

        return $this->aiService->getLogs($validated);
    }

    /**
     * Get a specific AI interaction log
     */
    public function getLog(string $id): JsonResponse
    {
        return $this->aiService->getLog($id);
    }

    /**
     * Create a log entry for an AI interaction
     */
    public function createLog(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'userId' => 'required|exists:users,id',
            'query' => 'required|string',
            'response' => 'required|string',
            'modelUsed' => 'required|string',
            'contextRuleId' => 'sometimes|string',
            'knowledgeBaseResults' => 'sometimes|integer',
            'knowledgeBaseIds' => 'sometimes|array',
            'promptTokens' => 'sometimes|integer',
            'completionTokens' => 'sometimes|integer',
            'totalTokens' => 'sometimes|integer',
            'latencyMs' => 'sometimes|integer',
            'success' => 'sometimes|boolean',
            'metadata' => 'sometimes|array',
        ]);

        return $this->aiService->createLog($validated);
    }

    /**
     * Get AI performance metrics
     */
    public function getPerformance(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'timeRange' => 'sometimes|string|in:7d,30d,90d,365d',
        ]);

        return $this->aiService->getPerformance($validated['timeRange'] ?? '7d');
    }

    /**
     * Get AI cache status
     */
    public function getCache(): JsonResponse
    {
        return $this->aiService->getCache();
    }

    /**
     * Get a specific item from the AI cache
     */
    public function getCacheItem(string $id): JsonResponse
    {
        return $this->aiService->getCacheItem($id);
    }

    /**
     * Clear the AI cache
     */
    public function clearCache(): JsonResponse
    {
        return $this->aiService->clearCache();
    }

    /**
     * Get prompt templates
     */
    public function getPromptTemplates(): JsonResponse
    {
        return $this->aiService->getPromptTemplates();
    }

    /**
     * Get a specific prompt template
     */
    public function getPromptTemplate(string $id): JsonResponse
    {
        return $this->aiService->getPromptTemplate($id);
    }

    /**
     * Create a prompt template
     */
    public function createPromptTemplate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'sometimes|string',
            'content' => 'required|string',
            'category' => 'sometimes|string',
            'isPublic' => 'sometimes|boolean',
            'isDefault' => 'sometimes|boolean',
            'metadata' => 'sometimes|array',
        ]);

        return $this->aiService->createPromptTemplate($validated);
    }

    /**
     * Update a prompt template
     */
    public function updatePromptTemplate(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'content' => 'sometimes|string',
            'category' => 'sometimes|string',
            'isPublic' => 'sometimes|boolean',
            'isDefault' => 'sometimes|boolean',
            'metadata' => 'sometimes|array',
        ]);

        return $this->aiService->updatePromptTemplate($id, $validated);
    }

    /**
     * Delete a prompt template
     */
    public function deletePromptTemplate(string $id): JsonResponse
    {
        return $this->aiService->deletePromptTemplate($id);
    }
}
