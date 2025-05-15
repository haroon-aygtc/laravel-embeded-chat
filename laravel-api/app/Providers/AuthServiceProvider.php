<?php

declare(strict_types=1);

namespace App\Providers;

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
        // Role-based Gates
        Gate::define('admin', function ($user) {
            return $user->role === 'admin';
        });

        Gate::define('editor', function ($user) {
            return in_array($user->role, ['admin', 'editor']);
        });

        Gate::define('viewer', function ($user) {
            return in_array($user->role, ['admin', 'editor', 'viewer']);
        });

        Gate::define('user', function ($user) {
            return in_array($user->role, ['admin', 'editor', 'viewer', 'user']);
        });

        // Permission-based Gates

        // Context Rules
        Gate::define('view-context-rules', function ($user) {
            return $user->hasPermission('view_context_rule');
        });

        Gate::define('create-context-rule', function ($user) {
            return $user->hasPermission('create_context_rule');
        });

        Gate::define('edit-context-rule', function ($user, $contextRule) {
            // Admin can edit any rule
            if ($user->isAdmin) {
                return true;
            }

            // Editor can edit rules
            if ($user->role === 'editor') {
                return true;
            }

            // Users can edit their own rules
            if ($contextRule->user_id === $user->id) {
                return true;
            }

            return false;
        });

        Gate::define('delete-context-rule', function ($user, $contextRule) {
            // Admin can delete any rule
            if ($user->isAdmin) {
                return true;
            }

            // Editor can delete rules
            if ($user->role === 'editor') {
                return true;
            }

            // Users can delete their own rules
            if ($contextRule->user_id === $user->id) {
                return true;
            }

            return false;
        });

        // Knowledge Base
        Gate::define('view-knowledge-base', function ($user) {
            return $user->hasPermission('view_knowledge_base');
        });

        Gate::define('manage-knowledge-base', function ($user) {
            return $user->hasPermission('create_knowledge_base');
        });

        // User Management
        Gate::define('manage-users', function ($user) {
            return $user->isAdmin;
        });

        // Analytics
        Gate::define('view-analytics', function ($user) {
            return $user->hasPermission('view_analytics');
        });

        // Logs
        Gate::define('view-logs', function ($user) {
            return $user->hasPermission('view_logs');
        });
    }
}