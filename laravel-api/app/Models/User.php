<?php

declare(strict_types=1);

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'is_active',
        'avatar',
        'last_login',
        'bio',
        'security_settings',
        'notifyOnMessage',
        'notifyOnMention',
        'emailDigest',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_active' => 'boolean',
        'last_login' => 'datetime',
        'security_settings' => 'json',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'isAdmin',
    ];

    /**
     * Get the user's activities
     */
    public function activities(): HasMany
    {
        return $this->hasMany(UserActivity::class);
    }

    /**
     * Get the user's feedback
     */
    public function feedback(): HasMany
    {
        return $this->hasMany(Feedback::class);
    }

    /**
     * Check if the user has admin privileges
     *
     * @return bool
     */
    public function getIsAdminAttribute(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Check if user has a specific role
     *
     * @param string|array $roles
     * @return bool
     */
    public function hasRole(string|array $roles): bool
    {
        if (is_string($roles)) {
            return $this->role === $roles;
        }

        return in_array($this->role, $roles);
    }

    /**
     * Check if user has a specific permission
     *
     * @param string $permission
     * @return bool
     */
    public function hasPermission(string $permission): bool
    {
        $permissionMap = [
            'admin' => ['*'],
            'editor' => [
                'create_context_rule',
                'edit_context_rule',
                'delete_context_rule',
                'create_knowledge_base',
                'edit_knowledge_base',
                'delete_knowledge_base',
                'create_prompt_template',
                'edit_prompt_template',
                'delete_prompt_template',
                'manage_chat',
                'view_analytics',
                'view_logs',
            ],
            'viewer' => [
                'view_analytics',
                'view_logs',
                'view_context_rule',
                'view_knowledge_base',
                'view_prompt_template',
            ],
            'user' => [
                'view_own_resources',
                'edit_own_resources',
                'manage_own_chat',
            ],
        ];

        // Admin has all permissions
        if ($this->role === 'admin') {
            return true;
        }

        $rolePermissions = $permissionMap[$this->role] ?? [];

        // Check for wildcard
        if (in_array('*', $rolePermissions)) {
            return true;
        }

        return in_array($permission, $rolePermissions);
    }
}
