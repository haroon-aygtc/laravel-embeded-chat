<?php

declare(strict_types=1);

namespace App\Services\KnowledgeBase;

use App\Models\AI\KnowledgeBase;
use App\Models\AI\KnowledgeEntry;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Storage;

class KnowledgeBaseService
{
    /**
     * Get all knowledge bases accessible to the user with filtering, sorting and pagination
     */
    public function getAllKnowledgeBases(
        User $user,
        int $page = 1,
        int $perPage = 15,
        string $sortBy = 'created_at',
        string $sortDirection = 'desc',
        ?bool $filterByPublic = null,
        ?string $filterByType = null,
        ?string $search = null
    ): JsonResponse {
        try {
            // Base query: Get bases owned by the user and public bases
            $query = KnowledgeBase::where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhere('is_public', true);
            })
            ->where('is_active', true);

            // Apply filters
            if ($filterByPublic !== null) {
                $query->where('is_public', $filterByPublic);
            }

            if ($filterByType !== null) {
                $query->where('source_type', $filterByType);
            }

            if ($search !== null) {
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            // Apply sorting
            $query->orderBy($sortBy, $sortDirection);

            // Apply pagination
            $knowledgeBases = $query->withCount('entries')
                ->paginate($perPage, ['*'], 'page', $page);

            return response()->json($knowledgeBases);
        } catch (\Exception $e) {
            Log::error('Failed to get knowledge bases', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
            ]);
            return response()->json(['message' => 'Failed to get knowledge bases'], 500);
        }
    }

    /**
     * Get a specific knowledge base.
     */
    public function getKnowledgeBase(User $user, string $id): JsonResponse
    {
        try {
            $knowledgeBase = KnowledgeBase::where('id', $id)
                ->where(function ($query) use ($user) {
                    $query->where('user_id', $user->id)
                          ->orWhere('is_public', true);
                })
                ->withCount('entries')
                ->first();

            if (!$knowledgeBase) {
                return response()->json(['message' => 'Knowledge base not found'], 404);
            }

            return response()->json($knowledgeBase);
        } catch (\Exception $e) {
            Log::error('Failed to get knowledge base', [
                'error' => $e->getMessage(),
                'id' => $id,
            ]);
            return response()->json(['message' => 'Failed to get knowledge base'], 500);
        }
    }

    /**
     * Create a new knowledge base.
     */
    public function createKnowledgeBase(User $user, array $data): JsonResponse
    {
        try {
            $knowledgeBase = new KnowledgeBase();
            $knowledgeBase->id = (string) Str::uuid();
            $knowledgeBase->user_id = $user->id;
            $knowledgeBase->name = $data['name'];
            $knowledgeBase->description = $data['description'] ?? null;
            $knowledgeBase->source_type = $data['source_type'] ?? 'manual';
            $knowledgeBase->metadata = $data['metadata'] ?? null;
            $knowledgeBase->is_public = $data['is_public'] ?? false;
            $knowledgeBase->is_active = $data['is_active'] ?? true;
            $knowledgeBase->save();

            return response()->json($knowledgeBase, 201);
        } catch (\Exception $e) {
            Log::error('Failed to create knowledge base', [
                'error' => $e->getMessage(),
                'data' => $data,
            ]);
            return response()->json(['message' => 'Failed to create knowledge base'], 500);
        }
    }

    /**
     * Update a knowledge base.
     */
    public function updateKnowledgeBase(User $user, string $id, array $data): JsonResponse
    {
        try {
            $knowledgeBase = KnowledgeBase::where('id', $id)
                ->where('user_id', $user->id)
                ->first();

            if (!$knowledgeBase) {
                return response()->json(['message' => 'Knowledge base not found or you do not have permission to edit it'], 404);
            }

            if (isset($data['name'])) {
                $knowledgeBase->name = $data['name'];
            }

            if (array_key_exists('description', $data)) {
                $knowledgeBase->description = $data['description'];
            }

            if (isset($data['source_type'])) {
                $knowledgeBase->source_type = $data['source_type'];
            }

            if (array_key_exists('metadata', $data)) {
                $knowledgeBase->metadata = $data['metadata'];
            }

            if (array_key_exists('is_public', $data)) {
                $knowledgeBase->is_public = $data['is_public'];
            }

            if (array_key_exists('is_active', $data)) {
                $knowledgeBase->is_active = $data['is_active'];
            }

            $knowledgeBase->save();

            return response()->json($knowledgeBase);
        } catch (\Exception $e) {
            Log::error('Failed to update knowledge base', [
                'error' => $e->getMessage(),
                'id' => $id,
                'data' => $data,
            ]);
            return response()->json(['message' => 'Failed to update knowledge base'], 500);
        }
    }

    /**
     * Delete a knowledge base.
     */
    public function deleteKnowledgeBase(User $user, string $id): JsonResponse
    {
        try {
            $knowledgeBase = KnowledgeBase::where('id', $id)
                ->where('user_id', $user->id)
                ->first();

            if (!$knowledgeBase) {
                return response()->json(['message' => 'Knowledge base not found or you do not have permission to delete it'], 404);
            }

            $knowledgeBase->delete();

            return response()->json(['message' => 'Knowledge base deleted successfully']);
        } catch (\Exception $e) {
            Log::error('Failed to delete knowledge base', [
                'error' => $e->getMessage(),
                'id' => $id,
            ]);
            return response()->json(['message' => 'Failed to delete knowledge base'], 500);
        }
    }

    /**
     * Get entries from a knowledge base with filtering, sorting and pagination.
     */
    public function getKnowledgeBaseEntries(
        User $user,
        string $knowledgeBaseId,
        int $page = 1,
        int $perPage = 20,
        string $sortBy = 'created_at',
        string $sortDirection = 'desc',
        ?string $filterByType = null,
        ?string $search = null,
        array $tags = []
    ): JsonResponse {
        try {
            $knowledgeBase = KnowledgeBase::where('id', $knowledgeBaseId)
                ->where(function ($query) use ($user) {
                    $query->where('user_id', $user->id)
                          ->orWhere('is_public', true);
                })
                ->first();

            if (!$knowledgeBase) {
                return response()->json(['message' => 'Knowledge base not found'], 404);
            }

            $query = $knowledgeBase->entries()->where('is_active', true);

            // Apply filters
            if ($filterByType !== null) {
                $query->where('source_type', $filterByType);
            }

            if ($search !== null) {
                $query->where(function($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('content', 'like', "%{$search}%")
                      ->orWhere('summary', 'like', "%{$search}%");
                });
            }

            // Filter by tags if provided
            if (!empty($tags)) {
                foreach ($tags as $tag) {
                    $query->whereJsonContains('tags', $tag);
                }
            }

            // Apply sorting
            $query->orderBy($sortBy, $sortDirection);

            // Apply pagination
            $entries = $query->paginate($perPage, ['*'], 'page', $page);

            return response()->json($entries);
        } catch (\Exception $e) {
            Log::error('Failed to get knowledge base entries', [
                'error' => $e->getMessage(),
                'knowledge_base_id' => $knowledgeBaseId,
            ]);
            return response()->json(['message' => 'Failed to get knowledge base entries'], 500);
        }
    }

    /**
     * Create multiple entries in a knowledge base in a single operation.
     */
    public function createBulkKnowledgeEntries(User $user, string $knowledgeBaseId, array $entriesData): JsonResponse
    {
        try {
            $knowledgeBase = KnowledgeBase::where('id', $knowledgeBaseId)
                ->where('user_id', $user->id)
                ->first();

            if (!$knowledgeBase) {
                return response()->json(['message' => 'Knowledge base not found or you do not have permission to add entries'], 404);
            }

            $createdEntries = [];

            DB::beginTransaction();

            foreach ($entriesData as $entryData) {
                $entry = new KnowledgeEntry();
                $entry->id = (string) Str::uuid();
                $entry->knowledge_base_id = $knowledgeBaseId;
                $entry->title = $entryData['title'];
                $entry->content = $entryData['content'];
                $entry->source_url = $entryData['source_url'] ?? null;
                $entry->source_type = $entryData['source_type'] ?? 'text';
                $entry->summary = $entryData['summary'] ?? null;
                $entry->tags = $entryData['tags'] ?? null;
                $entry->metadata = $entryData['metadata'] ?? null;
                $entry->is_active = $entryData['is_active'] ?? true;
                $entry->save();

                // Generate embeddings if requested
                if (isset($entryData['generate_embeddings']) && $entryData['generate_embeddings']) {
                    $entry->generateEmbeddings();
                }

                $createdEntries[] = $entry;
            }

            DB::commit();

            return response()->json($createdEntries, 201);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Failed to create bulk knowledge entries', [
                'error' => $e->getMessage(),
                'knowledge_base_id' => $knowledgeBaseId,
            ]);
            return response()->json(['message' => 'Failed to create bulk knowledge entries: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Bulk delete multiple knowledge entries.
     */
    public function bulkDeleteKnowledgeEntries(User $user, array $entryIds): JsonResponse
    {
        try {
            // Find entries that the user has permission to delete
            $entries = KnowledgeEntry::whereIn('id', $entryIds)
                ->whereHas('knowledgeBase', function ($query) use ($user) {
                    $query->where('user_id', $user->id);
                })
                ->get();

            if ($entries->isEmpty()) {
                return response()->json(['message' => 'No entries found or you do not have permission to delete them'], 404);
            }

            $deletedCount = 0;

            DB::beginTransaction();

            foreach ($entries as $entry) {
                $entry->delete();
                $deletedCount++;
            }

            DB::commit();

            return response()->json([
                'message' => 'Knowledge entries deleted successfully',
                'deleted_count' => $deletedCount,
                'requested_count' => count($entryIds)
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Failed to bulk delete knowledge entries', [
                'error' => $e->getMessage(),
                'entry_ids' => $entryIds,
            ]);
            return response()->json(['message' => 'Failed to bulk delete knowledge entries'], 500);
        }
    }

    /**
     * Export a knowledge base with all its entries.
     */
    public function exportKnowledgeBase(User $user, string $id): JsonResponse
    {
        try {
            $knowledgeBase = KnowledgeBase::where('id', $id)
                ->where(function ($query) use ($user) {
                    $query->where('user_id', $user->id)
                          ->orWhere('is_public', true);
                })
                ->first();

            if (!$knowledgeBase) {
                return response()->json(['message' => 'Knowledge base not found'], 404);
            }

            // Get all entries
            $entries = $knowledgeBase->entries()->get();

            // Prepare export data
            $exportData = [
                'knowledge_base' => $knowledgeBase->toArray(),
                'entries' => $entries->toArray()
            ];

            return response()->json($exportData);
        } catch (\Exception $e) {
            Log::error('Failed to export knowledge base', [
                'error' => $e->getMessage(),
                'id' => $id,
            ]);
            return response()->json(['message' => 'Failed to export knowledge base'], 500);
        }
    }

    /**
     * Import a knowledge base with entries.
     */
    public function importKnowledgeBase(User $user, array $data, array $options = []): JsonResponse
    {
        try {
            // Extract data
            $knowledgeBaseData = $data['knowledge_base'];
            $entriesData = $data['entries'];
            $overwriteExisting = $options['overwrite_existing'] ?? false;

            DB::beginTransaction();

            // Create or update knowledge base
            if ($overwriteExisting && isset($knowledgeBaseData['id'])) {
                $existingKB = KnowledgeBase::where('id', $knowledgeBaseData['id'])
                    ->where('user_id', $user->id)
                    ->first();

                if ($existingKB) {
                    // Update existing
                    $knowledgeBase = $existingKB;
                    $knowledgeBase->name = $knowledgeBaseData['name'];
                    $knowledgeBase->description = $knowledgeBaseData['description'] ?? null;
                    $knowledgeBase->source_type = $knowledgeBaseData['source_type'] ?? 'manual';
                    $knowledgeBase->metadata = $knowledgeBaseData['metadata'] ?? null;
                    $knowledgeBase->is_public = $knowledgeBaseData['is_public'] ?? false;
                    $knowledgeBase->is_active = $knowledgeBaseData['is_active'] ?? true;
                    $knowledgeBase->save();
                } else {
                    // Create new with user as owner
                    $knowledgeBase = $this->createNewKnowledgeBase($user, $knowledgeBaseData);
                }
            } else {
                // Create new with user as owner
                $knowledgeBase = $this->createNewKnowledgeBase($user, $knowledgeBaseData);
            }

            // Import entries
            $entriesImported = 0;

            foreach ($entriesData as $entryData) {
                // Skip if entry exists and not overwriting
                if (!$overwriteExisting && isset($entryData['id']) &&
                    KnowledgeEntry::where('id', $entryData['id'])->exists()) {
                    continue;
                }

                $entry = new KnowledgeEntry();
                $entry->id = (string) Str::uuid();
                $entry->knowledge_base_id = $knowledgeBase->id;
                $entry->title = $entryData['title'];
                $entry->content = $entryData['content'];
                $entry->source_url = $entryData['source_url'] ?? null;
                $entry->source_type = $entryData['source_type'] ?? 'text';
                $entry->summary = $entryData['summary'] ?? null;
                $entry->tags = $entryData['tags'] ?? null;
                $entry->metadata = $entryData['metadata'] ?? null;
                $entry->is_active = $entryData['is_active'] ?? true;
                $entry->save();

                $entriesImported++;
            }

            DB::commit();

            return response()->json([
                'knowledge_base' => $knowledgeBase,
                'entries_imported' => $entriesImported
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Failed to import knowledge base', [
                'error' => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Failed to import knowledge base: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Generate embeddings for all entries in a knowledge base.
     */
    public function generateEmbeddingsForKnowledgeBase(User $user, string $knowledgeBaseId): JsonResponse
    {
        try {
            $knowledgeBase = KnowledgeBase::where('id', $knowledgeBaseId)
                ->where('user_id', $user->id)
                ->first();

            if (!$knowledgeBase) {
                return response()->json(['message' => 'Knowledge base not found or you do not have permission'], 404);
            }

            // Get all active entries
            $entries = $knowledgeBase->entries()->where('is_active', true)->get();

            $processedCount = 0;
            $failedCount = 0;

            // Process each entry
            foreach ($entries as $entry) {
                // Queue the embedding generation for better performance in production
                try {
                    $success = $entry->generateEmbeddings();
                    if ($success) {
                        $processedCount++;
                    } else {
                        $failedCount++;
                    }
                } catch (\Exception $e) {
                    Log::error('Failed to generate embeddings for entry', [
                        'entry_id' => $entry->id,
                        'error' => $e->getMessage(),
                    ]);
                    $failedCount++;
                }
            }

            return response()->json([
                'message' => 'Embeddings generation completed',
                'processed_entries' => $processedCount,
                'failed_entries' => $failedCount
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to generate embeddings', [
                'error' => $e->getMessage(),
                'knowledge_base_id' => $knowledgeBaseId,
            ]);
            return response()->json(['message' => 'Failed to generate embeddings'], 500);
        }
    }

    /**
     * Search across knowledge bases with advanced filtering.
     */
    public function searchKnowledge(
        User $user,
        string $query,
        ?array $knowledgeBaseIds = null,
        int $maxResults = 50,
        ?string $filterByType = null,
        array $tags = []
    ): JsonResponse {
        try {
            // Get all knowledge bases accessible to the user, filtered by IDs if provided
            $baseQuery = KnowledgeBase::where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhere('is_public', true);
            })
            ->where('is_active', true);

            if ($knowledgeBaseIds !== null) {
                $baseQuery->whereIn('id', $knowledgeBaseIds);
            }

            $accessibleBaseIds = $baseQuery->pluck('id');

            // Base search query
            $searchQuery = KnowledgeEntry::whereIn('knowledge_base_id', $accessibleBaseIds)
                ->where('is_active', true);

            // Apply type filter if provided
            if ($filterByType !== null) {
                $searchQuery->where('source_type', $filterByType);
            }

            // Apply tag filters if provided
            if (!empty($tags)) {
                foreach ($tags as $tag) {
                    $searchQuery->whereJsonContains('tags', $tag);
                }
            }

            // Apply full-text search
            if (config('database.default') === 'mysql') {
                // MySQL-specific full-text search
                $searchQuery->whereFullText(['title', 'content'], $query)
                    ->orderByRaw('MATCH(title, content) AGAINST(? IN BOOLEAN MODE) DESC', [$query]);
            } else {
                // Generic LIKE-based search for other databases
                $searchQuery->where(function($q) use ($query) {
                    $q->where('title', 'like', "%{$query}%")
                      ->orWhere('content', 'like', "%{$query}%")
                      ->orWhere('summary', 'like', "%{$query}%");
                });
            }

            // Get results with related knowledge base info
            $results = $searchQuery
                ->with('knowledgeBase:id,name,source_type')
                ->limit($maxResults)
                ->get();

            return response()->json($results);
        } catch (\Exception $e) {
            Log::error('Failed to search knowledge', [
                'error' => $e->getMessage(),
                'query' => $query,
            ]);
            return response()->json(['message' => 'Failed to search knowledge: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Find similar entries with similarity score threshold.
     */
    public function findSimilarEntries(
        User $user,
        string $entryId,
        int $limit = 5,
        ?float $minSimilarityScore = null,
        bool $useVectors = true
    ): JsonResponse {
        try {
            $entry = KnowledgeEntry::where('id', $entryId)
                ->whereHas('knowledgeBase', function ($query) use ($user) {
                    $query->where(function ($q) use ($user) {
                        $q->where('user_id', $user->id)
                          ->orWhere('is_public', true);
                    });
                })
                ->first();

            if (!$entry) {
                return response()->json(['message' => 'Knowledge entry not found'], 404);
            }

            // Use vector similarity search if available and requested
            if ($useVectors && !empty($entry->vector_embedding)) {
                $results = $this->findSimilarByVectors($entry, $limit, $minSimilarityScore);
                
                if (count($results) > 0) {
                    return response()->json($results);
                }
            }
            
            // Fall back to content and tag-based similarity if vectors not available or no results
            $matchQuery = KnowledgeEntry::where('id', '!=', $entryId)
                ->where('knowledge_base_id', $entry->knowledge_base_id)
                ->where('is_active', true);

            // Add conditions for matching
            $matchQuery->where(function ($query) use ($entry) {
                // Match on tags if available
                if (!empty($entry->tags)) {
                    foreach ($entry->tags as $tag) {
                        $query->orWhereJsonContains('tags', $tag);
                    }
                }

                // Match on part of the title
                if (!empty($entry->title)) {
                    $words = explode(' ', $entry->title);
                    foreach ($words as $word) {
                        if (strlen($word) > 3) { // Only use meaningful words
                            $query->orWhere('title', 'like', '%' . $word . '%');
                        }
                    }
                }

                // Match on content keywords
                $keywords = $this->extractKeywords($entry->content);
                foreach ($keywords as $keyword) {
                    $query->orWhere('content', 'like', '%' . $keyword . '%');
                }
            });

            // Get matching entries
            $similarEntries = $matchQuery->limit($limit * 2)->get(); // Get more than needed to apply scoring

            // Calculate similarity scores and filter
            $scoredEntries = $this->scoreSimilarEntries($entry, $similarEntries);

            // Apply minimum similarity score filter if provided
            if ($minSimilarityScore !== null) {
                $scoredEntries = array_filter($scoredEntries, function($item) use ($minSimilarityScore) {
                    return $item['similarity_score'] >= $minSimilarityScore;
                });
            }

            // Sort by score and limit
            usort($scoredEntries, function($a, $b) {
                return $b['similarity_score'] <=> $a['similarity_score'];
            });

            $scoredEntries = array_slice($scoredEntries, 0, $limit);

            // Extract just the entries for response
            return response()->json($scoredEntries);
        } catch (\Exception $e) {
            Log::error('Failed to find similar entries', [
                'error' => $e->getMessage(),
                'entry_id' => $entryId,
            ]);
            return response()->json(['message' => 'Failed to find similar entries: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Find similar entries using vector embeddings
     */
    private function findSimilarByVectors(
        KnowledgeEntry $sourceEntry, 
        int $limit = 5, 
        ?float $minSimilarityScore = null
    ): array {
        try {
            // Get entries with embeddings from the same knowledge base
            $entries = KnowledgeEntry::where('id', '!=', $sourceEntry->id)
                ->where('knowledge_base_id', $sourceEntry->knowledge_base_id)
                ->where('is_active', true)
                ->whereNotNull('vector_embedding')
                ->get();
            
            $scoredEntries = [];
            
            foreach ($entries as $entry) {
                if (empty($entry->vector_embedding)) {
                    continue;
                }
                
                // Calculate cosine similarity between vectors
                $similarity = $entry->calculateCosineSimilarity($sourceEntry->vector_embedding);
                
                // Apply threshold if provided
                if ($minSimilarityScore !== null && $similarity < $minSimilarityScore) {
                    continue;
                }
                
                // Set score and add to results
                $entry->similarity_score = $similarity;
                
                $scoredEntries[] = [
                    'id' => $entry->id,
                    'title' => $entry->title,
                    'content' => $entry->content,
                    'summary' => $entry->summary,
                    'source_url' => $entry->source_url,
                    'source_type' => $entry->source_type,
                    'similarity_score' => $similarity,
                    'knowledge_base' => [
                        'id' => $entry->knowledgeBase->id,
                        'name' => $entry->knowledgeBase->name,
                    ],
                ];
            }
            
            // Sort by similarity
            usort($scoredEntries, function($a, $b) {
                return $b['similarity_score'] <=> $a['similarity_score'];
            });
            
            // Limit results
            return array_slice($scoredEntries, 0, $limit);
        } catch (\Exception $e) {
            Log::error('Vector similarity search failed', [
                'error' => $e->getMessage(),
                'entry_id' => $sourceEntry->id,
            ]);
            return [];
        }
    }

    /**
     * Create a new knowledge base with the given data.
     */
    private function createNewKnowledgeBase(User $user, array $data): KnowledgeBase
    {
        $knowledgeBase = new KnowledgeBase();
        $knowledgeBase->id = (string) Str::uuid();
        $knowledgeBase->user_id = $user->id;
        $knowledgeBase->name = $data['name'];
        $knowledgeBase->description = $data['description'] ?? null;
        $knowledgeBase->source_type = $data['source_type'] ?? 'manual';
        $knowledgeBase->metadata = $data['metadata'] ?? null;
        $knowledgeBase->is_public = $data['is_public'] ?? false;
        $knowledgeBase->is_active = $data['is_active'] ?? true;
        $knowledgeBase->save();

        return $knowledgeBase;
    }

    /**
     * Extract keywords from content for similarity matching.
     */
    private function extractKeywords(string $content, int $limit = 10): array
    {
        // Simple implementation - in a real app would use NLP
        $content = strtolower(strip_tags($content));

        // Remove common words and punctuation
        $content = preg_replace('/[^\p{L}\p{N}\s]/u', ' ', $content);
        $content = preg_replace('/\s+/', ' ', $content);

        $words = explode(' ', $content);

        // Filter short words
        $words = array_filter($words, function($word) {
            return strlen($word) >= 4;
        });

        // Count word frequency
        $wordCounts = array_count_values($words);

        // Sort by frequency
        arsort($wordCounts);

        // Return top keywords
        return array_slice(array_keys($wordCounts), 0, $limit);
    }

    /**
     * Calculate similarity scores between entries.
     */
    private function scoreSimilarEntries(KnowledgeEntry $sourceEntry, Collection $entries): array
    {
        $result = [];
        $sourceKeywords = $this->extractKeywords($sourceEntry->content);
        $sourceTags = $sourceEntry->tags ?? [];

        foreach ($entries as $entry) {
            $score = 0.0;

            // Tag similarity (up to 0.5)
            $entryTags = $entry->tags ?? [];
            if (!empty($sourceTags) && !empty($entryTags)) {
                $commonTags = count(array_intersect($sourceTags, $entryTags));
                $totalTags = count(array_unique(array_merge($sourceTags, $entryTags)));
                if ($totalTags > 0) {
                    $score += 0.5 * ($commonTags / $totalTags);
                }
            }

            // Content similarity (up to 0.3)
            $entryKeywords = $this->extractKeywords($entry->content);
            $commonKeywords = count(array_intersect($sourceKeywords, $entryKeywords));
            $totalKeywords = count(array_unique(array_merge($sourceKeywords, $entryKeywords)));
            if ($totalKeywords > 0) {
                $score += 0.3 * ($commonKeywords / $totalKeywords);
            }

            // Title similarity (up to 0.2)
            $titleSimilarity = similar_text($sourceEntry->title, $entry->title, $percent);
            $score += 0.2 * ($percent / 100);

            $result[] = [
                'entry' => $entry,
                'similarity_score' => $score
            ];
        }

        return $result;
    }

    /**
     * Search knowledge bases for AI context specifically
     * Optimized for providing context to AI models based on user queries
     */
    public function searchForAIContext(
        User $user,
        string $query,
        array $knowledgeBaseIds,
        int $maxResults = 3,
        float $minScore = 0.75
    ): array {
        try {
            // First try vector search for semantic understanding
            $results = [];
            if (strlen($query) > 5) {
                // Ensure knowledge bases exist and are accessible to the user
                $baseQuery = KnowledgeBase::whereIn('id', $knowledgeBaseIds)
                    ->where(function ($q) use ($user) {
                        $q->where('user_id', $user->id)
                          ->orWhere('is_public', true);
                    })
                    ->where('is_active', true);

                $accessibleBaseIds = $baseQuery->pluck('id')->toArray();
                
                if (!empty($accessibleBaseIds)) {
                    // Try vector search first for semantic matching
                    $aiService = app(App\Services\AI\AIService::class);
                    $embedding = $aiService->generateEmbeddingForQuery($query);
                    
                    if (!empty($embedding)) {
                        $entries = KnowledgeEntry::whereIn('knowledge_base_id', $accessibleBaseIds)
                            ->where('is_active', true)
                            ->whereNotNull('vector_embedding')
                            ->with('knowledgeBase:id,name,source_type')
                            ->get();
                            
                        // Calculate similarity scores
                        $scoredEntries = [];
                        foreach ($entries as $entry) {
                            if (empty($entry->vector_embedding)) {
                                continue;
                            }
                            
                            $similarity = $aiService->calculateSimilarity($embedding, $entry->vector_embedding);
                            
                            if ($similarity > $minScore) {
                                $entry->similarity_score = $similarity;
                                $scoredEntries[] = $entry;
                            }
                        }
                        
                        // Sort by similarity score
                        usort($scoredEntries, function($a, $b) {
                            return $b->similarity_score <=> $a->similarity_score;
                        });
                        
                        // Take top results
                        $scoredEntries = array_slice($scoredEntries, 0, $maxResults);
                        
                        // Format for AI context
                        foreach ($scoredEntries as $entry) {
                            $results[] = [
                                'id' => $entry->id,
                                'title' => $entry->title,
                                'content' => $entry->formatted_content ?? $entry->content,
                                'source_url' => $entry->source_url,
                                'source_type' => $entry->source_type,
                                'similarity_score' => $entry->similarity_score,
                                'knowledge_base' => [
                                    'id' => $entry->knowledgeBase->id,
                                    'name' => $entry->knowledgeBase->name,
                                    'source_type' => $entry->knowledgeBase->source_type,
                                ],
                            ];
                        }
                    }
                    
                    // If vector search yielded insufficient results, supplement with keyword search
                    if (count($results) < $maxResults) {
                        $neededCount = $maxResults - count($results);
                        $existingIds = array_map(function($result) {
                            return $result['id'];
                        }, $results);
                        
                        // Basic text search
                        $keywordEntries = KnowledgeEntry::whereIn('knowledge_base_id', $accessibleBaseIds)
                            ->whereNotIn('id', $existingIds)
                            ->where('is_active', true)
                            ->where(function($q) use ($query) {
                                $q->where('title', 'like', "%{$query}%")
                                  ->orWhere('content', 'like', "%{$query}%");
                            })
                            ->with('knowledgeBase:id,name,source_type')
                            ->limit($neededCount)
                            ->get();
                            
                        foreach ($keywordEntries as $entry) {
                            $results[] = [
                                'id' => $entry->id,
                                'title' => $entry->title,
                                'content' => $entry->formatted_content ?? $entry->content,
                                'source_url' => $entry->source_url,
                                'source_type' => $entry->source_type,
                                'similarity_score' => 0.7, // Default score for keyword matches
                                'knowledge_base' => [
                                    'id' => $entry->knowledgeBase->id,
                                    'name' => $entry->knowledgeBase->name,
                                    'source_type' => $entry->knowledgeBase->source_type,
                                ],
                            ];
                        }
                    }
                }
            }
            
            return $results;
        } catch (\Exception $e) {
            Log::error('Error searching knowledge bases for AI context', [
                'error' => $e->getMessage(),
                'query' => $query,
                'knowledge_base_ids' => $knowledgeBaseIds,
            ]);
            
            return [];
        }
    }
    
    /**
     * Get configurations for context rules
     * Returns a simplified list of knowledge bases suitable for context rules
     */
    public function getConfigurationsForContextRules(User $user): array
    {
        try {
            $knowledgeBases = KnowledgeBase::where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhere('is_public', true);
            })
            ->where('is_active', true)
            ->withCount('entries')
            ->get();
            
            $configs = [];
            foreach ($knowledgeBases as $kb) {
                $configs[] = [
                    'id' => $kb->id,
                    'name' => $kb->name,
                    'description' => $kb->description,
                    'entries_count' => $kb->entries_count,
                    'source_type' => $kb->source_type,
                    'is_public' => $kb->is_public,
                ];
            }
            
            return $configs;
        } catch (\Exception $e) {
            Log::error('Failed to get knowledge base configurations for context rules', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
            ]);
            
            return [];
        }
    }

    /**
     * Advanced search across knowledge bases with multiple filtering options.
     *
     * @param User $user The authenticated user
     * @param array $params Search parameters
     * @return JsonResponse
     */
    public function advancedSearch(User $user, array $params): JsonResponse
    {
        try {
            // Extract parameters
            $query = $params['query'];
            $knowledgeBaseIds = $params['knowledge_base_ids'] ?? null;
            $searchMode = $params['search_mode'] ?? 'hybrid';
            $minSimilarity = $params['min_similarity'] ?? 0.7;
            $limit = $params['limit'] ?? 20;
            $filters = $params['filters'] ?? [];
            $includeMetadata = $params['include_metadata'] ?? false;
            $vectorWeight = $params['vector_weight'] ?? null;
            $keywordWeight = $params['keyword_weight'] ?? null;
            
            // Access control: If specific knowledge bases are requested, verify access
            if (!empty($knowledgeBaseIds)) {
                $allowedKnowledgeBases = KnowledgeBase::where(function ($q) use ($user) {
                    $q->where('user_id', $user->id)
                      ->orWhere('is_public', true);
                })
                ->where('is_active', true)
                ->whereIn('id', $knowledgeBaseIds)
                ->pluck('id')
                ->toArray();
                
                // If none of the requested knowledge bases are accessible
                if (empty($allowedKnowledgeBases)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'None of the requested knowledge bases are accessible'
                    ], 403);
                }
                
                // Update the knowledge base IDs to only include accessible ones
                $knowledgeBaseIds = $allowedKnowledgeBases;
            } else {
                // If no specific knowledge bases are requested, get all accessible ones
                $knowledgeBaseIds = KnowledgeBase::where(function ($q) use ($user) {
                    $q->where('user_id', $user->id)
                      ->orWhere('is_public', true);
                })
                ->where('is_active', true)
                ->pluck('id')
                ->toArray();
            }
            
            // Get vector search service
            $vectorSearchService = app(\App\Services\KnowledgeBase\VectorSearch\VectorSearchService::class);
            
            // Perform search based on mode
            $results = match ($searchMode) {
                'vector' => $vectorSearchService->vectorSearch($query, $knowledgeBaseIds, $limit, $minSimilarity),
                'keyword' => $this->keywordSearch($query, $knowledgeBaseIds, $limit, $filters),
                'hybrid' => $vectorSearchService->hybridSearch(
                    $query, 
                    $knowledgeBaseIds, 
                    $limit, 
                    $minSimilarity, 
                    $vectorWeight, 
                    $keywordWeight
                ),
                default => $vectorSearchService->hybridSearch(
                    $query, 
                    $knowledgeBaseIds, 
                    $limit, 
                    $minSimilarity, 
                    $vectorWeight, 
                    $keywordWeight
                )
            };
            
            // Apply additional filters
            $results = $this->applySearchFilters($results, $filters);
            
            // Format results
            $formattedResults = $this->formatSearchResults($results, $includeMetadata);
            
            return response()->json([
                'success' => true,
                'query' => $query,
                'search_mode' => $searchMode,
                'total' => count($formattedResults),
                'results' => $formattedResults,
                'knowledge_base_ids' => $knowledgeBaseIds
            ]);
        } catch (\Exception $e) {
            Log::error('Error in advanced search', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'params' => $params
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error performing advanced search: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Apply additional filters to search results.
     * 
     * @param Collection $results Initial search results
     * @param array $filters Filters to apply
     * @return Collection Filtered results
     */
    protected function applySearchFilters($results, array $filters): Collection
    {
        // Filter by entry types if specified
        if (!empty($filters['entry_types'])) {
            $results = $results->filter(function ($entry) use ($filters) {
                return in_array($entry->source_type, $filters['entry_types']);
            });
        }
        
        // Filter by tags if specified
        if (!empty($filters['tags'])) {
            $results = $results->filter(function ($entry) use ($filters) {
                $entryTags = $entry->tags ?? [];
                return !empty(array_intersect($entryTags, $filters['tags']));
            });
        }
        
        // Exclude chunks if requested
        if (!empty($filters['exclude_chunks']) && $filters['exclude_chunks'] === true) {
            $results = $results->filter(function ($entry) {
                return empty($entry->parent_entry_id);
            });
        }
        
        // Only include chunks if requested
        if (!empty($filters['only_chunks']) && $filters['only_chunks'] === true) {
            $results = $results->filter(function ($entry) {
                return !empty($entry->parent_entry_id);
            });
        }
        
        // Filter by parent entry if specified
        if (!empty($filters['parent_entry_id'])) {
            $results = $results->filter(function ($entry) use ($filters) {
                return $entry->parent_entry_id === $filters['parent_entry_id'];
            });
        }
        
        return $results;
    }
    
    /**
     * Format search results for consistent API response.
     * 
     * @param Collection $results Search results
     * @param bool $includeMetadata Whether to include metadata
     * @return array Formatted results
     */
    protected function formatSearchResults($results, bool $includeMetadata = false): array
    {
        return $results->map(function ($entry) use ($includeMetadata) {
            $formatted = [
                'id' => $entry->id,
                'knowledge_base_id' => $entry->knowledge_base_id,
                'title' => $entry->title,
                'content' => $entry->content,
                'summary' => $entry->summary,
                'source_url' => $entry->source_url,
                'source_type' => $entry->source_type,
                'tags' => $entry->tags,
                'similarity_score' => $entry->similarity_score ?? null,
                'created_at' => $entry->created_at,
                'updated_at' => $entry->updated_at,
            ];
            
            // Add information about chunks
            if (!empty($entry->parent_entry_id)) {
                $formatted['parent_entry_id'] = $entry->parent_entry_id;
                $formatted['chunk_id'] = $entry->chunk_id;
                $formatted['chunk_index'] = $entry->chunk_index;
            }
            
            // Include keyword highlights if available
            if (!empty($entry->keyword_highlights)) {
                $formatted['keyword_highlights'] = $entry->keyword_highlights;
            }
            
            // Include metadata if requested and available
            if ($includeMetadata && !empty($entry->metadata)) {
                $formatted['metadata'] = $entry->metadata;
            }
            
            return $formatted;
        })->values()->toArray();
    }
    
    /**
     * Perform keyword-based search without vector embeddings.
     * This is a fallback when vector search is not available.
     * 
     * @param string $query Search query
     * @param array|null $knowledgeBaseIds Knowledge base IDs to search within
     * @param int $limit Maximum number of results
     * @param array $filters Additional filters
     * @return Collection Search results
     */
    protected function keywordSearch(string $query, ?array $knowledgeBaseIds = null, int $limit = 20, array $filters = []): Collection
    {
        // Build base query
        $baseQuery = KnowledgeEntry::where('is_active', true);
        
        // Limit to specific knowledge bases if provided
        if (!empty($knowledgeBaseIds)) {
            $baseQuery->whereIn('knowledge_base_id', $knowledgeBaseIds);
        }
        
        // Apply full-text search
        $baseQuery->whereFullText(['title', 'content'], $query);
        
        // Get results
        return $baseQuery->limit($limit)->get();
    }
    
    /**
     * Get statistics and analytics for a knowledge base.
     * 
     * @param User $user The authenticated user
     * @param string $id Knowledge base ID
     * @return JsonResponse
     */
    public function getKnowledgeBaseStats(User $user, string $id): JsonResponse
    {
        try {
            $knowledgeBase = KnowledgeBase::where('id', $id)
                ->where(function ($query) use ($user) {
                    $query->where('user_id', $user->id)
                          ->orWhere('is_public', true);
                })
                ->first();

            if (!$knowledgeBase) {
                return response()->json(['message' => 'Knowledge base not found'], 404);
            }
            
            // Get entries
            $entries = $knowledgeBase->entries;
            $totalEntries = $entries->count();
            
            // Count entries by type
            $entriesByType = $entries->groupBy('source_type')
                ->map(function ($group) {
                    return $group->count();
                })
                ->toArray();
            
            // Count entries with vector embeddings
            $vectorIndexedCount = $entries->where('vector_indexed', true)->count();
            $vectorIndexedPercentage = $totalEntries > 0 ? round(($vectorIndexedCount / $totalEntries) * 100, 2) : 0;
            
            // Count chunks
            $chunksCount = $entries->whereNotNull('parent_entry_id')->count();
            $parentEntriesCount = $entries->filter(function ($entry) {
                return isset($entry->metadata['has_chunks']) && $entry->metadata['has_chunks'] === true;
            })->count();
            
            // Count entries by tag
            $tags = [];
            foreach ($entries as $entry) {
                if (!empty($entry->tags)) {
                    foreach ($entry->tags as $tag) {
                        if (!isset($tags[$tag])) {
                            $tags[$tag] = 0;
                        }
                        $tags[$tag]++;
                    }
                }
            }
            
            // Sort tags by count
            arsort($tags);
            
            // Get creation and update dates
            $oldestEntry = $entries->sortBy('created_at')->first();
            $newestEntry = $entries->sortByDesc('created_at')->first();
            $lastUpdatedEntry = $entries->sortByDesc('updated_at')->first();
            
            // Assemble stats
            $stats = [
                'knowledge_base' => [
                    'id' => $knowledgeBase->id,
                    'name' => $knowledgeBase->name,
                    'description' => $knowledgeBase->description,
                    'source_type' => $knowledgeBase->source_type,
                    'created_at' => $knowledgeBase->created_at,
                    'updated_at' => $knowledgeBase->updated_at,
                ],
                'entries' => [
                    'total' => $totalEntries,
                    'by_type' => $entriesByType,
                    'vector_indexed' => [
                        'count' => $vectorIndexedCount,
                        'percentage' => $vectorIndexedPercentage,
                    ],
                    'chunks' => [
                        'total_chunks' => $chunksCount,
                        'parent_entries' => $parentEntriesCount,
                    ],
                    'oldest' => $oldestEntry ? [
                        'id' => $oldestEntry->id,
                        'title' => $oldestEntry->title,
                        'created_at' => $oldestEntry->created_at,
                    ] : null,
                    'newest' => $newestEntry ? [
                        'id' => $newestEntry->id,
                        'title' => $newestEntry->title,
                        'created_at' => $newestEntry->created_at,
                    ] : null,
                    'last_updated' => $lastUpdatedEntry ? [
                        'id' => $lastUpdatedEntry->id,
                        'title' => $lastUpdatedEntry->title,
                        'updated_at' => $lastUpdatedEntry->updated_at,
                    ] : null,
                ],
                'tags' => $tags,
                'vector_search_settings' => [
                    'similarity_threshold' => $knowledgeBase->similarity_threshold,
                    'embedding_model' => $knowledgeBase->embedding_model,
                    'use_hybrid_search' => $knowledgeBase->use_hybrid_search,
                    'keyword_search_weight' => $knowledgeBase->keyword_search_weight,
                    'vector_search_weight' => $knowledgeBase->vector_search_weight,
                    'auto_chunk_content' => $knowledgeBase->auto_chunk_content,
                    'chunk_size' => $knowledgeBase->chunk_size,
                    'chunk_overlap' => $knowledgeBase->chunk_overlap,
                ],
            ];
            
            return response()->json([
                'success' => true,
                'stats' => $stats,
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting knowledge base stats', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'knowledge_base_id' => $id
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error getting knowledge base stats: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Generate keyword highlights for an entry.
     * 
     * @param User $user The authenticated user
     * @param string $entryId Entry ID
     * @return JsonResponse
     */
    public function generateKeywordHighlights(User $user, string $entryId): JsonResponse
    {
        try {
            $entry = KnowledgeEntry::with('knowledgeBase')
                ->where('id', $entryId)
                ->first();
            
            if (!$entry) {
                return response()->json([
                    'success' => false,
                    'message' => 'Entry not found'
                ], 404);
            }
            
            // Check access to the knowledge base
            if ($entry->knowledgeBase->user_id !== $user->id && !$entry->knowledgeBase->is_public) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied to this entry'
                ], 403);
            }
            
            // Generate highlights
            $highlights = $entry->generateKeywordHighlights();
            
            // Save the entry with highlights
            $entry->save();
            
            return response()->json([
                'success' => true,
                'entry_id' => $entry->id,
                'title' => $entry->title,
                'keyword_highlights' => $highlights,
            ]);
        } catch (\Exception $e) {
            Log::error('Error generating keyword highlights', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'entry_id' => $entryId
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error generating keyword highlights: ' . $e->getMessage()
            ], 500);
        }
    }
}
