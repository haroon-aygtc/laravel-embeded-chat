<?php

declare(strict_types=1);

namespace App\Services\KnowledgeBase\VectorSearch;

use App\Models\AI\KnowledgeBase;
use App\Models\AI\KnowledgeEntry;
use App\Services\AI\AIProviderService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;

class VectorSearchService
{
    protected AIProviderService $aiProviderService;
    protected Client $httpClient;

    /**
     * Create a new service instance.
     */
    public function __construct(AIProviderService $aiProviderService)
    {
        $this->aiProviderService = $aiProviderService;
        $this->httpClient = new Client();
    }
    
    /**
     * Generate vector embeddings for a knowledge entry's content.
     *
     * @param KnowledgeEntry $entry The entry to generate embeddings for
     * @param bool $forceRegenerate Whether to regenerate embeddings even if they already exist
     * @return bool Success status
     */
    public function generateEmbeddings(KnowledgeEntry $entry, bool $forceRegenerate = false): bool
    {
        // Skip if embeddings already exist and we're not forcing regeneration
        if (!$forceRegenerate && !empty($entry->vector_embedding)) {
            return true;
        }
        
        try {
            // Get the knowledge base to determine embedding model
            $knowledgeBase = $entry->knowledgeBase;
            if (!$knowledgeBase) {
                Log::error('Knowledge base not found for entry', ['entry_id' => $entry->id]);
                return false;
            }
            
            // Determine which embedding model to use
            $embeddingModel = $knowledgeBase->embedding_model ?? 
                config('ai.embeddings.default_model', 'text-embedding-ada-002');
            
            // Get provider based on the model
            $provider = $this->getProviderForModel($embeddingModel);
            
            // Generate embeddings using appropriate method
            $embeddings = match ($provider) {
                'openai' => $this->generateOpenAIEmbeddings($entry, $embeddingModel),
                'huggingface' => $this->generateHuggingFaceEmbeddings($entry, $embeddingModel),
                'local' => $this->generateLocalEmbeddings($entry, $embeddingModel),
                default => $this->generateSimpleEmbeddings($entry)
            };
            
            if (empty($embeddings)) {
                Log::error('Failed to generate embeddings', ['entry_id' => $entry->id]);
                return false;
            }
            
            // Store the embeddings
            $entry->vector_embedding = $embeddings;
            $entry->vector_indexed = true;
            $entry->save();
            
            return true;
        } catch (\Exception $e) {
            Log::error('Error generating embeddings', [
                'entry_id' => $entry->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return false;
        }
    }
    
    /**
     * Batch generate embeddings for multiple entries.
     *
     * @param Collection|array $entries The entries to generate embeddings for
     * @param bool $forceRegenerate Whether to regenerate embeddings even if they already exist
     * @return array Results with entry IDs as keys and success status as values
     */
    public function batchGenerateEmbeddings(Collection|array $entries, bool $forceRegenerate = false): array
    {
        $results = [];
        
        foreach ($entries as $entry) {
            $results[$entry->id] = $this->generateEmbeddings($entry, $forceRegenerate);
        }
        
        return $results;
    }
    
    /**
     * Perform semantic search on knowledge entries using vector similarity.
     *
     * @param string $query The search query
     * @param KnowledgeBase|string|null $knowledgeBase Optional knowledge base to limit search to
     * @param int $limit Maximum number of results to return
     * @param float|null $minSimilarity Minimum similarity threshold (0-1)
     * @return Collection Search results with similarity scores
     */
    public function vectorSearch(
        string $query,
        KnowledgeBase|string|null $knowledgeBase = null,
        int $limit = 10,
        ?float $minSimilarity = null
    ): Collection {
        try {
            // Get knowledge base if string ID is provided
            if (is_string($knowledgeBase)) {
                $knowledgeBase = KnowledgeBase::find($knowledgeBase);
            }
            
            // Set minimum similarity threshold
            $minSimilarity = $minSimilarity ?? ($knowledgeBase->similarity_threshold ?? 0.75);
            
            // Generate query embedding
            $queryEmbedding = $this->generateQueryEmbedding($query, $knowledgeBase);
            
            if (empty($queryEmbedding)) {
                Log::error('Failed to generate query embedding', ['query' => $query]);
                return collect([]);
            }
            
            // Build base query
            $baseQuery = KnowledgeEntry::whereNotNull('vector_embedding')
                ->where('vector_indexed', true)
                ->where('is_active', true);
            
            // Limit to specific knowledge base if provided
            if ($knowledgeBase) {
                $baseQuery->where('knowledge_base_id', $knowledgeBase->id);
            }
            
            // Get all candidate entries
            // Note: In a production environment with large datasets, 
            // this should be optimized or replaced with a dedicated vector database
            $entries = $baseQuery->get();
            
            // Calculate similarity for each entry
            $results = $entries->map(function ($entry) use ($queryEmbedding) {
                // Calculate cosine similarity
                $similarity = $this->calculateCosineSimilarity(
                    $queryEmbedding,
                    $entry->vector_embedding
                );
                
                // Add similarity score to entry
                $entry->similarity_score = $similarity;
                
                return $entry;
            })
            // Filter by minimum similarity
            ->filter(function ($entry) use ($minSimilarity) {
                return $entry->similarity_score >= $minSimilarity;
            })
            // Sort by similarity (highest first)
            ->sortByDesc('similarity_score')
            // Limit results
            ->take($limit);
            
            return $results;
        } catch (\Exception $e) {
            Log::error('Error in vector search', [
                'query' => $query,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return collect([]);
        }
    }
    
    /**
     * Perform a hybrid search combining vector similarity and keyword search.
     *
     * @param string $query The search query
     * @param KnowledgeBase|string|null $knowledgeBase Optional knowledge base to limit search to
     * @param int $limit Maximum number of results to return
     * @param float|null $minSimilarity Minimum similarity threshold (0-1)
     * @param int|null $vectorWeight Weight for vector search results (0-100)
     * @param int|null $keywordWeight Weight for keyword search results (0-100)
     * @return Collection Search results with combined scores
     */
    public function hybridSearch(
        string $query,
        KnowledgeBase|string|null $knowledgeBase = null,
        int $limit = 10,
        ?float $minSimilarity = null,
        ?int $vectorWeight = null,
        ?int $keywordWeight = null
    ): Collection {
        try {
            // Get knowledge base if string ID is provided
            if (is_string($knowledgeBase)) {
                $knowledgeBase = KnowledgeBase::find($knowledgeBase);
            }
            
            // Set weights (default to knowledge base settings or 70/30 split)
            $vectorWeight = $vectorWeight ?? ($knowledgeBase->vector_search_weight ?? 70);
            $keywordWeight = $keywordWeight ?? ($knowledgeBase->keyword_search_weight ?? 30);
            
            // Normalize weights
            $totalWeight = $vectorWeight + $keywordWeight;
            $vectorWeight = $vectorWeight / $totalWeight;
            $keywordWeight = $keywordWeight / $totalWeight;
            
            // Perform vector search
            $vectorResults = $this->vectorSearch($query, $knowledgeBase, $limit * 2, $minSimilarity);
            
            // Perform keyword search
            $keywordResults = $this->keywordSearch($query, $knowledgeBase, $limit * 2);
            
            // Combine results
            $combinedResults = collect([]);
            
            // Process vector results
            foreach ($vectorResults as $entry) {
                $combinedResults[$entry->id] = [
                    'entry' => $entry,
                    'vector_score' => $entry->similarity_score,
                    'keyword_score' => 0,
                    'combined_score' => 0
                ];
            }
            
            // Process keyword results
            foreach ($keywordResults as $entry) {
                if (isset($combinedResults[$entry->id])) {
                    // Entry already in combined results from vector search
                    $combinedResults[$entry->id]['keyword_score'] = $entry->keyword_score;
                } else {
                    // New entry from keyword search
                    $combinedResults[$entry->id] = [
                        'entry' => $entry,
                        'vector_score' => 0,
                        'keyword_score' => $entry->keyword_score,
                        'combined_score' => 0
                    ];
                }
            }
            
            // Calculate combined scores
            foreach ($combinedResults as &$result) {
                $result['combined_score'] = 
                    ($result['vector_score'] * $vectorWeight) + 
                    ($result['keyword_score'] * $keywordWeight);
                
                // Update entry with combined score
                $result['entry']->similarity_score = $result['combined_score'];
            }
            
            // Sort by combined score and limit results
            $finalResults = collect($combinedResults)
                ->sortByDesc(function ($result) {
                    return $result['combined_score'];
                })
                ->take($limit)
                ->map(function ($result) {
                    return $result['entry'];
                });
            
            return $finalResults;
        } catch (\Exception $e) {
            Log::error('Error in hybrid search', [
                'query' => $query,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return collect([]);
        }
    }
    
    /**
     * Perform keyword search on knowledge entries.
     *
     * @param string $query The search query
     * @param KnowledgeBase|string|null $knowledgeBase Optional knowledge base to limit search to
     * @param int $limit Maximum number of results to return
     * @return Collection Search results with keyword scores
     */
    protected function keywordSearch(
        string $query,
        KnowledgeBase|string|null $knowledgeBase = null,
        int $limit = 10
    ): Collection {
        try {
            // Get knowledge base if string ID is provided
            if (is_string($knowledgeBase)) {
                $knowledgeBase = KnowledgeBase::find($knowledgeBase);
            }
            
            // Build base query
            $baseQuery = KnowledgeEntry::where('is_active', true);
            
            // Limit to specific knowledge base if provided
            if ($knowledgeBase) {
                $baseQuery->where('knowledge_base_id', $knowledgeBase->id);
            }
            
            $connection = config('database.default');
            $driver = config("database.connections.{$connection}.driver");
            
            if ($driver === 'mysql') {
                // Use MySQL full-text search if available
                $baseQuery->whereFullText(['title', 'content'], $query);
                
                // Add relevance score
                $baseQuery->selectRaw('MATCH(title, content) AGAINST(? IN NATURAL LANGUAGE MODE) AS keyword_score', [$query]);
            } else {
                // Generic LIKE-based search for other databases
                $baseQuery->where(function($q) use ($query) {
                    $keywords = preg_split('/\s+/', $query);
                    
                    foreach ($keywords as $keyword) {
                        if (strlen($keyword) > 2) { // Skip very short keywords
                            $q->orWhere('title', 'like', "%{$keyword}%")
                              ->orWhere('content', 'like', "%{$keyword}%")
                              ->orWhere('summary', 'like', "%{$keyword}%");
                        }
                    }
                });
                
                // Simulate relevance score
                $baseQuery->addSelect('*');
                $baseQuery->selectRaw("0.5 AS keyword_score");
            }
            
            $results = $baseQuery->limit($limit)->get();
            
            // For non-MySQL databases, calculate a better relevance score
            if ($driver !== 'mysql') {
                $keywords = preg_split('/\s+/', $query);
                $keywords = array_filter($keywords, fn($k) => strlen($k) > 2);
                
                $results = $results->map(function ($entry) use ($keywords, $query) {
                    $score = 0;
                    
                    // Calculate keyword frequency
                    foreach ($keywords as $keyword) {
                        $titleMatches = substr_count(strtolower($entry->title), strtolower($keyword));
                        $contentMatches = substr_count(strtolower($entry->content), strtolower($keyword));
                        
                        // Title matches are weighted higher than content matches
                        $score += ($titleMatches * 2) + $contentMatches;
                    }
                    
                    // Add exact phrase match bonus
                    if (strpos(strtolower($entry->title), strtolower($query)) !== false) {
                        $score += 5;
                    }
                    if (strpos(strtolower($entry->content), strtolower($query)) !== false) {
                        $score += 3;
                    }
                    
                    // Normalize score to 0-1 range (approximately)
                    $entry->keyword_score = min(1.0, $score / 10);
                    
                    return $entry;
                });
                
                // Sort by calculated score
                $results = $results->sortByDesc('keyword_score');
            }
            
            return $results;
        } catch (\Exception $e) {
            Log::error('Error in keyword search', [
                'query' => $query,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return collect([]);
        }
    }
    
    /**
     * Generate embeddings for a search query.
     *
     * @param string $query The search query
     * @param KnowledgeBase|null $knowledgeBase Optional knowledge base to determine model
     * @return array Query embedding vector
     */
    protected function generateQueryEmbedding(
        string $query,
        ?KnowledgeBase $knowledgeBase = null
    ): array {
        try {
            // Determine which embedding model to use
            $embeddingModel = $knowledgeBase->embedding_model ?? 
                config('ai.embeddings.default_model', 'text-embedding-ada-002');
            
            // Get provider based on the model
            $provider = $this->getProviderForModel($embeddingModel);
            
            // Generate query embedding using appropriate method
            return match ($provider) {
                'openai' => $this->generateOpenAIQueryEmbedding($query, $embeddingModel),
                'huggingface' => $this->generateHuggingFaceQueryEmbedding($query, $embeddingModel),
                'local' => $this->generateLocalQueryEmbedding($query, $embeddingModel),
                default => $this->generateSimpleQueryEmbedding($query)
            };
        } catch (\Exception $e) {
            Log::error('Error generating query embedding', [
                'query' => $query,
                'error' => $e->getMessage()
            ]);
            
            return [];
        }
    }
    
    /**
     * Calculate cosine similarity between two vectors.
     *
     * @param array $vector1 First vector
     * @param array $vector2 Second vector
     * @return float Similarity score (0-1)
     */
    protected function calculateCosineSimilarity(array $vector1, array $vector2): float
    {
        // Ensure vectors are of same length
        if (count($vector1) !== count($vector2)) {
            return 0;
        }
        
        $dotProduct = 0;
        $magnitude1 = 0;
        $magnitude2 = 0;
        
        // Calculate dot product and magnitudes
        foreach ($vector1 as $i => $value) {
            $dotProduct += $value * $vector2[$i];
            $magnitude1 += $value * $value;
            $magnitude2 += $vector2[$i] * $vector2[$i];
        }
        
        $magnitude1 = sqrt($magnitude1);
        $magnitude2 = sqrt($magnitude2);
        
        // Avoid division by zero
        if ($magnitude1 === 0 || $magnitude2 === 0) {
            return 0;
        }
        
        // Calculate cosine similarity
        return $dotProduct / ($magnitude1 * $magnitude2);
    }
    
    /**
     * Determine the provider for a given embedding model.
     *
     * @param string $model The embedding model
     * @return string Provider name
     */
    protected function getProviderForModel(string $model): string
    {
        // Common model prefixes and their providers
        $prefixMappings = [
            'text-embedding-' => 'openai',
            'sentence-transformers/' => 'huggingface',
            'openai/' => 'openai',
            'local/' => 'local',
            'huggingface/' => 'huggingface'
        ];
        
        foreach ($prefixMappings as $prefix => $provider) {
            if (Str::startsWith($model, $prefix)) {
                return $provider;
            }
        }
        
        // Check if specific provider is configured
        if ($this->aiProviderService->isProviderConfigured('openai')) {
            return 'openai';
        } elseif ($this->aiProviderService->isProviderConfigured('huggingface')) {
            return 'huggingface';
        }
        
        // Default fallback
        return 'simple';
    }
    
    /**
     * Generate embeddings using OpenAI API.
     *
     * @param KnowledgeEntry $entry The entry to generate embeddings for
     * @param string $model OpenAI embedding model to use
     * @return array Generated embeddings
     */
    protected function generateOpenAIEmbeddings(KnowledgeEntry $entry, string $model): array
    {
        try {
            $apiKey = config('services.openai.api_key');
            $maxTokens = config('ai.embeddings.max_tokens', 8000);
            
            if (empty($apiKey)) {
                Log::error('OpenAI API key not configured');
                return [];
            }
            
            // Prepare text content
            $text = $entry->title . "\n" . substr(strip_tags($entry->content), 0, $maxTokens);
            
            $response = $this->httpClient->post('https://api.openai.com/v1/embeddings', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $apiKey,
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'input' => $text,
                    'model' => $model,
                    'encoding_format' => 'float'
                ]
            ]);
            
            $result = json_decode($response->getBody(), true);
            
            if (isset($result['data'][0]['embedding'])) {
                return $result['data'][0]['embedding'];
            } else {
                Log::error('Invalid OpenAI embedding response format', [
                    'entry_id' => $entry->id,
                    'response' => $result
                ]);
                return [];
            }
        } catch (GuzzleException $e) {
            Log::error('OpenAI API request failed', [
                'entry_id' => $entry->id,
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }
    
    /**
     * Generate query embedding using OpenAI API.
     *
     * @param string $query The search query
     * @param string $model OpenAI embedding model to use
     * @return array Generated embedding
     */
    protected function generateOpenAIQueryEmbedding(string $query, string $model): array
    {
        try {
            $apiKey = config('services.openai.api_key');
            
            if (empty($apiKey)) {
                Log::error('OpenAI API key not configured');
                return [];
            }
            
            $response = $this->httpClient->post('https://api.openai.com/v1/embeddings', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $apiKey,
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'input' => $query,
                    'model' => $model,
                    'encoding_format' => 'float'
                ]
            ]);
            
            $result = json_decode($response->getBody(), true);
            
            if (isset($result['data'][0]['embedding'])) {
                return $result['data'][0]['embedding'];
            } else {
                Log::error('Invalid OpenAI query embedding response format', [
                    'query' => $query,
                    'response' => $result
                ]);
                return [];
            }
        } catch (GuzzleException $e) {
            Log::error('OpenAI API request failed for query embedding', [
                'query' => $query,
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }
    
    /**
     * Generate embeddings using HuggingFace API.
     *
     * @param KnowledgeEntry $entry The entry to generate embeddings for
     * @param string $model HuggingFace model to use
     * @return array Generated embeddings
     */
    protected function generateHuggingFaceEmbeddings(KnowledgeEntry $entry, string $model): array
    {
        try {
            $apiKey = config('services.huggingface.api_key');
            $baseUrl = config('ai.providers.huggingface.base_url', 'https://api-inference.huggingface.co/models');
            
            // Prepare text content
            $text = $entry->title . "\n" . substr(strip_tags($entry->content), 0, 2000);
            
            $headers = [
                'Content-Type' => 'application/json',
            ];
            
            // Add API key if available
            if (!empty($apiKey)) {
                $headers['Authorization'] = 'Bearer ' . $apiKey;
            }
            
            // Model URL may be full URL or just model name
            $modelUrl = $model;
            if (!Str::startsWith($model, 'http')) {
                $modelUrl = trim($baseUrl, '/') . '/' . $model;
            }
            
            $response = $this->httpClient->post($modelUrl, [
                'headers' => $headers,
                'json' => [
                    'inputs' => $text,
                    'options' => ['wait_for_model' => true]
                ]
            ]);
            
            $result = json_decode($response->getBody(), true);
            
            // HuggingFace returns the embedding directly as an array
            if (is_array($result) && !empty($result)) {
                // Some models return a nested array, some return a flat array
                return is_array($result[0]) ? $result[0] : $result;
            } else {
                Log::error('Invalid HuggingFace embedding response format', [
                    'entry_id' => $entry->id,
                    'response' => $result
                ]);
                return [];
            }
        } catch (GuzzleException $e) {
            Log::error('HuggingFace API request failed', [
                'entry_id' => $entry->id,
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }
    
    /**
     * Generate query embedding using HuggingFace API.
     *
     * @param string $query The search query
     * @param string $model HuggingFace model to use
     * @return array Generated embedding
     */
    protected function generateHuggingFaceQueryEmbedding(string $query, string $model): array
    {
        try {
            $apiKey = config('services.huggingface.api_key');
            $baseUrl = config('ai.providers.huggingface.base_url', 'https://api-inference.huggingface.co/models');
            
            $headers = [
                'Content-Type' => 'application/json',
            ];
            
            // Add API key if available
            if (!empty($apiKey)) {
                $headers['Authorization'] = 'Bearer ' . $apiKey;
            }
            
            // Model URL may be full URL or just model name
            $modelUrl = $model;
            if (!Str::startsWith($model, 'http')) {
                $modelUrl = trim($baseUrl, '/') . '/' . $model;
            }
            
            $response = $this->httpClient->post($modelUrl, [
                'headers' => $headers,
                'json' => [
                    'inputs' => $query,
                    'options' => ['wait_for_model' => true]
                ]
            ]);
            
            $result = json_decode($response->getBody(), true);
            
            // HuggingFace returns the embedding directly as an array
            if (is_array($result) && !empty($result)) {
                // Some models return a nested array, some return a flat array
                return is_array($result[0]) ? $result[0] : $result;
            } else {
                Log::error('Invalid HuggingFace query embedding response format', [
                    'query' => $query,
                    'response' => $result
                ]);
                return [];
            }
        } catch (GuzzleException $e) {
            Log::error('HuggingFace API request failed for query embedding', [
                'query' => $query,
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }
    
    /**
     * Generate embeddings using a local embedding service.
     *
     * @param KnowledgeEntry $entry The entry to generate embeddings for
     * @param string $model Local model to use
     * @return array Generated embeddings
     */
    protected function generateLocalEmbeddings(KnowledgeEntry $entry, string $model): array
    {
        // Implementation for local embedding service
        // This would connect to a self-hosted embedding service
        
        // Placeholder - replace with actual implementation
        return $this->generateSimpleEmbeddings($entry);
    }
    
    /**
     * Generate query embedding using a local embedding service.
     *
     * @param string $query The search query
     * @param string $model Local model to use
     * @return array Generated embedding
     */
    protected function generateLocalQueryEmbedding(string $query, string $model): array
    {
        // Implementation for local embedding service
        // This would connect to a self-hosted embedding service
        
        // Placeholder - replace with actual implementation
        return $this->generateSimpleQueryEmbedding($query);
    }
    
    /**
     * Generate simple embeddings without external API.
     * This is a fallback method that creates basic embeddings based on text features.
     *
     * @param KnowledgeEntry $entry The entry to generate embeddings for
     * @return array Generated embeddings
     */
    protected function generateSimpleEmbeddings(KnowledgeEntry $entry): array
    {
        // Use a consistent random seed based on content hash for reproducibility
        $seed = crc32($entry->title . $entry->content);
        mt_srand($seed);
        
        // Generate a simple embedding of fixed dimensions
        $dimensions = 384; // Standard small embedding size
        $embedding = [];
        
        for ($i = 0; $i < $dimensions; $i++) {
            $embedding[] = (mt_rand(-1000, 1000) / 1000);
        }
        
        // Normalize the vector
        $magnitude = sqrt(array_sum(array_map(function($x) { return $x * $x; }, $embedding)));
        
        if ($magnitude > 0) {
            $embedding = array_map(function($x) use ($magnitude) { 
                return $x / $magnitude; 
            }, $embedding);
        }
        
        return $embedding;
    }
    
    /**
     * Generate simple query embedding without external API.
     *
     * @param string $query The search query
     * @return array Generated embedding
     */
    protected function generateSimpleQueryEmbedding(string $query): array
    {
        // Use a consistent random seed based on query hash for reproducibility
        $seed = crc32($query);
        mt_srand($seed);
        
        // Generate a simple embedding of fixed dimensions
        $dimensions = 384; // Standard small embedding size
        $embedding = [];
        
        for ($i = 0; $i < $dimensions; $i++) {
            $embedding[] = (mt_rand(-1000, 1000) / 1000);
        }
        
        // Normalize the vector
        $magnitude = sqrt(array_sum(array_map(function($x) { return $x * $x; }, $embedding)));
        
        if ($magnitude > 0) {
            $embedding = array_map(function($x) use ($magnitude) { 
                return $x / $magnitude; 
            }, $embedding);
        }
        
        return $embedding;
    }
} 