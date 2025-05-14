<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\KnowledgeBase;

use App\Http\Controllers\Controller;
use App\Models\AI\KnowledgeBase;
use App\Models\AI\KnowledgeEntry;
use App\Models\User;
use App\Services\KnowledgeBase\VectorSearch\VectorSearchService;
use App\Services\KnowledgeBase\VectorSearch\ContentChunkingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class VectorSearchController extends Controller
{
    protected VectorSearchService $vectorSearchService;
    protected ContentChunkingService $contentChunkingService;

    /**
     * Create a new controller instance.
     */
    public function __construct(
        VectorSearchService $vectorSearchService,
        ContentChunkingService $contentChunkingService
    ) {
        $this->vectorSearchService = $vectorSearchService;
        $this->contentChunkingService = $contentChunkingService;
    }

    /**
     * Perform semantic search using vector similarity.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function semanticSearch(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'query' => 'required|string|min:3',
                'knowledge_base_id' => 'sometimes|string|uuid',
                'limit' => 'sometimes|integer|min:1|max:50',
                'min_similarity' => 'sometimes|numeric|min:0|max:1',
            ]);

            /** @var User $user */
            $user = Auth::user();
            
            // Get parameters
            $query = $request->input('query');
            $knowledgeBaseId = $request->input('knowledge_base_id');
            $limit = (int) $request->input('limit', 10);
            $minSimilarity = $request->has('min_similarity') 
                ? (float) $request->input('min_similarity') 
                : null;
            
            // If knowledge base ID is provided, check access
            if ($knowledgeBaseId) {
                $knowledgeBase = KnowledgeBase::where('id', $knowledgeBaseId)
                    ->where(function ($q) use ($user) {
                        $q->where('user_id', $user->id)
                          ->orWhere('is_public', true);
                    })
                    ->first();
                
                if (!$knowledgeBase) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Knowledge base not found or access denied'
                    ], 404);
                }
            }
            
            // Perform vector search
            $results = $this->vectorSearchService->vectorSearch(
                $query,
                $knowledgeBaseId,
                $limit,
                $minSimilarity
            );
            
            // Format results for API response
            $formattedResults = $results->map(function ($entry) {
                return [
                    'id' => $entry->id,
                    'knowledge_base_id' => $entry->knowledge_base_id,
                    'title' => $entry->title,
                    'content' => $entry->content,
                    'source_url' => $entry->source_url,
                    'source_type' => $entry->source_type,
                    'summary' => $entry->summary,
                    'tags' => $entry->tags,
                    'similarity_score' => $entry->similarity_score,
                    'metadata' => $entry->metadata,
                    'created_at' => $entry->created_at,
                    'updated_at' => $entry->updated_at,
                    'parent_entry_id' => $entry->parent_entry_id,
                ];
            });
            
            return response()->json([
                'success' => true,
                'query' => $query,
                'total' => $results->count(),
                'results' => $formattedResults
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error performing semantic search', [
                'query' => $request->input('query'),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to perform semantic search: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Perform hybrid search combining vector similarity and keyword search.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function hybridSearch(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'query' => 'required|string|min:3',
                'knowledge_base_id' => 'sometimes|string|uuid',
                'limit' => 'sometimes|integer|min:1|max:50',
                'min_similarity' => 'sometimes|numeric|min:0|max:1',
                'vector_weight' => 'sometimes|integer|min:0|max:100',
                'keyword_weight' => 'sometimes|integer|min:0|max:100',
            ]);

            /** @var User $user */
            $user = Auth::user();
            
            // Get parameters
            $query = $request->input('query');
            $knowledgeBaseId = $request->input('knowledge_base_id');
            $limit = (int) $request->input('limit', 10);
            $minSimilarity = $request->has('min_similarity') 
                ? (float) $request->input('min_similarity') 
                : null;
            $vectorWeight = $request->has('vector_weight') 
                ? (int) $request->input('vector_weight') 
                : null;
            $keywordWeight = $request->has('keyword_weight') 
                ? (int) $request->input('keyword_weight') 
                : null;
            
            // If knowledge base ID is provided, check access
            if ($knowledgeBaseId) {
                $knowledgeBase = KnowledgeBase::where('id', $knowledgeBaseId)
                    ->where(function ($q) use ($user) {
                        $q->where('user_id', $user->id)
                          ->orWhere('is_public', true);
                    })
                    ->first();
                
                if (!$knowledgeBase) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Knowledge base not found or access denied'
                    ], 404);
                }
            }
            
            // Perform hybrid search
            $results = $this->vectorSearchService->hybridSearch(
                $query,
                $knowledgeBaseId,
                $limit,
                $minSimilarity,
                $vectorWeight,
                $keywordWeight
            );
            
            // Format results for API response
            $formattedResults = $results->map(function ($entry) {
                return [
                    'id' => $entry->id,
                    'knowledge_base_id' => $entry->knowledge_base_id,
                    'title' => $entry->title,
                    'content' => $entry->content,
                    'source_url' => $entry->source_url,
                    'source_type' => $entry->source_type,
                    'summary' => $entry->summary,
                    'tags' => $entry->tags,
                    'similarity_score' => $entry->similarity_score,
                    'metadata' => $entry->metadata,
                    'created_at' => $entry->created_at,
                    'updated_at' => $entry->updated_at,
                    'parent_entry_id' => $entry->parent_entry_id,
                ];
            });
            
            return response()->json([
                'success' => true,
                'query' => $query,
                'total' => $results->count(),
                'results' => $formattedResults
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error performing hybrid search', [
                'query' => $request->input('query'),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to perform hybrid search: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Generate embeddings for a specific knowledge entry.
     *
     * @param Request $request
     * @param string $entryId
     * @return JsonResponse
     */
    public function generateEmbeddings(Request $request, string $entryId): JsonResponse
    {
        try {
            /** @var User $user */
            $user = Auth::user();
            
            // Find the entry
            $entry = KnowledgeEntry::with('knowledgeBase')
                ->where('id', $entryId)
                ->first();
            
            if (!$entry) {
                return response()->json([
                    'success' => false,
                    'message' => 'Knowledge entry not found'
                ], 404);
            }
            
            // Check access to the knowledge base
            if ($entry->knowledgeBase->user_id !== $user->id && !$entry->knowledgeBase->is_public) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied to this knowledge entry'
                ], 403);
            }
            
            // Force regeneration if requested
            $force = $request->input('force', false);
            
            // Generate embeddings
            $success = $this->vectorSearchService->generateEmbeddings($entry, $force);
            
            if (!$success) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to generate embeddings'
                ], 500);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Embeddings generated successfully',
                'entry_id' => $entry->id,
                'knowledge_base_id' => $entry->knowledge_base_id,
                'vector_indexed' => $entry->vector_indexed
            ]);
        } catch (\Exception $e) {
            Log::error('Error generating embeddings', [
                'entry_id' => $entryId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate embeddings: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Generate embeddings for all entries in a knowledge base.
     *
     * @param Request $request
     * @param string $knowledgeBaseId
     * @return JsonResponse
     */
    public function generateEmbeddingsForKnowledgeBase(Request $request, string $knowledgeBaseId): JsonResponse
    {
        try {
            /** @var User $user */
            $user = Auth::user();
            
            // Find the knowledge base
            $knowledgeBase = KnowledgeBase::where('id', $knowledgeBaseId)
                ->where('user_id', $user->id)
                ->first();
            
            if (!$knowledgeBase) {
                return response()->json([
                    'success' => false,
                    'message' => 'Knowledge base not found or access denied'
                ], 404);
            }
            
            // Get parameters
            $force = $request->input('force', false);
            $onlyUnindexed = $request->input('only_unindexed', true);
            
            // Get entries to process
            $query = KnowledgeEntry::where('knowledge_base_id', $knowledgeBaseId)
                ->where('is_active', true);
            
            if ($onlyUnindexed && !$force) {
                $query->where(function ($q) {
                    $q->whereNull('vector_embedding')
                      ->orWhere('vector_indexed', false);
                });
            }
            
            $entries = $query->get();
            
            if ($entries->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'message' => 'No entries found that need embeddings',
                    'processed' => 0,
                    'total' => 0
                ]);
            }
            
            // Process in batches to avoid memory issues
            $batchSize = 10;
            $totalProcessed = 0;
            $totalSuccess = 0;
            
            for ($i = 0; $i < $entries->count(); $i += $batchSize) {
                $batch = $entries->slice($i, $batchSize);
                $results = $this->vectorSearchService->batchGenerateEmbeddings($batch, $force);
                
                $totalProcessed += count($results);
                $totalSuccess += count(array_filter($results));
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Embeddings generation process completed',
                'knowledge_base_id' => $knowledgeBaseId,
                'processed' => $totalProcessed,
                'successful' => $totalSuccess,
                'total' => $entries->count()
            ]);
        } catch (\Exception $e) {
            Log::error('Error generating embeddings for knowledge base', [
                'knowledge_base_id' => $knowledgeBaseId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate embeddings: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Chunk content for a specific knowledge entry.
     *
     * @param Request $request
     * @param string $entryId
     * @return JsonResponse
     */
    public function chunkEntry(Request $request, string $entryId): JsonResponse
    {
        try {
            /** @var User $user */
            $user = Auth::user();
            
            // Find the entry
            $entry = KnowledgeEntry::with('knowledgeBase')
                ->where('id', $entryId)
                ->first();
            
            if (!$entry) {
                return response()->json([
                    'success' => false,
                    'message' => 'Knowledge entry not found'
                ], 404);
            }
            
            // Check access to the knowledge base
            if ($entry->knowledgeBase->user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied to this knowledge entry'
                ], 403);
            }
            
            // Get parameters
            $force = $request->input('force', false);
            
            // Check if entry already has chunks
            $hasChunks = isset($entry->metadata['has_chunks']) && $entry->metadata['has_chunks'] === true;
            
            if ($hasChunks && !$force) {
                return response()->json([
                    'success' => true,
                    'message' => 'Entry already has chunks. Use force=true to rechunk.',
                    'chunks' => $entry->metadata['chunk_count'] ?? 0
                ]);
            }
            
            // Chunk the entry
            $chunks = $this->contentChunkingService->chunkEntry($entry);
            
            if ($chunks->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No chunks created. Content may be too small or chunking disabled.'
                ]);
            }
            
            // Generate embeddings for chunks if auto-embedding is enabled
            if ($entry->knowledgeBase->auto_embedding ?? false) {
                $this->vectorSearchService->batchGenerateEmbeddings($chunks);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Entry chunked successfully',
                'entry_id' => $entry->id,
                'knowledge_base_id' => $entry->knowledge_base_id,
                'chunks_created' => $chunks->count(),
                'chunks' => $chunks->map(function ($chunk) {
                    return [
                        'id' => $chunk->id,
                        'title' => $chunk->title,
                        'chunk_index' => $chunk->chunk_index,
                        'content_length' => strlen($chunk->content)
                    ];
                })
            ]);
        } catch (\Exception $e) {
            Log::error('Error chunking entry', [
                'entry_id' => $entryId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to chunk entry: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Process all entries in a knowledge base for chunking.
     *
     * @param Request $request
     * @param string $knowledgeBaseId
     * @return JsonResponse
     */
    public function processKnowledgeBaseChunking(Request $request, string $knowledgeBaseId): JsonResponse
    {
        try {
            /** @var User $user */
            $user = Auth::user();
            
            // Find the knowledge base
            $knowledgeBase = KnowledgeBase::where('id', $knowledgeBaseId)
                ->where('user_id', $user->id)
                ->first();
            
            if (!$knowledgeBase) {
                return response()->json([
                    'success' => false,
                    'message' => 'Knowledge base not found or access denied'
                ], 404);
            }
            
            // Get parameters
            $force = $request->input('force', false);
            
            // Process the knowledge base
            $result = $this->contentChunkingService->processKnowledgeBase($knowledgeBase, $force);
            
            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $result['message'] ?? 'Failed to process knowledge base for chunking'
                ], 500);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Knowledge base processed for chunking',
                'knowledge_base_id' => $knowledgeBaseId,
                'processed' => $result['processed'],
                'total' => $result['total'],
                'details' => $result
            ]);
        } catch (\Exception $e) {
            Log::error('Error processing knowledge base for chunking', [
                'knowledge_base_id' => $knowledgeBaseId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to process knowledge base: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Update vector search settings for a knowledge base.
     *
     * @param Request $request
     * @param string $knowledgeBaseId
     * @return JsonResponse
     */
    public function updateVectorSearchSettings(Request $request, string $knowledgeBaseId): JsonResponse
    {
        try {
            $request->validate([
                'similarity_threshold' => 'sometimes|numeric|min:0|max:1',
                'embedding_model' => 'sometimes|string|max:255',
                'use_hybrid_search' => 'sometimes|boolean',
                'keyword_search_weight' => 'sometimes|integer|min:0|max:100',
                'vector_search_weight' => 'sometimes|integer|min:0|max:100',
                'auto_chunk_content' => 'sometimes|boolean',
                'chunk_size' => 'sometimes|integer|min:100|max:2048',
                'chunk_overlap' => 'sometimes|integer|min:0|max:500',
            ]);

            /** @var User $user */
            $user = Auth::user();
            
            // Find the knowledge base
            $knowledgeBase = KnowledgeBase::where('id', $knowledgeBaseId)
                ->where('user_id', $user->id)
                ->first();
            
            if (!$knowledgeBase) {
                return response()->json([
                    'success' => false,
                    'message' => 'Knowledge base not found or access denied'
                ], 404);
            }
            
            // Update settings
            $fields = [
                'similarity_threshold',
                'embedding_model',
                'use_hybrid_search',
                'keyword_search_weight',
                'vector_search_weight',
                'auto_chunk_content',
                'chunk_size',
                'chunk_overlap'
            ];
            
            foreach ($fields as $field) {
                if ($request->has($field)) {
                    $knowledgeBase->{$field} = $request->input($field);
                }
            }
            
            // Additional configuration as JSON
            if ($request->has('vector_search_config')) {
                $config = $request->input('vector_search_config');
                $knowledgeBase->vector_search_config = is_array($config) ? $config : json_decode($config, true);
            }
            
            // Save changes
            $knowledgeBase->save();
            
            return response()->json([
                'success' => true,
                'message' => 'Vector search settings updated successfully',
                'knowledge_base_id' => $knowledgeBaseId,
                'settings' => [
                    'similarity_threshold' => $knowledgeBase->similarity_threshold,
                    'embedding_model' => $knowledgeBase->embedding_model,
                    'use_hybrid_search' => $knowledgeBase->use_hybrid_search,
                    'keyword_search_weight' => $knowledgeBase->keyword_search_weight,
                    'vector_search_weight' => $knowledgeBase->vector_search_weight,
                    'auto_chunk_content' => $knowledgeBase->auto_chunk_content,
                    'chunk_size' => $knowledgeBase->chunk_size,
                    'chunk_overlap' => $knowledgeBase->chunk_overlap,
                    'vector_search_config' => $knowledgeBase->vector_search_config
                ]
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error updating vector search settings', [
                'knowledge_base_id' => $knowledgeBaseId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update vector search settings: ' . $e->getMessage()
            ], 500);
        }
    }
} 