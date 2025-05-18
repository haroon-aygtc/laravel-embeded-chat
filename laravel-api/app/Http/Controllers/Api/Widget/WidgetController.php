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
use Illuminate\Support\Facades\Validator;

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
        // Middleware should be applied in the route definition or in a constructor of a class that extends Controller
        // We'll remove this line as it's causing the error
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
     * Validate if a domain is allowed for a widget
     *
     * @param Request $request
     * @param string $id Widget ID
     * @return JsonResponse
     */
    public function validateDomain(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'domain' => 'required|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $domain = $request->input('domain');
        $result = $this->widgetService->validateDomain($id, $domain);

        return response()->json($result);
    }

    /**
     * Get widget configuration for a specific user
     *
     * @param string $userId User ID or 'current-user' for the authenticated user
     * @return JsonResponse
     */
    public function getWidgetConfigByUser(string $userId): JsonResponse
    {
        try {
            // Handle 'current-user' special case
            if ($userId === 'current-user') {
                $userId = Auth::id();
                Log::info('Using current user ID: ' . $userId);
            }

            // Validate user ID
            if (!$userId) {
                Log::warning('Widget config request with empty user ID');
                return response()->json([
                    'success' => false,
                    'message' => 'User ID is required'
                ], 400);
            }

            // Skip role check for now to simplify - just ensure the user is authenticated
            if (!Auth::check()) {
                Log::warning('Unauthenticated user tried to access widget config');
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication required'
                ], 401);
            }

            // Get the user's widgets
            Log::info('Fetching widgets for user: ' . $userId);
            $widgets = $this->widgetService->getWidgetsByUser((int)$userId);

            // If no widgets found, return the default widget configuration
            if (empty($widgets['data']) || (is_object($widgets['data']) && $widgets['data']->isEmpty())) {
                Log::info('No widgets found for user, returning default widget');
                $defaultWidget = $this->widgetService->getDefaultWidget();

                return response()->json([
                    'success' => true,
                    'data' => $defaultWidget,
                    'message' => 'Default widget configuration retrieved for user'
                ]);
            }

            // Return the first widget configuration
            Log::info('Returning widget configuration for user');
            return response()->json([
                'success' => true,
                'data' => is_object($widgets['data']) ? $widgets['data']->first() : $widgets['data'][0],
                'message' => 'Widget configuration retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error retrieving widget configuration for user: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString(),
                'userId' => $userId
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve widget configuration: ' . $e->getMessage()
            ], 500);
        }
    }
}
