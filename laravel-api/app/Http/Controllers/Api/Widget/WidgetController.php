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
    /**
     * Constructor.
     */
    public function __construct(protected WidgetService $widgetService)
    {
    }

    /**
     * Display a listing of the widgets.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = $request->only(['name', 'is_active', 'user_id']);
            $perPage = (int) $request->input('per_page', 10);
            
            $widgets = $this->widgetService->getWidgets($filters, $perPage);
            
            return response()->json([
                'status' => 'success',
                'data' => $widgets
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching widgets: ' . $e->getMessage(), [
                'exception' => $e,
                'user_id' => Auth::id()
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch widgets'
            ], 500);
        }
    }

    /**
     * Store a newly created widget in storage.
     */
    public function store(StoreWidgetRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();
            $widget = $this->widgetService->createWidget($data);
            
            return response()->json([
                'status' => 'success',
                'message' => 'Widget created successfully',
                'data' => $widget
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating widget: ' . $e->getMessage(), [
                'exception' => $e,
                'user_id' => Auth::id(),
                'data' => $request->validated()
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create widget'
            ], 500);
        }
    }

    /**
     * Display the specified widget.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $widget = $this->widgetService->getWidget($id);
            
            if (!$widget) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Widget not found'
                ], 404);
            }
            
            // Check if user has access to widget
            if ($widget->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthorized access to widget'
                ], 403);
            }
            
            return response()->json([
                'status' => 'success',
                'data' => $widget
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching widget: ' . $e->getMessage(), [
                'exception' => $e,
                'user_id' => Auth::id(),
                'widget_id' => $id
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch widget'
            ], 500);
        }
    }

    /**
     * Update the specified widget in storage.
     */
    public function update(UpdateWidgetRequest $request, string $id): JsonResponse
    {
        try {
            $data = $request->validated();
            $widget = $this->widgetService->updateWidget($id, $data);
            
            if (!$widget) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Widget not found or unauthorized'
                ], 404);
            }
            
            return response()->json([
                'status' => 'success',
                'message' => 'Widget updated successfully',
                'data' => $widget
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating widget: ' . $e->getMessage(), [
                'exception' => $e,
                'user_id' => Auth::id(),
                'widget_id' => $id,
                'data' => $request->validated()
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update widget'
            ], 500);
        }
    }

    /**
     * Remove the specified widget from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $result = $this->widgetService->deleteWidget($id);
            
            if (!$result) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Widget not found or unauthorized'
                ], 404);
            }
            
            return response()->json([
                'status' => 'success',
                'message' => 'Widget deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting widget: ' . $e->getMessage(), [
                'exception' => $e,
                'user_id' => Auth::id(),
                'widget_id' => $id
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete widget'
            ], 500);
        }
    }

    /**
     * Toggle the active status of a widget.
     */
    public function toggleStatus(string $id): JsonResponse
    {
        try {
            $widget = $this->widgetService->toggleWidgetStatus($id);
            
            if (!$widget) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Widget not found or unauthorized'
                ], 404);
            }
            
            $status = $widget->is_active ? 'activated' : 'deactivated';
            
            return response()->json([
                'status' => 'success',
                'message' => "Widget {$status} successfully",
                'data' => $widget
            ]);
        } catch (\Exception $e) {
            Log::error('Error toggling widget status: ' . $e->getMessage(), [
                'exception' => $e,
                'user_id' => Auth::id(),
                'widget_id' => $id
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to toggle widget status'
            ], 500);
        }
    }

    /**
     * Generate embed code for a widget.
     */
    public function generateEmbedCode(string $id, Request $request): JsonResponse
    {
        try {
            $type = $request->input('type', 'iframe');
            
            if (!in_array($type, ['iframe', 'webcomponent'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid embed type. Must be "iframe" or "webcomponent"'
                ], 400);
            }
            
            $widget = $this->widgetService->getWidget($id);
            
            if (!$widget) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Widget not found'
                ], 404);
            }
            
            // Check if user has access to widget
            if ($widget->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthorized access to widget'
                ], 403);
            }
            
            $embedCode = $this->widgetService->generateEmbedCode($id, $type);
            
            if (!$embedCode) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Failed to generate embed code'
                ], 500);
            }
            
            return response()->json([
                'status' => 'success',
                'data' => [
                    'embed_code' => $embedCode,
                    'type' => $type
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error generating embed code: ' . $e->getMessage(), [
                'exception' => $e,
                'user_id' => Auth::id(),
                'widget_id' => $id
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to generate embed code'
            ], 500);
        }
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