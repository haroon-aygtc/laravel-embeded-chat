<?php

declare(strict_types=1);

namespace App\Models\AI;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class FollowUpConfig extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'follow_up_configs';

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
        'user_id',
        'name',
        'enable_follow_up_questions',
        'max_follow_up_questions',
        'show_follow_up_as',
        'generate_automatically',
        'is_default',
        'predefined_question_sets',
        'topic_based_question_sets',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'enable_follow_up_questions' => 'boolean',
        'max_follow_up_questions' => 'integer',
        'generate_automatically' => 'boolean',
        'is_default' => 'boolean',
        'predefined_question_sets' => 'array',
        'topic_based_question_sets' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [];

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

        // When creating a default configuration, ensure it's the only default
        static::creating(function ($config) {
            if ($config->is_default) {
                // Set all other configs to non-default
                static::where('is_default', true)->update(['is_default' => false]);
            }
        });

        // When updating to make a config default, ensure it's the only default
        static::updating(function ($config) {
            if ($config->isDirty('is_default') && $config->is_default) {
                // Set all other configs to non-default
                static::where('id', '!=', $config->id)
                      ->where('is_default', true)
                      ->update(['is_default' => false]);
            }
        });
    }

    /**
     * Get the user that owns the configuration.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the follow-up questions associated with this configuration.
     */
    public function questions(): HasMany
    {
        return $this->hasMany(FollowUpQuestion::class, 'config_id');
    }
}
