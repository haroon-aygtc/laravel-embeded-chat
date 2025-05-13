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

            // Process each entry
            foreach ($entries as $entry) {
                // In a real application, this would likely be queued
                $entry->generateEmbeddings();
                $processedCount++;
            }

            return response()->json([
                'message' => 'Embeddings generation completed',
                'processed_entries' => $processedCount
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
        ?float $minSimilarityScore = null
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

            // In a real implementation with vector embeddings, we would use vector similarity search here
            // For now, let's use tag and content-based similarity with a mock score
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
            $result = array_map(function($item) {
                $entry = $item['entry'];
                $entry->similarity_score = $item['similarity_score'];
                return $entry;
            }, $scoredEntries);

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Failed to find similar entries', [
                'error' => $e->getMessage(),
                'entry_id' => $entryId,
            ]);
            return response()->json(['message' => 'Failed to find similar entries: ' . $e->getMessage()], 500);
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
}
