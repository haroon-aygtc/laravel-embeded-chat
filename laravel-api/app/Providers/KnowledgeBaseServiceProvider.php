<?php

namespace App\Providers;

use App\Services\KnowledgeBase\KnowledgeBaseService;
use Illuminate\Support\ServiceProvider;

class KnowledgeBaseServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(KnowledgeBaseService::class, function ($app) {
            return new KnowledgeBaseService();
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
