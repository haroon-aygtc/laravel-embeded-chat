<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\FollowUp;

use App\Http\Controllers\Controller;
use App\Models\AI\FollowUpConfig;
use App\Models\AI\FollowUpQuestion;
use App\Services\FollowUp\FollowUpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class FollowUpController extends Controller
{
    protected $followUpService;

    public function __construct(FollowUpService $followUpService)
    {
        $this->followUpService = $followUpService;
    }

    /**
     * Get all follow-up configurations
     */
    public function index(Request $request): JsonResponse
    {
        return $this->followUpService->getAllConfigs();
    }

    /**
     * Get a specific follow-up configuration
     */
    public function show(string $id): JsonResponse
    {
        return $this->followUpService->getConfig($id);
    }

    /**
     * Create a new follow-up configuration
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'enable_follow_up_questions' => 'boolean',
            'max_follow_up_questions' => 'integer|min:1|max:10',
            'show_follow_up_as' => 'string|in:buttons,chips,dropdown,list',
            'generate_automatically' => 'boolean',
            'is_default' => 'boolean',
            'predefined_question_sets' => 'nullable|array',
            'topic_based_question_sets' => 'nullable|array',
            'questions' => 'nullable|array',
            'questions.*.question' => 'required|string',
            'questions.*.display_order' => 'integer',
            'questions.*.is_active' => 'boolean',
            'questions.*.priority' => 'string|in:high,medium,low',
            'questions.*.display_position' => 'string|in:beginning,middle,end',
            'questions.*.category' => 'nullable|string',
            'questions.*.metadata' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        return $this->followUpService->createConfig($request->all());
    }

    /**
     * Update a follow-up configuration
     */
    public function update(Request $request, string $id): JsonResponse
    {
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

        return $this->followUpService->updateConfig($id, $request->all());
    }

    /**
     * Delete a follow-up configuration
     */
    public function destroy(string $id): JsonResponse
    {
        return $this->followUpService->deleteConfig($id);
    }

    /**
     * Get all questions for a specific configuration
     */
    public function getQuestions(string $configId): JsonResponse
    {
        return $this->followUpService->getQuestions($configId);
    }

    /**
     * Add a question to a configuration
     */
    public function addQuestion(Request $request, string $configId): JsonResponse
    {
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

        return $this->followUpService->addQuestion($configId, $request->all());
    }

    /**
     * Update a question
     */
    public function updateQuestion(Request $request, string $id): JsonResponse
    {
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

        return $this->followUpService->updateQuestion($id, $request->all());
    }

    /**
     * Delete a question
     */
    public function deleteQuestion(string $id): JsonResponse
    {
        return $this->followUpService->deleteQuestion($id);
    }

    /**
     * Reorder questions in a configuration
     */
    public function reorderQuestions(Request $request, string $configId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'question_ids' => 'required|array',
            'question_ids.*' => 'string|exists:follow_up_questions,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        return $this->followUpService->reorderQuestions($configId, $request->input('question_ids'));
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

        return $this->followUpService->generateFollowUps($request->all());
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
            'user_id' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        return $this->followUpService->processSelectedFollowUp($request->all());
    }
}
