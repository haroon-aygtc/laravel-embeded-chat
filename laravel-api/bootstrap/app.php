<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Global middleware
        $middleware->append(Illuminate\Foundation\Http\Middleware\PreventRequestsDuringMaintenance::class);
        $middleware->append(Illuminate\Http\Middleware\HandleCors::class);
        $middleware->append(Illuminate\Foundation\Http\Middleware\ValidatePostSize::class);
        $middleware->append(App\Http\Middleware\TrimStrings::class);
        $middleware->append(Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull::class);

        // Web group
        $middleware->group('web', [
            App\Http\Middleware\VerifyCsrfToken::class,
            Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
            Illuminate\Session\Middleware\StartSession::class,
            Illuminate\View\Middleware\ShareErrorsFromSession::class,
            Illuminate\Routing\Middleware\SubstituteBindings::class,
        ]);

        // API group
        $middleware->group('api', [
            Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            Illuminate\Routing\Middleware\ThrottleRequests::class.':api',
            Illuminate\Routing\Middleware\SubstituteBindings::class,
            App\Http\Middleware\ApiResponseMiddleware::class,
        ]);

        // Route middleware aliases
        $middleware->alias([
            'auth' => App\Http\Middleware\Authenticate::class,
            'guest' => App\Http\Middleware\RedirectIfAuthenticated::class,
            'signed' => App\Http\Middleware\ValidateSignature::class,
            'throttle' => Illuminate\Routing\Middleware\ThrottleRequests::class,
            'verified' => Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
