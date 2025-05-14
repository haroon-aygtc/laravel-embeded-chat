<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\KnowledgeBase;

use App\Http\Controllers\Controller;
use App\Services\KnowledgeBase\KnowledgeBaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class KnowledgeBaseConfigController extends Controller
{
    /**
     * The knowledge base service instance.
     */
    protected KnowledgeBaseService $knowledgeBaseService;

    /**
     * Create a new controller instance.
     */
    public function __construct(KnowledgeBaseService $knowledgeBaseService)
    {
        $this->knowledgeBaseService = $knowledgeBaseService;
    }

    /**
     * Get all knowledge base configurations.
     */
    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
            'sort_by' => 'nullable|string|in:name,created_at,updated_at',
            'sort_direction' => 'nullable|string|in:asc,desc',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Extract parameters with defaults
        $page = $request->input('page', 1);
        $perPage = $request->input('per_page', 15);
        $sortBy = $request->input('sort_by', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');

        return $this->knowledgeBaseService->getAllConfigs(
            $page,
            $perPage,
            $sortBy,
            $sortDirection
        );
    }

    /**
     * Get a specific knowledge base configuration.
     */
    public function show(string $id): JsonResponse
    {
        return $this->knowledgeBaseService->getConfig(Auth::user(), $id);
    }

    /**
     * Create a new knowledge base configuration.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|string|in:api,database,cms,vector,file',
            'endpoint' => 'nullable|string',
            'connectionString' => 'nullable|string',
            'apiKey' => 'nullable|string',
            'refreshInterval' => 'nullable|integer|min:1',
            'parameters' => 'nullable|array',
            'isActive' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        return $this->knowledgeBaseService->createConfig(Auth::user(), $request->all());
    }

    /**
     * Update a knowledge base configuration.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'sometimes|required|string|in:api,database,cms,vector,file',
            'endpoint' => 'nullable|string',
            'connectionString' => 'nullable|string',
            'apiKey' => 'nullable|string',
            'refreshInterval' => 'nullable|integer|min:1',
            'parameters' => 'nullable|array',
            'isActive' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        return $this->knowledgeBaseService->updateConfig(Auth::user(), $id, $request->all());
    }

    /**
     * Delete a knowledge base configuration.
     */
    public function destroy(string $id): JsonResponse
    {
        return $this->knowledgeBaseService->deleteConfig(Auth::user(), $id);
    }

    /**
     * Sync a knowledge base with its source.
     */
    public function sync(string $id): JsonResponse
    {
        return $this->knowledgeBaseService->syncKnowledgeBase(Auth::user(), $id);
    }

    /**
     * Test a knowledge base query.
     */
    public function testQuery(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'query' => 'required|string',
            'limit' => 'nullable|integer|min:1|max:50',
            'contextRuleId' => 'nullable|string|exists:context_rules,id',
            'userId' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        return $this->knowledgeBaseService->query(Auth::user(), $request->all());
    }
}
