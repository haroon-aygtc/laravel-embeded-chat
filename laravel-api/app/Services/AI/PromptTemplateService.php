<?php

namespace App\Services\AI;

use App\Models\PromptTemplate;
use App\Models\PromptTemplateVersion;
use App\Models\PromptTemplateVariable;
use App\Models\PromptTemplateUsage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PromptTemplateService
{
    /**
     * Get all prompt templates
     */
    public function getAllTemplates()
    {
        return PromptTemplate::with(['variables', 'latestVersion'])->get();
    }

    /**
     * Get a prompt template by ID
     */
    public function getTemplateById(string $id)
    {
        return PromptTemplate::with(['variables', 'versions', 'latestVersion'])->findOrFail($id);
    }

    /**
     * Create a new prompt template
     */
    public function createTemplate(array $data)
    {
        // Create the template
        $template = PromptTemplate::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? '',
            'category' => $data['category'] ?? 'general',
            'is_active' => $data['is_active'] ?? true,
        ]);

        // Create the initial version
        $version = PromptTemplateVersion::create([
            'prompt_template_id' => $template->id,
            'version' => 1,
            'content' => $data['content'],
            'notes' => $data['notes'] ?? 'Initial version',
            'created_by' => $data['created_by'] ?? auth()->id(),
        ]);

        // Set the latest version
        $template->latest_version_id = $version->id;
        $template->save();

        // Extract and create variables
        if (isset($data['variables']) && is_array($data['variables'])) {
            foreach ($data['variables'] as $variable) {
                PromptTemplateVariable::create([
                    'prompt_template_id' => $template->id,
                    'name' => $variable['name'],
                    'description' => $variable['description'] ?? '',
                    'default_value' => $variable['default_value'] ?? '',
                    'is_required' => $variable['is_required'] ?? true,
                ]);
            }
        } else {
            // Auto-detect variables from content
            $this->extractAndCreateVariables($template, $data['content']);
        }

        return $template->fresh(['variables', 'versions', 'latestVersion']);
    }

    /**
     * Update a prompt template
     */
    public function updateTemplate(string $id, array $data)
    {
        $template = PromptTemplate::findOrFail($id);

        // Update template properties
        if (isset($data['name'])) $template->name = $data['name'];
        if (isset($data['description'])) $template->description = $data['description'];
        if (isset($data['category'])) $template->category = $data['category'];
        if (isset($data['is_active'])) $template->is_active = $data['is_active'];

        $template->save();

        // Create a new version if content is provided
        if (isset($data['content'])) {
            $latestVersion = $template->latestVersion;
            $newVersionNumber = $latestVersion ? $latestVersion->version + 1 : 1;

            $version = PromptTemplateVersion::create([
                'prompt_template_id' => $template->id,
                'version' => $newVersionNumber,
                'content' => $data['content'],
                'notes' => $data['notes'] ?? 'Updated version',
                'created_by' => $data['created_by'] ?? auth()->id(),
            ]);

            // Update the latest version reference
            $template->latest_version_id = $version->id;
            $template->save();

            // Update variables if needed
            if (isset($data['variables']) && is_array($data['variables'])) {
                // Delete existing variables
                PromptTemplateVariable::where('prompt_template_id', $template->id)->delete();

                // Create new variables
                foreach ($data['variables'] as $variable) {
                    PromptTemplateVariable::create([
                        'prompt_template_id' => $template->id,
                        'name' => $variable['name'],
                        'description' => $variable['description'] ?? '',
                        'default_value' => $variable['default_value'] ?? '',
                        'is_required' => $variable['is_required'] ?? true,
                    ]);
                }
            } else {
                // Auto-detect variables from content
                $this->extractAndCreateVariables($template, $data['content']);
            }
        }

        return $template->fresh(['variables', 'versions', 'latestVersion']);
    }

    /**
     * Delete a prompt template
     */
    public function deleteTemplate(string $id)
    {
        $template = PromptTemplate::findOrFail($id);
        
        // Delete related records
        PromptTemplateVariable::where('prompt_template_id', $template->id)->delete();
        PromptTemplateVersion::where('prompt_template_id', $template->id)->delete();
        PromptTemplateUsage::where('prompt_template_id', $template->id)->delete();
        
        // Delete the template
        $template->delete();
        
        return true;
    }

    /**
     * Process a prompt template with variables and conditional logic
     */
    public function processTemplate(string $templateId, array $variables = [], array $context = [])
    {
        $template = $this->getTemplateById($templateId);
        if (!$template || !$template->is_active) {
            throw new \Exception("Prompt template not found or inactive: {$templateId}");
        }
        
        $content = $template->latestVersion->content;
        
        // Log template usage
        $this->logTemplateUsage($template->id, $variables);
        
        // Process the template
        return $this->processTemplateContent($content, $variables, $context);
    }

    /**
     * Process template content with variables and conditional logic
     */
    public function processTemplateContent(string $content, array $variables = [], array $context = [])
    {
        // Replace variables
        $processedContent = preg_replace_callback(
            '/\{\{([^}]+)\}\}/',
            function ($matches) use ($variables, $context) {
                $variableName = trim($matches[1]);
                
                // Check if it's a conditional block
                if (Str::startsWith($variableName, 'if ')) {
                    return $matches[0]; // Skip for now, conditionals are processed later
                }
                
                // Check if it's an else or endif block
                if ($variableName === 'else' || $variableName === 'endif') {
                    return $matches[0]; // Skip for now
                }
                
                // Regular variable replacement
                return $variables[$variableName] ?? '';
            },
            $content
        );
        
        // Process conditional blocks
        $processedContent = $this->processConditionalBlocks($processedContent, $variables, $context);
        
        return $processedContent;
    }

    /**
     * Process conditional blocks in a template
     */
    private function processConditionalBlocks(string $content, array $variables, array $context)
    {
        // Process if-else-endif blocks
        return preg_replace_callback(
            '/\{\{if\s+([^}]+)\}\}(.*?)(?:\{\{else\}\}(.*?))?\{\{endif\}\}/s',
            function ($matches) use ($variables, $context) {
                $condition = trim($matches[1]);
                $trueBlock = $matches[2];
                $falseBlock = $matches[3] ?? '';
                
                // Evaluate the condition
                $result = $this->evaluateCondition($condition, $variables, $context);
                
                // Return the appropriate block
                return $result ? $trueBlock : $falseBlock;
            },
            $content
        );
    }

    /**
     * Evaluate a condition in a template
     */
    private function evaluateCondition(string $condition, array $variables, array $context)
    {
        // Replace variables in the condition
        $processedCondition = preg_replace_callback(
            '/\$([a-zA-Z0-9_]+)/',
            function ($matches) use ($variables, $context) {
                $variableName = $matches[1];
                return var_export($variables[$variableName] ?? '', true);
            },
            $condition
        );
        
        // Add context variables
        foreach ($context as $key => $value) {
            $processedCondition = str_replace('$context.' . $key, var_export($value, true), $processedCondition);
        }
        
        // Evaluate the condition safely
        try {
            return eval("return {$processedCondition};");
        } catch (\Throwable $e) {
            Log::error("Error evaluating condition: {$condition}", [
                'error' => $e->getMessage(),
                'processed_condition' => $processedCondition,
            ]);
            return false;
        }
    }

    /**
     * Extract variables from template content and create them
     */
    private function extractAndCreateVariables(PromptTemplate $template, string $content)
    {
        // Delete existing variables
        PromptTemplateVariable::where('prompt_template_id', $template->id)->delete();
        
        // Extract variables using regex
        preg_match_all('/\{\{([^}]+)\}\}/', $content, $matches);
        
        $variableNames = [];
        foreach ($matches[1] as $match) {
            $variableName = trim($match);
            
            // Skip conditional blocks
            if (Str::startsWith($variableName, 'if ') || $variableName === 'else' || $variableName === 'endif') {
                continue;
            }
            
            // Skip duplicates
            if (in_array($variableName, $variableNames)) {
                continue;
            }
            
            $variableNames[] = $variableName;
            
            // Create the variable
            PromptTemplateVariable::create([
                'prompt_template_id' => $template->id,
                'name' => $variableName,
                'description' => 'Auto-detected variable',
                'default_value' => '',
                'is_required' => true,
            ]);
        }
    }

    /**
     * Log template usage for analytics
     */
    private function logTemplateUsage(string $templateId, array $variables)
    {
        try {
            PromptTemplateUsage::create([
                'prompt_template_id' => $templateId,
                'user_id' => auth()->id(),
                'variables' => json_encode($variables),
            ]);
        } catch (\Exception $e) {
            Log::error("Error logging template usage: {$e->getMessage()}");
        }
    }
}
