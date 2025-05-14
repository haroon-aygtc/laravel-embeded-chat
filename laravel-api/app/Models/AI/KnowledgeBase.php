<?php

declare(strict_types=1);

namespace App\Models\AI;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class KnowledgeBase extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'knowledge_bases';

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
        'user_id',
        'name',
        'description',
        'source_type',
        'metadata',
        'is_public',
        'is_active',
        'similarity_threshold',
        'embedding_model',
        'vector_search_config',
        'use_hybrid_search',
        'keyword_search_weight',
        'vector_search_weight',
        'auto_chunk_content',
        'chunk_size',
        'chunk_overlap',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'metadata' => 'json',
        'is_public' => 'boolean',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'similarity_threshold' => 'float',
        'vector_search_config' => 'json',
        'use_hybrid_search' => 'boolean',
        'keyword_search_weight' => 'integer',
        'vector_search_weight' => 'integer',
        'auto_chunk_content' => 'boolean',
        'chunk_size' => 'integer',
        'chunk_overlap' => 'integer',
    ];

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
        });
    }

    /**
     * Get the user that owns the knowledge base.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the entries associated with this knowledge base.
     */
    public function entries(): HasMany
    {
        return $this->hasMany(KnowledgeEntry::class, 'knowledge_base_id');
    }

    /**
     * Get the total number of entries in this knowledge base.
     */
    public function getEntryCountAttribute(): int
    {
        return $this->entries()->count();
    }

    /**
     * Search entries in this knowledge base.
     *
     * @param string $query The search query
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function searchEntries(string $query)
    {
        return $this->entries()
            ->whereFullText(['title', 'content'], $query)
            ->where('is_active', true)
            ->get();
    }

    /**
     * Get chunked entries for this knowledge base.
     * 
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getChunkedEntries()
    {
        return $this->entries()
            ->whereNotNull('chunk_id')
            ->whereNotNull('parent_entry_id')
            ->orderBy('chunk_index')
            ->get();
    }

    /**
     * Get parent entries (those that have been chunked)
     * 
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getParentEntries()
    {
        return $this->entries()
            ->whereNull('parent_entry_id')
            ->whereRaw("JSON_EXTRACT(metadata, '$.has_chunks') = true")
            ->get();
    }

    /**
     * Get vector-indexed entries
     * 
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getVectorIndexedEntries()
    {
        return $this->entries()
            ->where('vector_indexed', true)
            ->whereNotNull('vector_embedding')
            ->get();
    }
}
