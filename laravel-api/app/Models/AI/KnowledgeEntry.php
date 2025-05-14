<?php

declare(strict_types=1);

namespace App\Models\AI;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class KnowledgeEntry extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'knowledge_entries';

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'id';

    /**
     * The "type" of the primary key ID.
     *
     * @var string
     */
    protected $keyType = 'string';

    /**
     * Indicates if the IDs are auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id',
        'knowledge_base_id',
        'title',
        'content',
        'source_url',
        'source_type',
        'summary',
        'tags',
        'metadata',
        'vector_embedding',
        'is_active',
        'chunk_id',
        'chunk_index',
        'parent_entry_id',
        'search_relevance_score',
        'keyword_highlights',
        'vector_indexed',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'metadata' => 'array',
        'tags' => 'array',
        'is_active' => 'boolean',
        'vector_embedding' => 'array',
        'vector_indexed' => 'boolean',
        'chunk_index' => 'integer',
        'search_relevance_score' => 'float',
        'keyword_highlights' => 'array',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = ['similarity_score'];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }

            // If summary is not provided, generate one automatically
            if (empty($model->summary) && !empty($model->content)) {
                $model->summary = Str::limit(strip_tags($model->content), 200);
            }
        });
    }

    /**
     * Get the knowledge base that owns the entry.
     */
    public function knowledgeBase(): BelongsTo
    {
        return $this->belongsTo(KnowledgeBase::class, 'knowledge_base_id');
    }

    /**
     * Generate embeddings for this entry's content.
     * Supports multiple embedding providers with HuggingFace as free alternative.
     */
    public function generateEmbeddings(): bool
    {
        try {
            // Get configured provider from config
            $embedProvider = config('ai.embeddings.default_provider', 'huggingface');
            
            // Check if AIProviderService is available and properly configured
            $aiProviderService = app()->make('App\Services\AI\AIProviderService');
            if ($aiProviderService && method_exists($aiProviderService, 'isProviderConfigured')) {
                // Use provided service when available
                if ($embedProvider === 'openai' && $aiProviderService->isProviderConfigured('openai')) {
                    return $this->generateOpenAIEmbeddings();
                } else if ($embedProvider === 'huggingface' && $aiProviderService->isProviderConfigured('huggingface')) {
                    return $this->generateHuggingFaceEmbeddings();
                }
            } else {
                // Fallback to direct config check
                if ($embedProvider === 'openai' && config('services.openai.api_key')) {
                    return $this->generateOpenAIEmbeddings();
                } else if ($embedProvider === 'huggingface') {
                    return $this->generateHuggingFaceEmbeddings();
                }
            }
            
            // If no provider is available, use simple embeddings
            $this->vector_embedding = $this->createSimpleEmbedding();
            $this->save();
            return true;
        } catch (\Exception $e) {
            // Log the error
            Log::error('Failed to generate embeddings for knowledge entry', [
                'entry_id' => $this->id,
                'error' => $e->getMessage()
            ]);

            return false;
        }
    }

    /**
     * Generate embeddings using OpenAI API.
     */
    private function generateOpenAIEmbeddings(): bool
    {
        $apiKey = config('services.openai.api_key');
        $embeddingModel = config('ai.embeddings.providers.openai.model', 'text-embedding-ada-002');
        $maxTokens = (int) config('ai.embeddings.providers.openai.max_tokens', 8000);
        
        if (empty($apiKey)) {
            Log::error('OpenAI API key not configured', [
                'entry_id' => $this->id
            ]);
            return false;
        }

        // Prepare text for embedding - combine title and content
        // Truncate to avoid token limits
        $text = $this->title . "\n" . substr(strip_tags($this->content), 0, $maxTokens);
        
        $client = new \GuzzleHttp\Client();
        
        $response = $client->post('https://api.openai.com/v1/embeddings', [
            'headers' => [
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ],
            'json' => [
                'input' => $text,
                'model' => $embeddingModel,
                'encoding_format' => 'float'
            ]
        ]);
        
        $result = json_decode($response->getBody(), true);
        
        if (isset($result['data'][0]['embedding'])) {
            // Store the embedding
            $this->vector_embedding = $result['data'][0]['embedding'];
            $this->save();
            
            return true;
        } else {
            Log::error('Invalid embedding response format', [
                'entry_id' => $this->id,
                'response' => $result
            ]);
            return false;
        }
    }

    /**
     * Generate embeddings using HuggingFace's free sentence-transformers models.
     */
    private function generateHuggingFaceEmbeddings(): bool
    {
        try {
            $apiKey = config('services.huggingface.api_key', null);
            $baseUrl = config('ai.providers.huggingface.base_url', 'https://api-inference.huggingface.co/models');
            $embeddingModel = config('ai.embeddings.providers.huggingface.model', 'sentence-transformers/all-MiniLM-L6-v2');
            $useFreeInference = config('ai.embeddings.providers.huggingface.use_free_inference', true);

            // Prepare text for embedding
            $text = $this->title . "\n" . substr(strip_tags($this->content), 0, 2000);
            
            $client = new \GuzzleHttp\Client();
            
            $headers = [
                'Content-Type' => 'application/json',
            ];
            
            // Add API key if available and not using free inference
            if (!empty($apiKey) && !$useFreeInference) {
                $headers['Authorization'] = 'Bearer ' . $apiKey;
            }
            
            // Model URL may be full URL or just model name
            $modelUrl = $embeddingModel;
            if (!Str::startsWith($embeddingModel, 'http')) {
                $modelUrl = trim($baseUrl, '/') . '/' . $embeddingModel;
            }
            
            $response = $client->post($modelUrl, [
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
                $embedding = is_array($result[0]) ? $result[0] : $result;
                
                $this->vector_embedding = $embedding;
                $this->save();
                
                return true;
            } else {
                Log::error('Invalid HuggingFace embedding response format', [
                    'entry_id' => $this->id,
                    'response' => $result
                ]);
                
                // Fallback to simple embedding
                $this->vector_embedding = $this->createSimpleEmbedding();
                $this->save();
                
                return true;
            }
        } catch (\Exception $e) {
            Log::error('Failed to generate HuggingFace embeddings', [
                'entry_id' => $this->id,
                'error' => $e->getMessage()
            ]);
            
            // Fallback to simple embedding
            $this->vector_embedding = $this->createSimpleEmbedding();
            $this->save();
            
            return true;
        }
    }

    /**
     * Create a simple embedding vector when external APIs are unavailable.
     * This is a basic approach that converts text into a vector space.
     */
    private function createSimpleEmbedding(int $dimensions = null): array
    {
        // Use configured dimensions or default
        $dimensions = $dimensions ?? config('ai.embeddings.dimensions', 384);
        
        $vector = [];
        $text = $this->title . ' ' . substr($this->content, 0, 1000);
        
        // Convert to lowercase and remove non-alphanumeric characters
        $text = preg_replace('/[^\p{L}\p{N}\s]/u', '', strtolower($text));
        
        // Split into tokens (words)
        $tokens = preg_split('/\s+/', $text, -1, PREG_SPLIT_NO_EMPTY);
        
        // Create a deterministic "embedding" based on content hash
        $contentHash = md5(implode(' ', $tokens));
        
        // Seed the random generator with the hash to make it deterministic
        $seed = hexdec(substr($contentHash, 0, 8));
        mt_srand($seed);
        
        // Generate the embedding vector
        for ($i = 0; $i < $dimensions; $i++) {
            // Generate values between -1 and 1
            $vector[] = (mt_rand(-1000, 1000) / 1000);
        }
        
        // Normalize the vector to unit length
        $magnitude = sqrt(array_sum(array_map(function($x) {
            return $x * $x;
        }, $vector)));
        
        if ($magnitude > 0) {
            for ($i = 0; $i < count($vector); $i++) {
                $vector[$i] = $vector[$i] / $magnitude;
            }
        }
        
        return $vector;
    }

    /**
     * Get similarity score attribute. This is used when returning search results.
     */
    public function getSimilarityScoreAttribute(): ?float
    {
        return $this->attributes['similarity_score'] ?? null;
    }

    /**
     * Set similarity score attribute. This is used for search results.
     */
    public function setSimilarityScoreAttribute(?float $value): void
    {
        $this->attributes['similarity_score'] = $value;
    }

    /**
     * Calculate cosine similarity between this entry's embedding and another vector.
     */
    public function calculateCosineSimilarity(array $otherVector): ?float
    {
        if (empty($this->vector_embedding) || empty($otherVector)) {
            return null;
        }

        // Ensure vectors are the same length
        if (count($this->vector_embedding) !== count($otherVector)) {
            return null;
        }

        // Calculate dot product
        $dotProduct = 0;
        $magnitudeA = 0;
        $magnitudeB = 0;

        for ($i = 0; $i < count($this->vector_embedding); $i++) {
            $dotProduct += $this->vector_embedding[$i] * $otherVector[$i];
            $magnitudeA += $this->vector_embedding[$i] * $this->vector_embedding[$i];
            $magnitudeB += $otherVector[$i] * $otherVector[$i];
        }

        $magnitudeA = sqrt($magnitudeA);
        $magnitudeB = sqrt($magnitudeB);

        // Avoid division by zero
        if ($magnitudeA == 0 || $magnitudeB == 0) {
            return 0;
        }

        // Return the cosine similarity
        return $dotProduct / ($magnitudeA * $magnitudeB);
    }

    /**
     * Get a formatted version of the content, depending on the source type.
     */
    public function getFormattedContentAttribute(): string
    {
        if ($this->source_type === 'html') {
            // Strip potentially dangerous tags for HTML content
            return strip_tags($this->content, '<p><br><ul><ol><li><h1><h2><h3><h4><h5><b><i><a>');
        }

        return $this->content;
    }

    /**
     * Get the parent entry of this chunk.
     */
    public function parentEntry()
    {
        if (empty($this->parent_entry_id)) {
            return null;
        }
        
        return static::find($this->parent_entry_id);
    }

    /**
     * Get all chunks related to this parent entry.
     */
    public function chunks()
    {
        if (empty($this->metadata['has_chunks'])) {
            return collect([]);
        }
        
        return static::where('parent_entry_id', $this->id)
            ->where('is_active', true)
            ->orderBy('chunk_index')
            ->get();
    }

    /**
     * Check if this entry has been chunked.
     */
    public function hasChunks(): bool
    {
        return !empty($this->metadata['has_chunks']) && $this->metadata['has_chunks'] === true;
    }

    /**
     * Check if this entry is a chunk of a larger document.
     */
    public function isChunk(): bool
    {
        return !empty($this->parent_entry_id) && !empty($this->chunk_id);
    }

    /**
     * Set the search relevance score for this entry.
     */
    public function setRelevanceScore(float $score): void
    {
        $this->search_relevance_score = $score;
    }

    /**
     * Generate keyword highlights for this entry.
     */
    public function generateKeywordHighlights(int $limit = 10): array
    {
        // Simple keyword extraction implementation
        $text = strtolower($this->title . ' ' . strip_tags($this->content));
        
        // Remove common stop words
        $stopWords = ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'of', 'from'];
        foreach ($stopWords as $word) {
            $text = preg_replace('/\b' . $word . '\b/', '', $text);
        }
        
        // Count word frequencies
        $words = preg_split('/\W+/', $text, -1, PREG_SPLIT_NO_EMPTY);
        $wordCounts = array_count_values($words);
        
        // Filter out short words
        $wordCounts = array_filter($wordCounts, function ($word) {
            return strlen($word) > 3;
        }, ARRAY_FILTER_USE_KEY);
        
        // Sort by frequency
        arsort($wordCounts);
        
        // Take top N keywords
        $highlights = array_slice($wordCounts, 0, $limit, true);
        
        // Calculate importance score (normalized frequency)
        $maxCount = max($wordCounts) ?: 1;
        $result = [];
        
        foreach ($highlights as $word => $count) {
            $result[$word] = round($count / $maxCount, 2);
        }
        
        $this->keyword_highlights = $result;
        return $result;
    }

    /**
     * Get related entries based on semantic similarity.
     */
    public function getSimilarEntries(int $limit = 5, float $minSimilarity = 0.7)
    {
        if (empty($this->vector_embedding)) {
            return collect([]);
        }
        
        // Get entries from the same knowledge base
        $candidates = static::where('knowledge_base_id', $this->knowledge_base_id)
            ->where('id', '!=', $this->id)
            ->whereNotNull('vector_embedding')
            ->where('vector_indexed', true)
            ->where('is_active', true)
            ->get();
        
        // Calculate similarity scores
        $scoredEntries = $candidates->map(function ($entry) {
            $similarity = $this->calculateCosineSimilarity($this->vector_embedding, $entry->vector_embedding);
            $entry->similarity_score = $similarity;
            return $entry;
        });
        
        // Filter and sort results
        return $scoredEntries
            ->filter(function ($entry) use ($minSimilarity) {
                return $entry->similarity_score >= $minSimilarity;
            })
            ->sortByDesc('similarity_score')
            ->take($limit);
    }
}
