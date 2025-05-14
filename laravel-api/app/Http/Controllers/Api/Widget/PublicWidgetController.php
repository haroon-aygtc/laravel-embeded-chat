<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Widget;

use App\Http\Controllers\Controller;
use App\Models\Widget;
use App\Services\WidgetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PublicWidgetController extends Controller
{
    /**
     * Constructor.
     */
    public function __construct(protected WidgetService $widgetService)
    {
    }

    /**
     * Get widget configuration for embedded use.
     */
    public function getConfig(string $id, Request $request): JsonResponse
    {
        try {
            $widget = Widget::where('id', $id)->where('is_active', true)->first();
            
            if (!$widget) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Widget not found or inactive'
                ], 404);
            }
            
            // Check domain origin if domains are restricted
            $origin = $request->header('Origin');
            $referer = $request->header('Referer');
            
            if (!empty($widget->allowed_domains) && $origin) {
                $domain = parse_url($origin, PHP_URL_HOST);
                if (!$this->widgetService->isValidDomain($id, $domain)) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'This domain is not allowed to embed this widget'
                    ], 403);
                }
            } elseif (!empty($widget->allowed_domains) && $referer) {
                $domain = parse_url($referer, PHP_URL_HOST);
                if (!$this->widgetService->isValidDomain($id, $domain)) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'This domain is not allowed to embed this widget'
                    ], 403);
                }
            }
            
            // Return only the necessary config for public use
            return response()->json([
                'status' => 'success',
                'data' => [
                    'id' => $widget->id,
                    'title' => $widget->title,
                    'subtitle' => $widget->subtitle,
                    'visual_settings' => $widget->visual_settings,
                    'behavioral_settings' => $widget->behavioral_settings,
                    'content_settings' => $widget->content_settings,
                    'context_rule_id' => $widget->context_rule_id,
                    'knowledge_base_ids' => $widget->knowledge_base_ids,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching public widget config: ' . $e->getMessage(), [
                'exception' => $e,
                'widget_id' => $id,
                'origin' => $request->header('Origin'),
                'referer' => $request->header('Referer')
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to load widget configuration'
            ], 500);
        }
    }

    /**
     * Create a new chat session for a widget.
     */
    public function createChatSession(string $id, Request $request): JsonResponse
    {
        try {
            $widget = Widget::where('id', $id)->where('is_active', true)->first();
            
            if (!$widget) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Widget not found or inactive'
                ], 404);
            }
            
            // Check domain origin if domains are restricted
            $origin = $request->header('Origin');
            if (!empty($widget->allowed_domains) && $origin) {
                $domain = parse_url($origin, PHP_URL_HOST);
                if (!$this->widgetService->isValidDomain($id, $domain)) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'This domain is not allowed to embed this widget'
                    ], 403);
                }
            }
            
            // Create a new chat session with a unique ID for the widget
            $sessionId = uniqid('sess_', true);
            $sessionName = 'Embedded Chat ' . date('Y-m-d H:i:s');
            
            $chatSession = \App\Models\Chat\ChatSession::create([
                'id' => $sessionId,
                'name' => $sessionName,
                'widget_id' => $widget->id,
                'context_rule_id' => $widget->context_rule_id,
                'context_name' => 'widget',
                'context_mode' => 'embedded',
                'is_active' => true,
            ]);
            
            return response()->json([
                'status' => 'success',
                'data' => [
                    'session_id' => $chatSession->id,
                    'name' => $chatSession->name,
                ]
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating widget chat session: ' . $e->getMessage(), [
                'exception' => $e,
                'widget_id' => $id,
                'origin' => $request->header('Origin')
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create chat session'
            ], 500);
        }
    }
} 