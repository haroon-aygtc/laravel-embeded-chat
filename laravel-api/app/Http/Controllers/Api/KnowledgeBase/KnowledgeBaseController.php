<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\KnowledgeBase;

use App\Http\Controllers\Controller;
use App\Services\KnowledgeBase\KnowledgeBaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class KnowledgeBaseController extends Controller
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
     * Get all knowledge bases for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
            'sort_by' => 'nullable|string|in:name,created_at,updated_at',
            'sort_direction' => 'nullable|string|in:asc,desc',
            'filter_by_public' => 'nullable|boolean',
            'filter_by_type' => 'nullable|string|in:manual,web,document,api',
            'search' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Extract parameters with defaults
        $page = $request->input('page', 1);
        $perPage = $request->input('per_page', 15);
        $sortBy = $request->input('sort_by', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');
        $filterByPublic = $request->has('filter_by_public') ? (bool)$request->input('filter_by_public') : null;
        $filterByType = $request->input('filter_by_type');
        $search = $request->input('search');

        return $this->knowledgeBaseService->getAllKnowledgeBases(
            Auth::user(),
            $page,
            $perPage,
            $sortBy,
            $sortDirection,
            $filterByPublic,
            $filterByType,
            $search
        );
    }

    /**
     * Get a specific knowledge base.
     */
    public function show(string $id): JsonResponse
    {
        return $this->knowledgeBaseService->getKnowledgeBase(Auth::user(), $id);
    }

    /**
     * Create a new knowledge base.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'source_type' => 'nullable|string|in:manual,web,document,api',
            'metadata' => 'nullable|array',
            'is_public' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        return $this->knowledgeBaseService->createKnowledgeBase(Auth::user(), $request->all());
    }

    /**
     * Update a knowledge base.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'source_type' => 'sometimes|required|string|in:manual,web,document,api',
            'metadata' => 'nullable|array',
            'is_public' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        return $this->knowledgeBaseService->updateKnowledgeBase(Auth::user(), $id, $request->all());
    }

    /**
     * Delete a knowledge base.
     */
    public function destroy(string $id): JsonResponse
    {
        return $this->knowledgeBaseService->deleteKnowledgeBase(Auth::user(), $id);
    }

    /**
     * Get entries from a knowledge base.
     */
    public function getEntries(Request $request, string $knowledgeBaseId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
            'sort_by' => 'nullable|string|in:title,created_at,updated_at',
            'sort_direction' => 'nullable|string|in:asc,desc',
            'filter_by_type' => 'nullable|string|in:text,html,pdf,image',
            'search' => 'nullable|string',
            'tags' => 'nullable|array',
            'tags.*' => 'string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Extract parameters with defaults
        $page = $request->input('page', 1);
        $perPage = $request->input('per_page', 20);
        $sortBy = $request->input('sort_by', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');
        $filterByType = $request->input('filter_by_type');
        $search = $request->input('search');
        $tags = $request->input('tags', []);

        return $this->knowledgeBaseService->getKnowledgeBaseEntries(
            Auth::user(),
            $knowledgeBaseId,
            $page,
            $perPage,
            $sortBy,
            $sortDirection,
            $filterByType,
            $search,
            $tags
        );
    }

    /**
     * Create a new entry in a knowledge base.
     */
    public function storeEntry(Request $request, string $knowledgeBaseId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'source_url' => 'nullable|url',
            'source_type' => 'nullable|string|in:text,html,pdf,image',
            'summary' => 'nullable|string',
            'tags' => 'nullable|array',
            'tags.*' => 'string',
            'metadata' => 'nullable|array',
            'is_active' => 'nullable|boolean',
            'generate_embeddings' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        return $this->knowledgeBaseService->createKnowledgeEntry(Auth::user(), $knowledgeBaseId, $request->all());
    }

    /**
     * Create multiple entries in a knowledge base.
     */
    public function storeBulkEntries(Request $request, string $knowledgeBaseId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'entries' => 'required|array|min:1',
            'entries.*.title' => 'required|string|max:255',
            'entries.*.content' => 'required|string',
            'entries.*.source_url' => 'nullable|url',
            'entries.*.source_type' => 'nullable|string|in:text,html,pdf,image',
            'entries.*.summary' => 'nullable|string',
            'entries.*.tags' => 'nullable|array',
            'entries.*.tags.*' => 'string',
            'entries.*.metadata' => 'nullable|array',
            'entries.*.is_active' => 'nullable|boolean',
            'entries.*.generate_embeddings' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        return $this->knowledgeBaseService->createBulkKnowledgeEntries(
            Auth::user(),
            $knowledgeBaseId,
            $request->input('entries')
        );
    }

    /**
     * Update a knowledge entry.
     */
    public function updateEntry(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'content' => 'sometimes|required|string',
            'source_url' => 'nullable|url',
            'source_type' => 'sometimes|required|string|in:text,html,pdf,image',
            'summary' => 'nullable|string',
            'tags' => 'nullable|array',
            'tags.*' => 'string',
            'metadata' => 'nullable|array',
            'is_active' => 'nullable|boolean',
            'regenerate_embeddings' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        return $this->knowledgeBaseService->updateKnowledgeEntry(Auth::user(), $id, $request->all());
    }

    /**
     * Delete a knowledge entry.
     */
    public function destroyEntry(string $id): JsonResponse
    {
        return $this->knowledgeBaseService->deleteKnowledgeEntry(Auth::user(), $id);
    }

    /**
     * Bulk delete knowledge entries.
     */
    public function bulkDestroyEntries(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'entry_ids' => 'required|array|min:1',
            'entry_ids.*' => 'string|uuid',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        return $this->knowledgeBaseService->bulkDeleteKnowledgeEntries(
            Auth::user(),
            $request->input('entry_ids')
        );
    }

    /**
     * Search across knowledge bases.
     */
    public function search(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'query' => 'required|string|min:3',
            'knowledge_base_ids' => 'nullable|array',
            'knowledge_base_ids.*' => 'string|uuid',
            'max_results' => 'nullable|integer|min:1|max:100',
            'filter_by_type' => 'nullable|string|in:text,html,pdf,image',
            'tags' => 'nullable|array',
            'tags.*' => 'string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        return $this->knowledgeBaseService->searchKnowledge(
            Auth::user(),
            $request->input('query'),
            $request->input('knowledge_base_ids'),
            $request->input('max_results', 50),
            $request->input('filter_by_type'),
            $request->input('tags', [])
        );
    }

    /**
     * Find similar entries.
     */
    public function findSimilar(Request $request, string $entryId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'limit' => 'nullable|integer|min:1|max:50',
            'min_similarity_score' => 'nullable|numeric|min:0|max:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $limit = $request->input('limit', 5);
        $minSimilarityScore = $request->input('min_similarity_score');

        return $this->knowledgeBaseService->findSimilarEntries(
            Auth::user(),
            $entryId,
            (int)$limit,
            $minSimilarityScore
        );
    }

    /**
     * Export knowledge base content as JSON.
     */
    public function export(string $id): JsonResponse
    {
        return $this->knowledgeBaseService->exportKnowledgeBase(Auth::user(), $id);
    }

    /**
     * Import knowledge base from JSON.
     */
    public function import(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'data' => 'required|array',
            'data.knowledge_base' => 'required|array',
            'data.entries' => 'required|array',
            'options' => 'nullable|array',
            'options.overwrite_existing' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->input('data');
        $options = $request->input('options', []);

        return $this->knowledgeBaseService->importKnowledgeBase(
            Auth::user(),
            $data,
            $options
        );
    }

    /**
     * Generate embeddings for all entries in a knowledge base.
     */
    public function generateEmbeddings(string $knowledgeBaseId): JsonResponse
    {
        return $this->knowledgeBaseService->generateEmbeddingsForKnowledgeBase(
            Auth::user(),
            $knowledgeBaseId
        );
    }
}
