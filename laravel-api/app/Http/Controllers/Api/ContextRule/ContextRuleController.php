<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\ContextRule;

use App\Http\Controllers\Controller;
use App\Models\ContextRule;
use App\Services\ContextRule\ContextRuleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContextRuleController extends Controller
{
    /**
     * Create a new controller instance.
     */
    public function __construct(private readonly ContextRuleService $contextRuleService)
    {
    }

    /**
     * Get all context rules
     */
    public function index(): JsonResponse
    {
        $contextRules = $this->contextRuleService->getAllContextRules();

        return response()->json($contextRules);
    }

    /**
     * Get a specific context rule
     */
    public function show(string $id): JsonResponse
    {
        $contextRule = $this->contextRuleService->getContextRuleById($id);

        if (!$contextRule) {
            return response()->json(['message' => 'Context rule not found'], 404);
        }

        return response()->json($contextRule);
    }

    /**
     * Create a new context rule
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'content' => 'required|string',
            'is_active' => 'boolean',
        ]);

        $contextRule = $this->contextRuleService->createContextRule($validated);

        return response()->json($contextRule, 201);
    }

    /**
     * Update an existing context rule
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'string|max:255',
            'description' => 'nullable|string',
            'content' => 'string',
            'is_active' => 'boolean',
        ]);

        $contextRule = $this->contextRuleService->updateContextRule($id, $validated);

        if (!$contextRule) {
            return response()->json(['message' => 'Context rule not found'], 404);
        }

        return response()->json($contextRule);
    }

    /**
     * Delete a context rule
     */
    public function destroy(string $id): JsonResponse
    {
        $success = $this->contextRuleService->deleteContextRule($id);

        if (!$success) {
            return response()->json(['message' => 'Context rule not found'], 404);
        }

        return response()->json(['message' => 'Context rule deleted successfully']);
    }

    /**
     * Get context rules for a specific user
     */
    public function getUserRules(string $userId): JsonResponse
    {
        return $this->contextRuleService->getUserRules($userId);
    }

    /**
     * Get the default context rule for a user
     */
    public function getDefaultRule(string $userId): JsonResponse
    {
        return $this->contextRuleService->getDefaultRule($userId);
    }

    /**
     * Set a context rule as default for the current user
     */
    public function setDefault(string $id): JsonResponse
    {
        return $this->contextRuleService->setDefault($id);
    }

    /**
     * Test a context rule with provided input
     */
    public function testRule(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'input' => 'required|string',
            'parameters' => 'sometimes|array',
        ]);

        return $this->contextRuleService->testRule($id, $validated);
    }

    /**
     * Validate a context rule format/syntax
     */
    public function validateRule(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'content' => 'required|string',
        ]);

        return $this->contextRuleService->validateRule($validated['content']);
    }

    /**
     * Get available context rule templates
     */
    public function getTemplates(): JsonResponse
    {
        return $this->contextRuleService->getTemplates();
    }

    /**
     * Get a specific context rule template
     */
    public function getTemplate(string $id): JsonResponse
    {
        return $this->contextRuleService->getTemplate($id);
    }

    /**
     * Get knowledge bases associated with a context rule
     */
    public function getKnowledgeBases(string $ruleId): JsonResponse
    {
        return $this->contextRuleService->getKnowledgeBases($ruleId);
    }
}
