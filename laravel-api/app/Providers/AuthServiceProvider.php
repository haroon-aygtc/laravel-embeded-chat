<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\Role;
use App\Support\Permissions;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        // Define any policies here
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        // Register all permission gates
        foreach (Permissions::ALL_PERMISSIONS as $permission) {
            Gate::define($permission, function ($user) use ($permission) {
                return $user->hasPermission($permission);
            });
        }

        // Role-based Gates
        Gate::define('super_admin', function ($user) {
            return $user->isSuperAdmin;
        });

        Gate::define('admin', function ($user) {
            return $user->isAdmin || $user->isSuperAdmin;
        });

        Gate::define('editor', function ($user) {
            return $user->hasRole(['admin', 'editor']) || $user->isSuperAdmin;
        });

        Gate::define('viewer', function ($user) {
            return $user->hasRole(['admin', 'editor', 'viewer']) || $user->isSuperAdmin;
        });

        Gate::define('user', function ($user) {
            return $user->hasRole(['admin', 'editor', 'viewer', 'user']) || $user->isSuperAdmin;
        });

        // Resource ownership gates
        Gate::define('edit-own-resource', function ($user, $resource) {
            if ($user->isAdmin || $user->isSuperAdmin) {
                return true;
            }

            return $user->id === $resource->user_id && $user->hasPermission('edit_own_resources');
        });

        Gate::define('view-own-resource', function ($user, $resource) {
            if ($user->isAdmin || $user->isSuperAdmin) {
                return true;
            }

            return $user->id === $resource->user_id && $user->hasPermission('view_own_resources');
        });
    }
}
