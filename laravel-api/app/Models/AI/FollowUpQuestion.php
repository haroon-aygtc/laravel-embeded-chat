<?php

declare(strict_types=1);

namespace App\Models\AI;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FollowUpQuestion extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'follow_up_questions';

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
        'config_id',
        'question',
        'display_order',
        'is_active',
        'priority',
        'display_position',
        'category',
        'metadata',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'display_order' => 'integer',
        'is_active' => 'boolean',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the configuration that owns the question.
     */
    public function config(): BelongsTo
    {
        return $this->belongsTo(FollowUpConfig::class, 'config_id');
    }
}
