<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Widget;

use App\Http\Controllers\Controller;
use App\Http\Requests\Widget\StoreWidgetRequest;
use App\Http\Requests\Widget\UpdateWidgetRequest;
use App\Models\Widget;
use App\Services\WidgetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class WidgetController extends Controller
{
    protected $widgetService;

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
     * Get a paginated list of widgets for the authenticated user
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $filters = $request->only(['name', 'is_active']);
        $perPage = $request->input('per_page', 10);
        $page = $request->input('page', 1);

        $result = $this->widgetService->getAllWidgets($filters, $page, $perPage);

        return response()->json($result);
    }

    /**
     * Get a specific widget by ID
     *
     * @param string $id Widget ID
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(string $id)
    {
        $result = $this->widgetService->getWidget($id);

        return response()->json($result);
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
     * Create a new widget
     *
     * @param StoreWidgetRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(StoreWidgetRequest $request)
    {
        $data = $request->validated();

        // Ensure the authenticated user is set as the owner
        $data['user_id'] = Auth::id();

        $result = $this->widgetService->createWidget($data);

        return response()->json($result, $result['status'] === 'success' ? 201 : 422);
    }

    /**
     * Update an existing widget
     *
     * @param UpdateWidgetRequest $request
     * @param string $id Widget ID
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(UpdateWidgetRequest $request, string $id)
    {
        $result = $this->widgetService->updateWidget($id, $request->validated());

        return response()->json($result);
    }

    /**
     * Delete a widget
     *
     * @param string $id Widget ID
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(string $id)
    {
        $result = $this->widgetService->deleteWidget($id);

        return response()->json($result);
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
