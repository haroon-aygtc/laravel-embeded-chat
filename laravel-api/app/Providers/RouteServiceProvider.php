<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * Define your route model bindings, pattern filters, etc.
     */
    public function boot(): void
    {
        $this->configureRateLimiting();

        // Register routes
        $this->routes(function () {
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/api.php'));

            Route::middleware('web')
                ->group(base_path('routes/web.php'));
        });
    }

    /**
     * Configure the rate limiters for the application.
     */
    protected function configureRateLimiting(): void
    {
        // Global rate limiting
        RateLimiter::for('api', function (Request $request) {
            $user = $request->user()?->id ?: $request->ip();
            
            return Limit::perMinute(60)->by($user);
        });

        // Login attempts limiting
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by($request->input('email') . $request->ip())
                ->response(function () {
                    return response()->json([
                        'success' => false,
                        'error' => [
                            'code' => 'ERR_TOO_MANY_ATTEMPTS',
                            'message' => 'Too many login attempts. Please try again later.',
                        ],
                        'meta' => [
                            'timestamp' => now()->toIso8601String(),
                        ],
                    ], Response::HTTP_TOO_MANY_REQUESTS);
                });
        });
    }
} 