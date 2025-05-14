<?php

namespace App\Services\FollowUp;

use App\Models\AI\FollowUpConfig;
use App\Models\AI\FollowUpQuestion;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class FollowUpService
{
    /**
     * Get all follow-up configurations
     *
     * @return JsonResponse
     */
    public function getAllConfigs(): JsonResponse
    {
        try {
            $query = FollowUpConfig::query();
            
            // If user_id is provided, filter by it
            if (request()->has('user_id')) {
                $query->where('user_id', request()->input('user_id'));
            }
            
            $configs = $query->orderBy('created_at', 'desc')->get();
            
            return response()->json($configs);
        } catch (\Exception $e) {
            Log::error('Error getting follow-up configurations', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json(['message' => 'Error getting follow-up configurations: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Get a follow-up configuration by ID
     *
     * @param string $id
     * @return JsonResponse
     */
    public function getConfig(string $id): JsonResponse
    {
        try {
            $config = FollowUpConfig::with('questions')->find($id);
            
            if (!$config) {
                return response()->json(['message' => 'Follow-up configuration not found'], 404);
            }
            
            return response()->json($config);
        } catch (\Exception $e) {
            Log::error('Error getting follow-up configuration', [
                'error' => $e->getMessage(),
                'config_id' => $id
            ]);
            
            return response()->json(['message' => 'Error getting follow-up configuration: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Create a new follow-up configuration
     *
     * @param array $data
     * @return JsonResponse
     */
    public function createConfig(array $data): JsonResponse
    {
        try {
            // Validate required fields
            if (empty($data['name'])) {
                return response()->json(['message' => 'Name is required'], 400);
            }
            
            $config = new FollowUpConfig();
            $config->id = (string) Str::uuid();
            $config->user_id = $data['user_id'] ?? auth()->id();
            $config->name = $data['name'];
            $config->enable_follow_up_questions = $data['enable_follow_up_questions'] ?? true;
            $config->max_follow_up_questions = $data['max_follow_up_questions'] ?? 3;
            $config->show_follow_up_as = $data['show_follow_up_as'] ?? 'buttons';
            $config->generate_automatically = $data['generate_automatically'] ?? true;
            $config->is_default = $data['is_default'] ?? false;
            $config->predefined_question_sets = $data['predefined_question_sets'] ?? [];
            $config->topic_based_question_sets = $data['topic_based_question_sets'] ?? [];
            
            // If this is set as default, unset any existing defaults
            if ($config->is_default) {
                FollowUpConfig::where('is_default', true)->update(['is_default' => false]);
            }
            
            $config->save();
            
            // Create questions if provided
            if (!empty($data['questions'])) {
                foreach ($data['questions'] as $questionData) {
                    $question = new FollowUpQuestion();
                    $question->id = (string) Str::uuid();
                    $question->config_id = $config->id;
                    $question->question = $questionData['question'];
                    $question->display_order = $questionData['display_order'] ?? 0;
                    $question->is_active = $questionData['is_active'] ?? true;
                    $question->priority = $questionData['priority'] ?? 'medium';
                    $question->display_position = $questionData['display_position'] ?? 'end';
                    $question->category = $questionData['category'] ?? null;
                    $question->metadata = $questionData['metadata'] ?? null;
                    $question->save();
                }
            }
            
            return response()->json($config, 201);
        } catch (\Exception $e) {
            Log::error('Error creating follow-up configuration', [
                'error' => $e->getMessage(),
                'data' => $data
            ]);
            
            return response()->json(['message' => 'Error creating follow-up configuration: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Update a follow-up configuration
     *
     * @param string $id
     * @param array $data
     * @return JsonResponse
     */
    public function updateConfig(string $id, array $data): JsonResponse
    {
        try {
            $config = FollowUpConfig::find($id);
            
            if (!$config) {
                return response()->json(['message' => 'Follow-up configuration not found'], 404);
            }
            
            // Update fields
            if (isset($data['name'])) $config->name = $data['name'];
            if (isset($data['enable_follow_up_questions'])) $config->enable_follow_up_questions = $data['enable_follow_up_questions'];
            if (isset($data['max_follow_up_questions'])) $config->max_follow_up_questions = $data['max_follow_up_questions'];
            if (isset($data['show_follow_up_as'])) $config->show_follow_up_as = $data['show_follow_up_as'];
            if (isset($data['generate_automatically'])) $config->generate_automatically = $data['generate_automatically'];
            if (isset($data['predefined_question_sets'])) $config->predefined_question_sets = $data['predefined_question_sets'];
            if (isset($data['topic_based_question_sets'])) $config->topic_based_question_sets = $data['topic_based_question_sets'];
            
            // If this is being set as default and it wasn't before
            if (isset($data['is_default']) && $data['is_default'] && !$config->is_default) {
                FollowUpConfig::where('is_default', true)->update(['is_default' => false]);
                $config->is_default = true;
            } elseif (isset($data['is_default'])) {
                $config->is_default = $data['is_default'];
            }
            
            $config->save();
            
            return response()->json($config);
        } catch (\Exception $e) {
            Log::error('Error updating follow-up configuration', [
                'error' => $e->getMessage(),
                'config_id' => $id,
                'data' => $data
            ]);
            
            return response()->json(['message' => 'Error updating follow-up configuration: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Delete a follow-up configuration
     *
     * @param string $id
     * @return JsonResponse
     */
    public function deleteConfig(string $id): JsonResponse
    {
        try {
            $config = FollowUpConfig::find($id);
            
            if (!$config) {
                return response()->json(['message' => 'Follow-up configuration not found'], 404);
            }
            
            // Delete associated questions first
            $config->questions()->delete();
            
            // Then delete the configuration
            $config->delete();
            
            return response()->json(['message' => 'Follow-up configuration deleted successfully']);
        } catch (\Exception $e) {
            Log::error('Error deleting follow-up configuration', [
                'error' => $e->getMessage(),
                'config_id' => $id
            ]);
            
            return response()->json(['message' => 'Error deleting follow-up configuration: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Get all questions for a specific configuration
     *
     * @param string $configId
     * @return JsonResponse
     */
    public function getQuestions(string $configId): JsonResponse
    {
        try {
            $config = FollowUpConfig::find($configId);
            
            if (!$config) {
                return response()->json(['message' => 'Follow-up configuration not found'], 404);
            }
            
            $questions = $config->questions()->orderBy('display_order')->get();
            
            return response()->json($questions);
        } catch (\Exception $e) {
            Log::error('Error getting follow-up questions', [
                'error' => $e->getMessage(),
                'config_id' => $configId
            ]);
            
            return response()->json(['message' => 'Error getting follow-up questions: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Add a question to a configuration
     *
     * @param string $configId
     * @param array $data
     * @return JsonResponse
     */
    public function addQuestion(string $configId, array $data): JsonResponse
    {
        try {
            $config = FollowUpConfig::find($configId);
            
            if (!$config) {
                return response()->json(['message' => 'Follow-up configuration not found'], 404);
            }
            
            // Validate required fields
            if (empty($data['question'])) {
                return response()->json(['message' => 'Question text is required'], 400);
            }
            
            $question = new FollowUpQuestion();
            $question->id = (string) Str::uuid();
            $question->config_id = $configId;
            $question->question = $data['question'];
            $question->display_order = $data['display_order'] ?? $config->questions()->count();
            $question->is_active = $data['is_active'] ?? true;
            $question->priority = $data['priority'] ?? 'medium';
            $question->display_position = $data['display_position'] ?? 'end';
            $question->category = $data['category'] ?? null;
            $question->metadata = $data['metadata'] ?? null;
            
            $question->save();
            
            return response()->json($question, 201);
        } catch (\Exception $e) {
            Log::error('Error adding follow-up question', [
                'error' => $e->getMessage(),
                'config_id' => $configId,
                'data' => $data
            ]);
            
            return response()->json(['message' => 'Error adding follow-up question: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Update a question
     *
     * @param string $id
     * @param array $data
     * @return JsonResponse
     */
    public function updateQuestion(string $id, array $data): JsonResponse
    {
        try {
            $question = FollowUpQuestion::find($id);
            
            if (!$question) {
                return response()->json(['message' => 'Follow-up question not found'], 404);
            }
            
            // Update fields
            if (isset($data['question'])) $question->question = $data['question'];
            if (isset($data['display_order'])) $question->display_order = $data['display_order'];
            if (isset($data['is_active'])) $question->is_active = $data['is_active'];
            if (isset($data['priority'])) $question->priority = $data['priority'];
            if (isset($data['display_position'])) $question->display_position = $data['display_position'];
            if (isset($data['category'])) $question->category = $data['category'];
            if (isset($data['metadata'])) $question->metadata = $data['metadata'];
            
            $question->save();
            
            return response()->json($question);
        } catch (\Exception $e) {
            Log::error('Error updating follow-up question', [
                'error' => $e->getMessage(),
                'question_id' => $id,
                'data' => $data
            ]);
            
            return response()->json(['message' => 'Error updating follow-up question: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Delete a question
     *
     * @param string $id
     * @return JsonResponse
     */
    public function deleteQuestion(string $id): JsonResponse
    {
        try {
            $question = FollowUpQuestion::find($id);
            
            if (!$question) {
                return response()->json(['message' => 'Follow-up question not found'], 404);
            }
            
            $question->delete();
            
            return response()->json(['message' => 'Follow-up question deleted successfully']);
        } catch (\Exception $e) {
            Log::error('Error deleting follow-up question', [
                'error' => $e->getMessage(),
                'question_id' => $id
            ]);
            
            return response()->json(['message' => 'Error deleting follow-up question: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Generate follow-up questions based on the chat context
     *
     * @param array $data
     * @return JsonResponse
     */
    public function generateFollowUps(array $data): JsonResponse
    {
        try {
            // Validate required fields
            if (empty($data['user_query']) || empty($data['ai_response'])) {
                return response()->json(['message' => 'User query and AI response are required'], 400);
            }
            
            $userQuery = $data['user_query'];
            $aiResponse = $data['ai_response'];
            $context = $data['context'] ?? [];
            $configId = $data['config_id'] ?? null;
            
            // Find the configuration to use
            $config = null;
            if ($configId) {
                $config = FollowUpConfig::find($configId);
            }
            
            if (!$config) {
                // Use the default configuration
                $config = FollowUpConfig::where('is_default', true)->first();
            }
            
            if (!$config || !$config->enable_follow_up_questions) {
                return response()->json([
                    'follow_up_questions' => [],
                    'config_used' => null,
                    'source' => 'none'
                ]);
            }
            
            // If automatic generation is turned off, get predefined questions from the config
            if (!$config->generate_automatically) {
                $followUpQuestions = $config->questions()
                    ->where('is_active', true)
                    ->orderBy('priority', 'desc')
                    ->orderBy('display_order')
                    ->limit($config->max_follow_up_questions)
                    ->get();
                
                return response()->json([
                    'follow_up_questions' => $followUpQuestions,
                    'config_used' => $config->id,
                    'source' => 'predefined'
                ]);
            }
            
            // Use AI service to generate follow-up questions
            // For improved implementation, use AI to generate context-aware follow-up questions
            // This is a simplified implementation for now
            $aiService = app(\App\Services\AI\AIService::class);
            $generatedQuestions = $aiService->generateFollowUpQuestions(
                $userQuery, 
                $aiResponse, 
                $config
            );
            
            return response()->json([
                'follow_up_questions' => $generatedQuestions,
                'config_used' => $config->id,
                'source' => 'generated'
            ]);
        } catch (\Exception $e) {
            Log::error('Error generating follow-up questions', [
                'error' => $e->getMessage(),
                'data' => $data
            ]);
            
            return response()->json(['message' => 'Error generating follow-up questions: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Process a selected follow-up question
     *
     * @param array $data
     * @return JsonResponse
     */
    public function processSelectedFollowUp(array $data): JsonResponse
    {
        try {
            // Validate required fields
            if (empty($data['selected_question']) || empty($data['previous_query']) || empty($data['previous_response'])) {
                return response()->json(['message' => 'Selected question, previous query and previous response are required'], 400);
            }
            
            $selectedQuestion = $data['selected_question'];
            $previousQuery = $data['previous_query'];
            $previousResponse = $data['previous_response'];
            $context = $data['context'] ?? [];
            $userId = $data['user_id'] ?? auth()->id();
            
            // Use AI service to process the follow-up
            $aiService = app(\App\Services\AI\AIService::class);
            $result = $aiService->processFollowUpQuestion(
                $selectedQuestion,
                $previousQuery,
                $previousResponse,
                $userId
            );
            
            return response()->json([
                'modified_prompt' => $result['modified_prompt'] ?? null,
                'context_updated' => $result['context_updated'] ?? false,
                'response' => $result['response'] ?? null
            ]);
        } catch (\Exception $e) {
            Log::error('Error processing follow-up question', [
                'error' => $e->getMessage(),
                'data' => $data
            ]);
            
            return response()->json(['message' => 'Error processing follow-up question: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Reorder questions in a configuration
     * 
     * @param string $configId
     * @param array $questionIds
     * @return JsonResponse
     */
    public function reorderQuestions(string $configId, array $questionIds): JsonResponse
    {
        try {
            $config = FollowUpConfig::find($configId);
            
            if (!$config) {
                return response()->json(['message' => 'Follow-up configuration not found'], 404);
            }
            
            // Verify all question IDs belong to this config
            $questions = FollowUpQuestion::whereIn('id', $questionIds)
                ->where('config_id', $configId)
                ->get()
                ->keyBy('id');
            
            if (count($questions) !== count($questionIds)) {
                return response()->json(['message' => 'Some question IDs are invalid or do not belong to this configuration'], 400);
            }
            
            // Update display_order for each question
            foreach ($questionIds as $index => $questionId) {
                if (isset($questions[$questionId])) {
                    $question = $questions[$questionId];
                    $question->display_order = $index;
                    $question->save();
                }
            }
            
            return response()->json(['message' => 'Questions reordered successfully']);
        } catch (\Exception $e) {
            Log::error('Error reordering follow-up questions', [
                'error' => $e->getMessage(),
                'config_id' => $configId,
                'question_ids' => $questionIds
            ]);
            
            return response()->json(['message' => 'Error reordering follow-up questions: ' . $e->getMessage()], 500);
        }
    }
} 