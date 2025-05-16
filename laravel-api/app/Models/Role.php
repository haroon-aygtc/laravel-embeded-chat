<?php

declare(strict_types=1);

namespace App\Models;

use App\Support\Permissions;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'slug',
        'description',
        'is_default',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_default' => 'boolean',
    ];

    /**
     * Get the users for the role.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get the permissions for this role.
     */
    public function permissions(): array
    {
        return match($this->slug) {
            'super_admin' => ['*'], // Super admin has all permissions
            'admin' => ['*'], // Admin has all permissions
            'editor' => Permissions::EDITOR_PERMISSIONS,
            'viewer' => Permissions::VIEWER_PERMISSIONS,
            'user' => Permissions::USER_PERMISSIONS,
            default => [],
        };
    }

    /**
     * Check if this role has a specific permission
     */
    public function hasPermission(string $permission): bool
    {
        $permissions = $this->permissions();

        // Wildcard permission grants access to everything
        if (in_array('*', $permissions)) {
            return true;
        }

        return in_array($permission, $permissions);
    }
}
