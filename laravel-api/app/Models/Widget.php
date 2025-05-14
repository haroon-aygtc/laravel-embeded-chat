<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\AI\ContextRule;
use App\Models\Chat\ChatSession;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Widget extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    /**
     * Indicates if the model's ID is auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = false;

    /**
     * The data type of the auto-incrementing ID.
     *
     * @var string
     */
    protected $keyType = 'string';

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
        'is_active',
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
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'deleted_at',
    ];

    /**
     * Bootstrap the model and its traits.
     *
     * @return void
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            // Set default settings if not provided
            if (empty($model->visual_settings)) {
                $model->visual_settings = [
                    'position' => 'bottom-right',
                    'theme' => 'light',
                    'colors' => [
                        'primary' => '#4F46E5',
                        'secondary' => '#10B981',
                        'background' => '#FFFFFF',
                        'text' => '#1F2937'
                    ],
                    'style' => 'rounded',
                    'width' => '380px',
                    'height' => '600px',
                    'showHeader' => true,
                    'showFooter' => true
                ];
            }

            if (empty($model->behavioral_settings)) {
                $model->behavioral_settings = [
                    'autoOpen' => false,
                    'openDelay' => 3,
                    'notification' => true,
                    'mobileBehavior' => 'standard',
                    'sounds' => false
                ];
            }

            if (empty($model->content_settings)) {
                $model->content_settings = [
                    'welcomeMessage' => 'Hello! How can I assist you today?',
                    'placeholderText' => 'Type your message...',
                    'botName' => 'AI Assistant',
                    'avatarUrl' => null
                ];
            }
        });
    }

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
        return $this->belongsTo(ContextRule::class, 'context_rule_id');
    }

    /**
     * Get the chat sessions associated with the widget.
     */
    public function chatSessions(): HasMany
    {
        return $this->hasMany(ChatSession::class);
    }

    /**
     * Get the knowledge bases associated with the widget.
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function knowledgeBases()
    {
        if (!$this->knowledge_base_ids) {
            return collect();
        }

        return \App\Models\AI\KnowledgeBase::whereIn('id', $this->knowledge_base_ids)->get();
    }
}
