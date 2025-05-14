<?php

namespace App\Services\PromptTemplate;

use App\Models\PromptTemplate;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PromptTemplateService
{
    /**
     * Get all prompt templates
     */
    public function getAllTemplates(): JsonResponse
    {
        try {
            $templates = PromptTemplate::where(function ($query) {
                $query->where('user_id', auth()->id())
                      ->orWhere('is_public', true);
            })
            ->orderBy('created_at', 'desc')
            ->get();
            
            return response()->json($templates);
        } catch (\Exception $e) {
            Log::error('Error getting prompt templates', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json(['message' => 'Error getting prompt templates: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Get a prompt template by ID
     */
    public function getTemplate(string $id): JsonResponse
    {
        try {
            $template = PromptTemplate::find($id);
            
            if (!$template) {
                return response()->json(['message' => 'Prompt template not found'], 404);
            }
            
            // Check if user has access
            if (!$template->is_public && $template->user_id !== auth()->id()) {
                return response()->json(['message' => 'Unauthorized access to template'], 403);
            }
            
            return response()->json($template);
        } catch (\Exception $e) {
            Log::error('Error getting prompt template', [
                'error' => $e->getMessage(),
                'template_id' => $id
            ]);
            
            return response()->json(['message' => 'Error getting prompt template: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Create a new prompt template
     */
    public function createTemplate(array $data): JsonResponse
    {
        try {
            // Validate required fields
            if (empty($data['name']) || empty($data['content'])) {
                return response()->json(['message' => 'Name and content are required'], 400);
            }
            
            $template = new PromptTemplate();
            $template->id = (string) Str::uuid();
            $template->name = $data['name'];
            $template->description = $data['description'] ?? '';
            $template->content = $data['content'];
            $template->user_id = auth()->id();
            $template->is_active = $data['is_active'] ?? true;
            $template->is_public = $data['is_public'] ?? false;
            $template->variables = $data['variables'] ?? [];
            $template->metadata = $data['metadata'] ?? [];
            
            $template->save();
            
            return response()->json($template, 201);
        } catch (\Exception $e) {
            Log::error('Error creating prompt template', [
                'error' => $e->getMessage(),
                'data' => $data
            ]);
            
            return response()->json(['message' => 'Error creating prompt template: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Update a prompt template
     */
    public function updateTemplate(string $id, array $data): JsonResponse
    {
        try {
            $template = PromptTemplate::find($id);
            
            if (!$template) {
                return response()->json(['message' => 'Prompt template not found'], 404);
            }
            
            // Check if user has access
            if ($template->user_id !== auth()->id()) {
                return response()->json(['message' => 'Unauthorized access to template'], 403);
            }
            
            // Update fields
            if (isset($data['name'])) $template->name = $data['name'];
            if (isset($data['description'])) $template->description = $data['description'];
            if (isset($data['content'])) $template->content = $data['content'];
            if (isset($data['is_active'])) $template->is_active = $data['is_active'];
            if (isset($data['is_public'])) $template->is_public = $data['is_public'];
            if (isset($data['variables'])) $template->variables = $data['variables'];
            if (isset($data['metadata'])) $template->metadata = $data['metadata'];
            
            $template->save();
            
            return response()->json($template);
        } catch (\Exception $e) {
            Log::error('Error updating prompt template', [
                'error' => $e->getMessage(),
                'template_id' => $id,
                'data' => $data
            ]);
            
            return response()->json(['message' => 'Error updating prompt template: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Delete a prompt template
     */
    public function deleteTemplate(string $id): JsonResponse
    {
        try {
            $template = PromptTemplate::find($id);
            
            if (!$template) {
                return response()->json(['message' => 'Prompt template not found'], 404);
            }
            
            // Check if user has access
            if ($template->user_id !== auth()->id()) {
                return response()->json(['message' => 'Unauthorized access to template'], 403);
            }
            
            $template->delete();
            
            return response()->json(['message' => 'Prompt template deleted']);
        } catch (\Exception $e) {
            Log::error('Error deleting prompt template', [
                'error' => $e->getMessage(),
                'template_id' => $id
            ]);
            
            return response()->json(['message' => 'Error deleting prompt template: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Preview a prompt template with sample data
     */
    public function previewTemplate(array $data): JsonResponse
    {
        try {
            if (empty($data['content'])) {
                return response()->json(['message' => 'Template content is required'], 400);
            }
            
            $templateContent = $data['content'];
            $variables = $data['variables'] ?? [];
            $knowledgeBaseContent = $data['include_knowledge_base'] ?? false;
            $contextRuleId = $data['context_rule_id'] ?? null;
            
            // Sample variables for preview if not provided
            if (empty($variables)) {
                $variables = $this->generateSampleVariables($templateContent);
            }
            
            // Replace variables in the template
            $processedTemplate = $this->processTemplate($templateContent, $variables);
            
            // Add knowledge base content if requested
            if ($knowledgeBaseContent && !empty($data['sample_query'])) {
                $knowledgeBaseIds = $data['knowledge_base_ids'] ?? [];
                $sampleQuery = $data['sample_query'];
                
                // Get knowledge base content based on the sample query
                $knowledgeBaseService = app(\App\Services\KnowledgeBase\KnowledgeBaseService::class);
                $knowledgeBaseResults = $knowledgeBaseService->searchForAIContext(
                    auth()->user(),
                    $sampleQuery,
                    $knowledgeBaseIds,
                    3,
                    0.7
                );
                
                // Format knowledge base content
                if (!empty($knowledgeBaseResults)) {
                    $aiService = app(\App\Services\AI\AIService::class);
                    $knowledgeBaseContext = $aiService->formatKnowledgeBaseContext($knowledgeBaseResults);
                    
                    // Add knowledge base context to the processed template
                    $processedTemplate = str_replace(
                        ['{{knowledge_base}}', '{knowledge_base}'],
                        $knowledgeBaseContext,
                        $processedTemplate
                    );
                }
            }
            
            // Apply context rule if provided
            if ($contextRuleId) {
                $contextRuleService = app(\App\Services\ContextRule\ContextRuleService::class);
                $contextRule = $contextRuleService->getContextRule($contextRuleId);
                
                if ($contextRule && isset($contextRule['instructions'])) {
                    $processedTemplate = str_replace(
                        ['{{context_instructions}}', '{context_instructions}'],
                        $contextRule['instructions'],
                        $processedTemplate
                    );
                }
            }
            
            return response()->json([
                'preview' => $processedTemplate,
                'used_variables' => $variables,
                'has_knowledge_base' => $knowledgeBaseContent,
                'has_context_rule' => !empty($contextRuleId)
            ]);
        } catch (\Exception $e) {
            Log::error('Error previewing prompt template', [
                'error' => $e->getMessage(),
                'data' => $data
            ]);
            
            return response()->json(['message' => 'Error previewing prompt template: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Process a template by replacing variables
     */
    private function processTemplate(string $template, array $variables): string
    {
        $processedTemplate = $template;
        
        foreach ($variables as $key => $value) {
            $processedTemplate = str_replace(
                ['{{' . $key . '}}', '{' . $key . '}'],
                $value,
                $processedTemplate
            );
        }
        
        return $processedTemplate;
    }
    
    /**
     * Generate sample variables based on the template content
     */
    private function generateSampleVariables(string $template): array
    {
        $variables = [];
        $pattern = '/\{\{([a-zA-Z0-9_]+)\}\}|\{([a-zA-Z0-9_]+)\}/';
        
        if (preg_match_all($pattern, $template, $matches)) {
            $variableNames = array_unique(array_merge($matches[1], $matches[2]));
            
            foreach ($variableNames as $name) {
                if (!empty($name)) {
                    // Generate a sample value based on the variable name
                    $variables[$name] = $this->generateSampleValue($name);
                }
            }
        }
        
        return $variables;
    }
    
    /**
     * Generate a sample value based on the variable name
     */
    private function generateSampleValue(string $name): string
    {
        $commonVariables = [
            'user_name' => 'John Doe',
            'user_email' => 'john.doe@example.com',
            'company_name' => 'Acme Corporation',
            'product_name' => 'Widget Pro',
            'current_date' => date('Y-m-d'),
            'query' => 'How do I reset my password?',
            'user_input' => 'I need help with my account',
            'assistant_name' => 'AI Assistant',
            'greeting' => 'Hello',
            'knowledge_base' => '[Knowledge base content will appear here]',
            'context_instructions' => '[Context rule instructions will appear here]'
        ];
        
        // Return common variables if they exist
        if (isset($commonVariables[$name])) {
            return $commonVariables[$name];
        }
        
        // Generate a value based on the variable name
        if (Str::contains($name, ['name', 'title'])) {
            return 'Sample ' . ucfirst(str_replace('_', ' ', $name));
        } elseif (Str::contains($name, ['email'])) {
            return 'sample.' . $name . '@example.com';
        } elseif (Str::contains($name, ['date', 'time'])) {
            return date('Y-m-d H:i:s');
        } elseif (Str::contains($name, ['id', 'code'])) {
            return strtoupper(substr(md5($name), 0, 8));
        } elseif (Str::contains($name, ['count', 'number'])) {
            return (string) rand(1, 100);
        }
        
        // Default fallback
        return 'Sample value for ' . str_replace('_', ' ', $name);
    }
} 