<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\AI\ContextRule;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Widget extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'description',
        'user_id',
        'context_rule_id',
        'knowledge_base_ids',
        'title',
        'subtitle',
        'visual_settings',
        'behavioral_settings',
        'content_settings',
        'allowed_domains',
        'is_active'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'visual_settings' => 'array',
        'behavioral_settings' => 'array',
        'content_settings' => 'array',
        'knowledge_base_ids' => 'array',
        'allowed_domains' => 'array',
        'is_active' => 'boolean'
    ];

    /**
     * Get the user that owns the widget.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the context rule associated with the widget.
     */
    public function contextRule(): BelongsTo
    {
        return $this->belongsTo(ContextRule::class);
    }

    /**
     * Get the chat sessions associated with the widget.
     */
    public function chatSessions(): HasMany
    {
        return $this->hasMany(ChatSession::class);
    }
} 