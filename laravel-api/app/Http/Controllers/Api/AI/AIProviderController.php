<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\AI;

use App\Http\Controllers\Controller;
use App\Services\AI\AIProviderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AIProviderController extends Controller
{
    public function __construct(private readonly AIProviderService $aiProviderService) {}

    /**
     * Get all available AI providers
     */
    public function getProviders(): JsonResponse
    {
        return $this->aiProviderService->getProviders();
    }

    /**
     * Get a specific provider's details
     */
    public function getProvider(string $providerId): JsonResponse
    {
        return $this->aiProviderService->getProvider($providerId);
    }

    /**
     * Configure a provider with API key and settings
     */
    public function configureProvider(Request $request, string $providerId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'apiKey' => 'required|string',
            'baseUrl' => 'sometimes|string|url',
            'organizationId' => 'sometimes|string',
            'defaultModel' => 'sometimes|string',
            'customSettings' => 'sometimes|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        return $this->aiProviderService->configureProvider($providerId, $request->all());
    }

    /**
     * Test a provider connection with the given API key
     */
    public function testProviderConnection(Request $request, string $providerId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'apiKey' => 'required|string',
            'baseUrl' => 'sometimes|string|url',
            'organizationId' => 'sometimes|string',
            'customSettings' => 'sometimes|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        return $this->aiProviderService->testConnection($providerId, $request->all());
    }

    /**
     * Enable or disable a provider
     */
    public function toggleProviderStatus(Request $request, string $providerId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'isEnabled' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        return $this->aiProviderService->toggleProviderStatus($providerId, $request->boolean('isEnabled'));
    }

    /**
     * Get models available for a specific provider
     */
    public function getProviderModels(string $providerId): JsonResponse
    {
        return $this->aiProviderService->getProviderModels($providerId);
    }

    /**
     * Set the default model for a provider
     */
    public function setDefaultModel(Request $request, string $providerId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'modelId' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        return $this->aiProviderService->setDefaultModel($providerId, $request->input('modelId'));
    }
}
