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
        // Default role-based permissions
        Gate::define('admin', function ($user) {
            return $user->role === 'admin';
        });
        
        Gate::define('user', function ($user) {
            return in_array($user->role, ['admin', 'user']);
        });
    }
} 