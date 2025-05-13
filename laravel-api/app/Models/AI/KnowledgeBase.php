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
}
