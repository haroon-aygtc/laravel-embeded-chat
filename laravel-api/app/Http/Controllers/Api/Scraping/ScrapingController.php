<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Scraping;

use App\Http\Controllers\Controller;
use App\Services\Scraping\ScrapingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScrapingController extends Controller
{
    public function __construct(private readonly ScrapingService $scrapingService) {}

    public function getSelectors(): JsonResponse
    {
        return $this->scrapingService->getSelectors();
    }

    public function getDatabaseTables(): JsonResponse
    {
        return $this->scrapingService->getDatabaseTables();
    }

    public function proxyUrl(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'url' => 'required|url',
        ]);

        return $this->scrapingService->proxyUrl($validated['url']);
    }
}
