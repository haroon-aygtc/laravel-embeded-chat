<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\PromptTemplate;

use App\Http\Controllers\Controller;
use App\Services\PromptTemplate\PromptTemplateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PromptTemplateController extends Controller
{
    public function __construct(
        private readonly PromptTemplateService $promptTemplateService
    ) {
    }
    
    /**
     * Get all prompt templates
     */
    public function index(): JsonResponse
    {
        return $this->promptTemplateService->getAllTemplates();
    }
    
    /**
     * Get a prompt template by ID
     */
    public function show(string $id): JsonResponse
    {
        return $this->promptTemplateService->getTemplate($id);
    }
    
    /**
     * Create a new prompt template
     */
    public function store(Request $request): JsonResponse
    {
        return $this->promptTemplateService->createTemplate($request->all());
    }
    
    /**
     * Update a prompt template
     */
    public function update(Request $request, string $id): JsonResponse
    {
        return $this->promptTemplateService->updateTemplate($id, $request->all());
    }
    
    /**
     * Delete a prompt template
     */
    public function destroy(string $id): JsonResponse
    {
        return $this->promptTemplateService->deleteTemplate($id);
    }
    
    /**
     * Preview a prompt template with sample data
     */
    public function preview(Request $request): JsonResponse
    {
        return $this->promptTemplateService->previewTemplate($request->all());
    }
} 