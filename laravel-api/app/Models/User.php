<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
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
        'role_id',
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
        'isSuperAdmin',
    ];

    /**
     * Get the user's role
     */
    public function roleModel(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

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
        if ($this->role_id) {
            return $this->roleModel?->slug === 'admin';
        }
        return $this->role === 'admin';
    }

    /**
     * Check if the user has super admin privileges
     *
     * @return bool
     */
    public function getIsSuperAdminAttribute(): bool
    {
        if ($this->role_id) {
            return $this->roleModel?->slug === 'super_admin';
        }
        return false;
    }

    /**
     * Check if user has a specific role
     *
     * @param string|array $roles
     * @return bool
     */
    public function hasRole(string|array $roles): bool
    {
        if ($this->isSuperAdmin) {
            return true;
        }

        if ($this->role_id && $this->roleModel) {
            $roleSlug = $this->roleModel->slug;

            if (is_string($roles)) {
                return $roleSlug === $roles;
            }

            return in_array($roleSlug, $roles);
        }

        // Legacy role check
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
        // Super admin has all permissions
        if ($this->isSuperAdmin) {
            return true;
        }

        // Use role model if available
        if ($this->role_id && $this->roleModel) {
            return $this->roleModel->hasPermission($permission);
        }

        // Legacy permission check - use the role string
        return match($this->role) {
            'admin' => true,
            'editor' => in_array($permission, \App\Support\Permissions::EDITOR_PERMISSIONS),
            'viewer' => in_array($permission, \App\Support\Permissions::VIEWER_PERMISSIONS),
            'user' => in_array($permission, \App\Support\Permissions::USER_PERMISSIONS),
            default => false,
        };
    }
}
