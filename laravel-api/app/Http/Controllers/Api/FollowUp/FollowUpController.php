<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\FollowUp;

use App\Http\Controllers\Controller;
use App\Models\AI\FollowUpConfig;
use App\Models\AI\FollowUpQuestion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class FollowUpController extends Controller
{
    /**
     * Get all follow-up configurations
     */
    public function index(Request $request): JsonResponse
    {
        $query = FollowUpConfig::query();

        // Filter by user if requested
        if ($request->has('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        $configs = $query->with('questions')->get();

        return response()->json($configs);
    }

    /**
     * Get a specific follow-up configuration
     */
    public function show(string $id): JsonResponse
    {
        $config = FollowUpConfig::with('questions')->find($id);

        if (!$config) {
            return response()->json(['message' => 'Follow-up configuration not found'], 404);
        }

        return response()->json($config);
    }

    /**
     * Create a new follow-up configuration
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'name' => 'required|string|max:255',
            'enable_follow_up_questions' => 'boolean',
            'max_follow_up_questions' => 'integer|min:1|max:10',
            'show_follow_up_as' => 'string|in:buttons,chips,dropdown,list',
            'generate_automatically' => 'boolean',
            'is_default' => 'boolean',
            'predefined_question_sets' => 'nullable|array',
            'topic_based_question_sets' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Create the config
        $config = new FollowUpConfig($request->all());
        $config->id = (string) Str::uuid();
        $config->save();

        // If questions were included, create them
        if ($request->has('questions') && is_array($request->input('questions'))) {
            foreach ($request->input('questions') as $questionData) {
                $question = new FollowUpQuestion([
                    'question' => $questionData['question'] ?? '',
                    'display_order' => $questionData['display_order'] ?? 0,
                    'is_active' => $questionData['is_active'] ?? true,
                    'priority' => $questionData['priority'] ?? 'medium',
                    'display_position' => $questionData['display_position'] ?? 'end',
                    'category' => $questionData['category'] ?? null,
                    'metadata' => $questionData['metadata'] ?? null,
                ]);
                $question->id = (string) Str::uuid();
                $question->config_id = $config->id;
                $question->save();
            }
        }

        return response()->json($config->load('questions'), 201);
    }

    /**
     * Update a follow-up configuration
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $config = FollowUpConfig::find($id);

        if (!$config) {
            return response()->json(['message' => 'Follow-up configuration not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'string|max:255',
            'enable_follow_up_questions' => 'boolean',
            'max_follow_up_questions' => 'integer|min:1|max:10',
            'show_follow_up_as' => 'string|in:buttons,chips,dropdown,list',
            'generate_automatically' => 'boolean',
            'is_default' => 'boolean',
            'predefined_question_sets' => 'nullable|array',
            'topic_based_question_sets' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $config->fill($request->only([
            'name',
            'enable_follow_up_questions',
            'max_follow_up_questions',
            'show_follow_up_as',
            'generate_automatically',
            'is_default',
            'predefined_question_sets',
            'topic_based_question_sets',
        ]));

        $config->save();

        return response()->json($config->load('questions'));
    }

    /**
     * Delete a follow-up configuration
     */
    public function destroy(string $id): JsonResponse
    {
        $config = FollowUpConfig::find($id);

        if (!$config) {
            return response()->json(['message' => 'Follow-up configuration not found'], 404);
        }

        $config->delete();

        return response()->json(['message' => 'Follow-up configuration deleted successfully']);
    }

    /**
     * Get questions for a specific configuration
     */
    public function getQuestions(string $configId): JsonResponse
    {
        $config = FollowUpConfig::find($configId);

        if (!$config) {
            return response()->json(['message' => 'Follow-up configuration not found'], 404);
        }

        $questions = $config->questions()->orderBy('display_order')->get();

        return response()->json($questions);
    }

    /**
     * Add a question to a configuration
     */
    public function addQuestion(Request $request, string $configId): JsonResponse
    {
        $config = FollowUpConfig::find($configId);

        if (!$config) {
            return response()->json(['message' => 'Follow-up configuration not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'question' => 'required|string',
            'display_order' => 'integer|min:0',
            'is_active' => 'boolean',
            'priority' => 'string|in:high,medium,low',
            'display_position' => 'string|in:beginning,middle,end',
            'category' => 'nullable|string',
            'metadata' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $question = new FollowUpQuestion($request->all());
        $question->id = (string) Str::uuid();
        $question->config_id = $configId;
        $question->save();

        return response()->json($question, 201);
    }

    /**
     * Update a question
     */
    public function updateQuestion(Request $request, string $id): JsonResponse
    {
        $question = FollowUpQuestion::find($id);

        if (!$question) {
            return response()->json(['message' => 'Follow-up question not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'question' => 'string',
            'display_order' => 'integer|min:0',
            'is_active' => 'boolean',
            'priority' => 'string|in:high,medium,low',
            'display_position' => 'string|in:beginning,middle,end',
            'category' => 'nullable|string',
            'metadata' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $question->fill($request->only([
            'question',
            'display_order',
            'is_active',
            'priority',
            'display_position',
            'category',
            'metadata',
        ]));

        $question->save();

        return response()->json($question);
    }

    /**
     * Delete a question
     */
    public function deleteQuestion(string $id): JsonResponse
    {
        $question = FollowUpQuestion::find($id);

        if (!$question) {
            return response()->json(['message' => 'Follow-up question not found'], 404);
        }

        $question->delete();

        return response()->json(['message' => 'Follow-up question deleted successfully']);
    }

    /**
     * Generate follow-up questions based on conversation context
     */
    public function generateFollowUps(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_query' => 'required|string',
            'ai_response' => 'required|string',
            'context' => 'nullable|array',
            'config_id' => 'nullable|string|exists:follow_up_configs,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Find the configuration to use
        $configId = $request->input('config_id');
        $config = null;

        if ($configId) {
            $config = FollowUpConfig::find($configId);
        } else {
            // Get the default configuration
            $config = FollowUpConfig::where('is_default', true)->first();
        }

        if (!$config || !$config->enable_follow_up_questions) {
            // Return empty follow-ups if no config is found or follow-ups are disabled
            return response()->json([
                'follow_up_questions' => [],
                'config_used' => null,
            ]);
        }

        $userQuery = $request->input('user_query');
        $aiResponse = $request->input('ai_response');
        $context = $request->input('context', []);

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
                'source' => 'predefined',
            ]);
        }

        // Use AI to generate context-aware follow-up questions (in a real implementation)
        // Here we would call the AI service to generate relevant follow-up questions
        // For now, return some sample follow-ups based on the user query

        $generatedQuestions = $this->sampleFollowUps($userQuery, $aiResponse, $context);

        return response()->json([
            'follow_up_questions' => $generatedQuestions,
            'config_used' => $config->id,
            'source' => 'generated',
        ]);
    }

    /**
     * Process a selected follow-up question
     */
    public function processSelectedFollowUp(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'selected_question' => 'required|string',
            'previous_query' => 'required|string',
            'previous_response' => 'required|string',
            'context' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $selectedQuestion = $request->input('selected_question');
        $previousQuery = $request->input('previous_query');
        $previousResponse = $request->input('previous_response');
        $context = $request->input('context', []);

        // In a real implementation, this would modify the AI prompt to respond to the follow-up

        return response()->json([
            'modified_prompt' => "Previous question: {$previousQuery}\n" .
                                "Previous answer: {$previousResponse}\n" .
                                "Follow-up question: {$selectedQuestion}",
            'context_updated' => true,
        ]);
    }

    /**
     * Generate sample follow-up questions (to be replaced with actual AI generation)
     */
    private function sampleFollowUps(string $userQuery, string $aiResponse, array $context): array
    {
        // Simplified for prototype purposes - in production would use actual AI
        $followUps = [];

        // Extract keywords from the user query
        $keywords = ['how', 'what', 'why', 'when', 'where'];
        $queryWords = explode(' ', strtolower($userQuery));

        if (in_array('how', $queryWords)) {
            $followUps[] = [
                'id' => (string) Str::uuid(),
                'question' => 'Would you like more detailed steps on this process?',
                'priority' => 'high',
                'display_position' => 'end',
            ];
        }

        if (in_array('what', $queryWords)) {
            $followUps[] = [
                'id' => (string) Str::uuid(),
                'question' => 'Do you want examples of this concept?',
                'priority' => 'medium',
                'display_position' => 'end',
            ];
        }

        // Always include general follow-ups
        $followUps[] = [
            'id' => (string) Str::uuid(),
            'question' => 'Would you like me to explain any part of this in more detail?',
            'priority' => 'medium',
            'display_position' => 'end',
        ];

        $followUps[] = [
            'id' => (string) Str::uuid(),
            'question' => 'Is there anything specific you want to know about this topic?',
            'priority' => 'low',
            'display_position' => 'end',
        ];

        // Only return a limited number of follow-ups
        return array_slice($followUps, 0, 3);
    }
}
