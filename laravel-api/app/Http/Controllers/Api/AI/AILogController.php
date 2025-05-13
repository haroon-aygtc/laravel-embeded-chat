<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\AI;

use App\Http\Controllers\Controller;
use App\Services\AI\AIService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AILogController extends Controller
{
    /**
     * Create a new controller instance.
     */
    public function __construct(private readonly AIService $aiService)
    {
    }

    /**
     * Get AI interaction logs with pagination and filtering
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'page' => 'sometimes|integer|min:1',
            'pageSize' => 'sometimes|integer|min:1|max:100',
            'query' => 'sometimes|string',
            'modelUsed' => 'sometimes|string',
            'contextRuleId' => 'sometimes|string',
            'startDate' => 'sometimes|date',
            'endDate' => 'sometimes|date',
            'userId' => 'sometimes|string',
        ]);

        $logs = $this->aiService->getInteractionLogs($validated);

        return response()->json($logs);
    }

    /**
     * Get a specific AI interaction log
     */
    public function show(string $id): JsonResponse
    {
        $log = $this->aiService->getInteractionLogById($id);

        if (!$log) {
            return response()->json(['message' => 'AI interaction log not found'], 404);
        }

        return response()->json($log);
    }

    /**
     * Export AI logs to CSV
     */
    public function export(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => 'sometimes|string',
            'modelUsed' => 'sometimes|string',
            'contextRuleId' => 'sometimes|string',
            'startDate' => 'sometimes|date',
            'endDate' => 'sometimes|date',
            'userId' => 'sometimes|string',
        ]);

        // Generate a unique filename
        $filename = 'ai-logs-' . date('Y-m-d-His') . '-' . Str::random(8) . '.csv';

        // Generate CSV using the AIService
        $csvData = $this->aiService->generateLogsExport($validated);

        // Save to storage
        $path = 'exports/' . $filename;
        Storage::put($path, $csvData);

        // Make the file downloadable for a short time (URL will expire)
        $url = Storage::temporaryUrl($path, now()->addMinutes(30));

        return response()->json([
            'csvUrl' => $url,
            'filename' => $filename,
        ]);
    }

    /**
     * Delete an AI interaction log
     */
    public function destroy(string $id): JsonResponse
    {
        $success = $this->aiService->deleteInteractionLog($id);

        if (!$success) {
            return response()->json(['message' => 'AI interaction log not found'], 404);
        }

        return response()->json(['message' => 'AI interaction log deleted successfully']);
    }
}
