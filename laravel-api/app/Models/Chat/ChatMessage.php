<?php

declare(strict_types=1);

namespace App\Models\Chat;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChatMessage extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'chat_messages';

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
        'chat_session_id',
        'role',
        'content',
        'attachments',
        'context_snippets',
        'is_read',
        'read_at',
        'token_count',
        'sentiment_score',
        'metadata',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'attachments' => 'json',
        'context_snippets' => 'json',
        'is_read' => 'boolean',
        'read_at' => 'datetime',
        'token_count' => 'integer',
        'sentiment_score' => 'float',
        'metadata' => 'json',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the chat session that owns the message.
     */
    public function chatSession(): BelongsTo
    {
        return $this->belongsTo(ChatSession::class);
    }

    /**
     * Get the file attachments for the message.
     */
    public function fileAttachments(): HasMany
    {
        return $this->hasMany(ChatAttachment::class, 'chat_message_id');
    }
}
