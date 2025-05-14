<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PromptTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'content',
        'variables',
        'is_active',
        'is_public',
        'user_id',
        'metadata',
    ];

    protected $casts = [
        'variables' => 'array',
        'metadata' => 'array',
        'is_active' => 'boolean',
        'is_public' => 'boolean',
    ];

    /**
     * Get the user that owns the template
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
} 