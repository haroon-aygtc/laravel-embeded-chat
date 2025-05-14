<?php

declare(strict_types=1);

namespace App\Services\ContextRule;

use App\Models\ContextRule\ContextRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ContextRuleService
{
    /**
     * Get all context rules
     */
    public function getAllRules(Request $request): JsonResponse
    {
        $query = ContextRule::query();

        // Apply filters
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->has('tag')) {
            $tag = $request->input('tag');
            $query->whereJsonContains('tags', $tag);
        }

        if (!$request->user()->isAdmin) {
            // Only admins can see private rules created by others
            $query->where(function ($q) use ($request) {
                $q->where('is_public', true)
                  ->orWhere('user_id', $request->user()->id);
            });
        }

        // Apply sorting
        $sortField = $request->input('sort_by', 'created_at');
        $sortDirection = $request->input('sort_dir', 'desc');
        $query->orderBy($sortField, $sortDirection);

        // Apply pagination
        $perPage = $request->input('per_page', 15);
        $rules = $query->paginate($perPage);

        return response()->json($rules);
    }

    /**
     * Get a specific context rule
     */
    public function getRule(string $id): JsonResponse
    {
        $rule = ContextRule::find($id);

        if (!$rule) {
            return response()->json(['message' => 'Context rule not found'], 404);
        }

        // Check access permission
        if (!$rule->is_public && $rule->user_id !== auth()->id() && !auth()->user()->isAdmin) {
            return response()->json(['message' => 'Unauthorized access to this rule'], 403);
        }

        return response()->json($rule);
    }

    /**
     * Create a new context rule
     */
    public function createRule(array $data): JsonResponse
    {
        $rule = new ContextRule();
        $rule->id = (string) Str::uuid();
        $rule->name = $data['name'];
        $rule->description = $data['description'];
        $rule->content = $data['content'];
        $rule->is_public = $data['isPublic'] ?? false;
        $rule->tags = $data['tags'] ?? [];
        $rule->metadata = $data['metadata'] ?? [];
        $rule->user_id = auth()->id();
        $rule->save();

        return response()->json($rule, 201);
    }

    /**
     * Update a context rule
     */
    public function updateRule(string $id, array $data): JsonResponse
    {
        $rule = ContextRule::find($id);

        if (!$rule) {
            return response()->json(['message' => 'Context rule not found'], 404);
        }

        // Check update permission
        if ($rule->user_id !== auth()->id() && !auth()->user()->isAdmin) {
            return response()->json(['message' => 'You do not have permission to update this rule'], 403);
        }

        if (isset($data['name'])) {
            $rule->name = $data['name'];
        }

        if (isset($data['description'])) {
            $rule->description = $data['description'];
        }

        if (isset($data['content'])) {
            $rule->content = $data['content'];
        }

        if (array_key_exists('isPublic', $data)) {
            $rule->is_public = $data['isPublic'];
        }

        if (isset($data['tags'])) {
            $rule->tags = $data['tags'];
        }

        if (isset($data['metadata'])) {
            $rule->metadata = $data['metadata'];
        }

        $rule->save();

        return response()->json($rule);
    }

    /**
     * Delete a context rule
     */
    public function deleteRule(string $id): JsonResponse
    {
        $rule = ContextRule::find($id);

        if (!$rule) {
            return response()->json(['message' => 'Context rule not found'], 404);
        }

        // Check delete permission
        if ($rule->user_id !== auth()->id() && !auth()->user()->isAdmin) {
            return response()->json(['message' => 'You do not have permission to delete this rule'], 403);
        }

        $rule->delete();

        return response()->json(['message' => 'Context rule deleted successfully']);
    }

    /**
     * Get context rules for a specific user
     */
    public function getUserRules(string $userId): JsonResponse
    {
        // Validate that the requesting user has permission to view this user's rules
        $currentUser = auth()->user();

        if ($currentUser->id !== (int)$userId && !$currentUser->isAdmin) {
            return response()->json(['message' => 'You do not have permission to view this user\'s rules'], 403);
        }

        $rules = ContextRule::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($rules);
    }

    /**
     * Get the default context rule for a user
     */
    public function getDefaultRule(string $userId): JsonResponse
    {
        // Validate that the requesting user has permission
        $currentUser = auth()->user();

        if ($currentUser->id !== (int)$userId && !$currentUser->isAdmin) {
            return response()->json(['message' => 'You do not have permission to view this user\'s default rule'], 403);
        }

        $rule = ContextRule::where('user_id', $userId)
            ->where('is_default', true)
            ->first();

        if (!$rule) {
            return response()->json(['message' => 'No default context rule found for this user'], 404);
        }

        return response()->json($rule);
    }

    /**
     * Set a context rule as default for the current user
     */
    public function setDefault(string $id): JsonResponse
    {
        $rule = ContextRule::find($id);

        if (!$rule) {
            return response()->json(['message' => 'Context rule not found'], 404);
        }

        // Verify ownership or admin
        if ($rule->user_id !== auth()->id() && !auth()->user()->isAdmin) {
            return response()->json(['message' => 'You do not have permission to set this rule as default'], 403);
        }

        // Unset any existing default rules for this user
        ContextRule::where('user_id', auth()->id())
            ->where('is_default', true)
            ->update(['is_default' => false]);

        // Set the new default
        $rule->is_default = true;
        $rule->save();

        return response()->json(['message' => 'Default context rule updated successfully', 'rule' => $rule]);
    }

    /**
     * Get knowledge bases available for this rule
     */
    public function getKnowledgeBases(string $ruleId): JsonResponse
    {
        try {
            $rule = ContextRule::find($ruleId);
            
            if (!$rule) {
                return response()->json(['message' => 'Context rule not found'], 404);
            }
            
            // Check access permission
            if (!$rule->is_public && $rule->user_id !== auth()->id() && !auth()->user()->isAdmin) {
                return response()->json(['message' => 'Unauthorized access to this rule'], 403);
            }
            
            // Get knowledge bases from the Knowledge Base service
            $knowledgeBaseService = app(\App\Services\KnowledgeBase\KnowledgeBaseService::class);
            $knowledgeBases = $knowledgeBaseService->getConfigurationsForContextRules(auth()->user());
            
            // Get IDs of knowledge bases used by this rule
            $ruleKnowledgeBaseIds = $rule->metadata['knowledge_base_ids'] ?? [];
            
            // Mark which knowledge bases are used by this rule
            foreach ($knowledgeBases as &$kb) {
                $kb['is_used'] = in_array($kb['id'], $ruleKnowledgeBaseIds);
            }
            
            return response()->json([
                'knowledge_bases' => $knowledgeBases,
                'rule_id' => $ruleId
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to get knowledge bases: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Test a context rule against a query
     */
    public function testRule(string $id, array $data): JsonResponse
    {
        try {
            if (empty($data['query'])) {
                return response()->json(['message' => 'Query is required'], 400);
            }
            
            $rule = ContextRule::find($id);
            
            if (!$rule) {
                return response()->json(['message' => 'Context rule not found'], 404);
            }
            
            // Check access permission
            if (!$rule->is_public && $rule->user_id !== auth()->id() && !auth()->user()->isAdmin) {
                return response()->json(['message' => 'Unauthorized access to this rule'], 403);
            }
            
            $ruleContent = json_decode($rule->content, true);
            
            // Check if the query matches any of the rule's patterns
            $matches = [];
            if (!empty($ruleContent['patterns'])) {
                foreach ($ruleContent['patterns'] as $pattern) {
                    if (isset($pattern['regex']) && !empty($pattern['regex'])) {
                        // Regex pattern matching
                        if (@preg_match('/' . $pattern['regex'] . '/i', $data['query'])) {
                            $matches[] = $pattern['regex'];
                        }
                    } elseif (isset($pattern['keyword']) && !empty($pattern['keyword'])) {
                        // Keyword matching
                        if (stripos($data['query'], $pattern['keyword']) !== false) {
                            $matches[] = $pattern['keyword'];
                        }
                    }
                }
            }
            
            // See if knowledge base would be searched
            $knowledgeBaseResults = [];
            if (!empty($ruleContent['useKnowledgeBase']) && $ruleContent['useKnowledgeBase'] === true) {
                if (!empty($ruleContent['knowledgeBaseIds'])) {
                    // Get potential knowledge base matches
                    $knowledgeBaseService = app(\App\Services\KnowledgeBase\KnowledgeBaseService::class);
                    $knowledgeBaseResults = $knowledgeBaseService->searchForAIContext(
                        auth()->user(), 
                        $data['query'], 
                        $ruleContent['knowledgeBaseIds'],
                        3,
                        0.7
                    );
                }
            }
            
            return response()->json([
                'result' => 'Success',
                'rule_matches' => !empty($matches),
                'matches' => $matches,
                'would_apply_rule' => !empty($matches),
                'knowledge_base_results' => $knowledgeBaseResults,
                'knowledge_base_would_be_searched' => !empty($knowledgeBaseResults),
                'test_query' => $data['query']
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error testing rule: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Validate a context rule format/syntax
     */
    public function validateRule(string $content): JsonResponse
    {
        // In a real app, you would validate the syntax and structure of the rule
        // This would depend on your specific context rule format

        // Mock implementation for demonstration
        $isValid = Str::length($content) > 10;
        $errors = [];

        if (!$isValid) {
            $errors[] = 'Rule content must be at least 10 characters long';
        }

        if (Str::contains($content, 'invalid_syntax')) {
            $isValid = false;
            $errors[] = 'Rule contains invalid syntax';
        }

        return response()->json([
            'isValid' => $isValid,
            'errors' => $errors,
            'warnings' => [],
        ]);
    }

    /**
     * Get available context rule templates
     */
    public function getTemplates(): JsonResponse
    {
        // In a real app, these would be fetched from the database
        // Mock implementation for demonstration
        $templates = [
            [
                'id' => '1',
                'name' => 'General AI Assistant',
                'description' => 'A general-purpose AI assistant template',
                'content' => 'You are a helpful AI assistant...',
                'category' => 'general',
                'created_at' => now()->subDays(30)->toIso8601String(),
                'updated_at' => now()->subDays(5)->toIso8601String(),
            ],
            [
                'id' => '2',
                'name' => 'Code Helper',
                'description' => 'Specialized for programming assistance',
                'content' => 'You are a coding expert who helps users...',
                'category' => 'programming',
                'created_at' => now()->subDays(25)->toIso8601String(),
                'updated_at' => now()->subDays(3)->toIso8601String(),
            ],
            [
                'id' => '3',
                'name' => 'Customer Support',
                'description' => 'Template for customer service interactions',
                'content' => 'You are a customer support agent...',
                'category' => 'business',
                'created_at' => now()->subDays(20)->toIso8601String(),
                'updated_at' => now()->subDays(1)->toIso8601String(),
            ],
        ];

        return response()->json($templates);
    }

    /**
     * Get a specific context rule template
     */
    public function getTemplate(string $id): JsonResponse
    {
        // In a real app, this would be fetched from the database
        // Mock implementation for demonstration
        $templates = [
            '1' => [
                'id' => '1',
                'name' => 'General AI Assistant',
                'description' => 'A general-purpose AI assistant template',
                'content' => 'You are a helpful AI assistant that provides accurate, helpful responses to user queries. Your goal is to be informative, educational, and engaging. When you don\'t know something, acknowledge it rather than making up information.',
                'category' => 'general',
                'created_at' => now()->subDays(30)->toIso8601String(),
                'updated_at' => now()->subDays(5)->toIso8601String(),
            ],
            '2' => [
                'id' => '2',
                'name' => 'Code Helper',
                'description' => 'Specialized for programming assistance',
                'content' => 'You are a coding expert who helps users with programming problems. Focus on providing clean, efficient, and well-documented code examples. Explain your reasoning and highlight potential edge cases or performance considerations.',
                'category' => 'programming',
                'created_at' => now()->subDays(25)->toIso8601String(),
                'updated_at' => now()->subDays(3)->toIso8601String(),
            ],
            '3' => [
                'id' => '3',
                'name' => 'Customer Support',
                'description' => 'Template for customer service interactions',
                'content' => 'You are a customer support agent for our company. Your responses should be professional, empathetic, and solution-oriented. Prioritize understanding the customer\'s issue before proposing solutions, and ensure your tone remains helpful throughout the interaction.',
                'category' => 'business',
                'created_at' => now()->subDays(20)->toIso8601String(),
                'updated_at' => now()->subDays(1)->toIso8601String(),
            ],
        ];

        if (!isset($templates[$id])) {
            return response()->json(['message' => 'Template not found'], 404);
        }

        return response()->json($templates[$id]);
    }
}
