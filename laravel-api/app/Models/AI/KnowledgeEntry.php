<?php

declare(strict_types=1);

namespace App\Models\AI;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

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
        'embeddings',
        'is_active',
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
     * In a production environment, this would call an embedding API
     * like OpenAI, Cohere, or an open-source model.
     */
    public function generateEmbeddings(): bool
    {
        try {
            // For a real implementation, call an embeddings API here
            // For example:
            // $embeddingService = app(EmbeddingService::class);
            // $embedding = $embeddingService->generateEmbedding($this->content);

            // For now, we'll just create a simple mock embedding (random vector)
            $mockEmbedding = $this->createMockEmbedding();

            // Store the embedding
            $this->vector_embedding = $mockEmbedding;
            $this->save();

            return true;
        } catch (\Exception $e) {
            // Log the error
            \Log::error('Failed to generate embeddings for knowledge entry', [
                'entry_id' => $this->id,
                'error' => $e->getMessage()
            ]);

            return false;
        }
    }

    /**
     * Create a mock embedding vector for demonstration purposes.
     * In a real application, this would be replaced with an actual embedding model.
     */
    private function createMockEmbedding(int $dimensions = 384): array
    {
        $vector = [];

        // Create a deterministic "embedding" based on content hash
        // This way similar content will have somewhat similar vectors
        $contentHash = md5($this->title . ' ' . substr($this->content, 0, 1000));

        // Seed the random generator with the hash to make it deterministic
        $seed = hexdec(substr($contentHash, 0, 8));
        mt_srand($seed);

        // Generate the mock embedding vector
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
}
