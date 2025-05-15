<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Widget;

use App\Http\Controllers\Controller;
use App\Http\Requests\Widget\CreateWidgetRequest;
use App\Http\Requests\Widget\UpdateWidgetRequest;
use App\Models\Widget;
use App\Services\WidgetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class WidgetController extends Controller
{
    protected WidgetService $widgetService;

    /**
     * Constructor with dependency injection
     *
     * @param WidgetService $widgetService
     */
    public function __construct(WidgetService $widgetService)
    {
        $this->widgetService = $widgetService;
        $this->middleware('auth:sanctum');
    }

    /**
     * Get all widgets for the current user
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        $widgets = $this->widgetService->getAllWidgetsByUser(Auth::id());

        return response()->json($widgets);
    }

    /**
     * Get a widget by ID
     *
     * @param string $id Widget ID
     * @return JsonResponse
     */
    public function show(string $id): JsonResponse
    {
        $widget = $this->widgetService->getWidgetById($id);

        if (!$widget) {
            return response()->json(['error' => 'Widget not found'], 404);
        }

        return response()->json($widget);
    }

    /**
     * Create a new widget
     *
     * @param CreateWidgetRequest $request
     * @return JsonResponse
     */
    public function store(CreateWidgetRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['user_id'] = Auth::id();

        // Generate a new UUID
        $data['id'] = Str::uuid()->toString();

        $widget = $this->widgetService->createWidget($data);

        return response()->json($widget, 201);
    }

    /**
     * Update an existing widget
     *
     * @param UpdateWidgetRequest $request
     * @param string $id Widget ID
     * @return JsonResponse
     */
    public function update(UpdateWidgetRequest $request, string $id): JsonResponse
    {
        $data = $request->validated();

        $widget = $this->widgetService->getWidgetById($id);

        if (!$widget) {
            return response()->json(['error' => 'Widget not found'], 404);
        }

        if ($widget->user_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $updatedWidget = $this->widgetService->updateWidget($id, $data);

        return response()->json($updatedWidget);
    }

    /**
     * Delete a widget
     *
     * @param string $id Widget ID
     * @return JsonResponse
     */
    public function destroy(string $id): JsonResponse
    {
        $widget = $this->widgetService->getWidgetById($id);

        if (!$widget) {
            return response()->json(['error' => 'Widget not found'], 404);
        }

        if ($widget->user_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $this->widgetService->deleteWidget($id);

        return response()->json(['message' => 'Widget deleted successfully']);
    }

    /**
     * Activate a widget
     *
     * @param string $id Widget ID
     * @return JsonResponse
     */
    public function activate(string $id): JsonResponse
    {
        $widget = $this->widgetService->getWidgetById($id);

        if (!$widget) {
            return response()->json(['error' => 'Widget not found'], 404);
        }

        if ($widget->user_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $updatedWidget = $this->widgetService->updateWidget($id, ['is_active' => true]);

        return response()->json($updatedWidget);
    }

    /**
     * Deactivate a widget
     *
     * @param string $id Widget ID
     * @return JsonResponse
     */
    public function deactivate(string $id): JsonResponse
    {
        $widget = $this->widgetService->getWidgetById($id);

        if (!$widget) {
            return response()->json(['error' => 'Widget not found'], 404);
        }

        if ($widget->user_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $updatedWidget = $this->widgetService->updateWidget($id, ['is_active' => false]);

        return response()->json($updatedWidget);
    }

    /**
     * Get embed code for a widget
     *
     * @param string $id Widget ID
     * @return JsonResponse
     */
    public function getEmbedCode(string $id): JsonResponse
    {
        $widget = $this->widgetService->getWidgetById($id);

        if (!$widget) {
            return response()->json(['error' => 'Widget not found'], 404);
        }

        if ($widget->user_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $baseUrl = config('app.frontend_url');
        $widgetId = $widget->id;

        $embedCode = "<script src=\"{$baseUrl}/widget.js\" defer></script>\n" .
            "<script>\n" .
            "  document.addEventListener('DOMContentLoaded', function() {\n" .
            "    TheLastLab.initChat({\n" .
            "      widgetId: '{$widgetId}',\n" .
            "      container: 'tllab-chat-container', // Optional custom container ID\n" .
            "    });\n" .
            "  });\n" .
            "</script>\n" .
            "<div id=\"tllab-chat-container\"></div>";

        return response()->json(['code' => $embedCode]);
    }

    /**
     * Get the default widget configuration
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getDefaultWidget(): JsonResponse
    {
        try {
            $result = $this->widgetService->getDefaultWidget();

            return response()->json([
                'success' => true,
                'data' => $result,
                'message' => 'Default widget configuration retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve default widget configuration: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle a widget's active status
     *
     * @param string $id Widget ID
     * @return \Illuminate\Http\JsonResponse
     */
    public function toggleStatus(string $id)
    {
        $result = $this->widgetService->toggleWidgetStatus($id);

        return response()->json($result);
    }

    /**
     * Generate widget embed code
     *
     * @param Request $request
     * @param string $id Widget ID
     * @return \Illuminate\Http\JsonResponse
     */
    public function generateEmbedCode(Request $request, string $id)
    {
        $type = $request->input('type', 'iframe');
        $result = $this->widgetService->generateEmbedCode($id, $type);

        return response()->json($result);
    }

    /**
     * Get widget analytics data
     *
     * @param Request $request
     * @param string $id Widget ID
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAnalytics(Request $request, string $id)
    {
        $timeRange = $request->input('time_range', '7d');
        $result = $this->widgetService->getWidgetAnalytics($id, $timeRange);

        return response()->json($result);
    }

    /**
     * Get all widgets for the current user
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUserWidgets()
    {
        $result = $this->widgetService->getWidgetsByUser(Auth::id());

        return response()->json($result);
    }

    /**
     * Validate if a domain is allowed for embedding.
     */
    public function validateDomain(string $id, Request $request): JsonResponse
    {
        try {
            $domain = $request->input('domain');

            if (!$domain) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Domain parameter is required'
                ], 400);
            }

            $isValid = $this->widgetService->isValidDomain($id, $domain);

            return response()->json([
                'status' => 'success',
                'data' => [
                    'is_valid' => $isValid
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error validating domain: ' . $e->getMessage(), [
                'exception' => $e,
                'widget_id' => $id,
                'domain' => $request->input('domain')
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to validate domain'
            ], 500);
        }
    }
}
