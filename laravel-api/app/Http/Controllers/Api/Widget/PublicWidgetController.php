<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Widget;

use App\Http\Controllers\Controller;
use App\Models\Widget;
use App\Models\Chat\ChatSession;
use App\Models\Chat\ChatMessage;
use App\Services\AI\AIService;
use App\Services\WidgetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class PublicWidgetController extends Controller
{
    protected $widgetService;
    protected $aiService;

    /**
     * Constructor with dependency injection
     *
     * @param WidgetService $widgetService
     * @param AIService $aiService
     */
    public function __construct(WidgetService $widgetService, AIService $aiService)
    {
        $this->widgetService = $widgetService;
        $this->aiService = $aiService;
    }

    /**
     * Get widget configuration for public display
     *
     * @param string $id Widget ID
     * @return \Illuminate\Http\JsonResponse
     */
    public function getConfig($id)
    {
        try {
            $widget = Widget::findOrFail($id);

            // Check if widget is active
            if (!$widget->is_active) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Widget is not active'
                ], 404);
            }

            // Check domain restrictions if configured
            if ($widget->allowed_domains && count($widget->allowed_domains) > 0) {
                $referer = request()->headers->get('referer');
                $isAllowed = false;

                if ($referer) {
                    $host = parse_url($referer, PHP_URL_HOST);

                    foreach ($widget->allowed_domains as $domain) {
                        // Check exact match or wildcard subdomain
                        if ($domain === $host || (str_starts_with($domain, '*.') &&
                            (substr_count($host, '.') > 1 &&
                             str_ends_with($host, substr($domain, 2))))) {
                            $isAllowed = true;
                            break;
                        }
                    }
                }

                if (!$isAllowed) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Domain not allowed'
                    ], 403);
                }
            }

            // Return only necessary widget configuration for public access
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
                    'knowledge_base_ids' => $widget->knowledge_base_ids
                ],
                'message' => 'Widget configuration retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting widget configuration: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Widget not found'
            ], 404);
        }
    }

    /**
     * Create a new chat session for a widget
     *
     * @param string $id Widget ID
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function createSession($id, Request $request)
    {
        try {
            $widget = Widget::findOrFail($id);

            // Check if widget is active
            if (!$widget->is_active) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Widget is not active'
                ], 404);
            }

            // Create a new chat session
            $session = new ChatSession();
            $session->id = (string) Str::uuid();
            $session->widget_id = $widget->id;
            $session->status = 'active';
            $session->metadata = [
                'ip' => $request->ip(),
                'user_agent' => $request->header('User-Agent'),
                'referrer' => $request->header('Referer'),
                'is_public' => true
            ];
            $session->save();

            // If a welcome message is configured, add it as a system message
            if (isset($widget->content_settings['welcomeMessage']) && !empty($widget->content_settings['welcomeMessage'])) {
                $message = new ChatMessage();
                $message->id = (string) Str::uuid();
                $message->session_id = $session->id;
                $message->content = $widget->content_settings['welcomeMessage'];
                $message->type = 'system';
                $message->save();
            }

            return response()->json([
                'status' => 'success',
                'data' => [
                    'session_id' => $session->id,
                    'name' => 'Chat ' . substr($session->id, 0, 8)
                ],
                'message' => 'Chat session created successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error creating chat session: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create chat session'
            ], 500);
        }
    }

    /**
     * Get messages for a chat session
     *
     * @param string $sessionId Chat session ID
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getMessages($sessionId, Request $request)
    {
        try {
            $validator = Validator::make(['session_id' => $sessionId], [
                'session_id' => 'required|uuid|exists:chat_sessions,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid session ID'
                ], 400);
            }

            $session = ChatSession::findOrFail($sessionId);

            // Get pagination parameters
            $page = $request->input('page', 1);
            $limit = $request->input('limit', 50);

            // Get messages with pagination
            $messages = ChatMessage::where('session_id', $sessionId)
                ->orderBy('created_at', 'asc')
                ->paginate($limit, ['*'], 'page', $page);

            return response()->json([
                'status' => 'success',
                'data' => $messages,
                'message' => 'Chat messages retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error retrieving chat messages: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve chat messages'
            ], 500);
        }
    }

    /**
     * Send a message in a chat session
     *
     * @param string $sessionId Chat session ID
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function sendMessage($sessionId, Request $request)
    {
        try {
            $validator = Validator::make([
                'session_id' => $sessionId,
                'content' => $request->input('content'),
                'type' => $request->input('type', 'text')
            ], [
                'session_id' => 'required|uuid|exists:chat_sessions,id',
                'content' => 'required|string|max:4000',
                'type' => 'in:text,file'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid input',
                    'errors' => $validator->errors()
                ], 400);
            }

            $session = ChatSession::with('widget')->findOrFail($sessionId);

            // Save user message
            $userMessage = new ChatMessage();
            $userMessage->id = (string) Str::uuid();
            $userMessage->session_id = $sessionId;
            $userMessage->content = $request->input('content');
            $userMessage->type = 'user';
            $userMessage->metadata = [
                'ip' => $request->ip(),
                'type' => $request->input('type', 'text')
            ];
            $userMessage->save();

            // Process with AI and get response
            $contextRuleId = $session->widget ? $session->widget->context_rule_id : null;
            $knowledgeBaseIds = $session->widget ? $session->widget->knowledge_base_ids : null;

            $aiResponse = $this->aiService->generateResponse(
                $request->input('content'),
                $contextRuleId,
                $knowledgeBaseIds
            );

            // Save AI response
            $aiMessage = new ChatMessage();
            $aiMessage->id = (string) Str::uuid();
            $aiMessage->session_id = $sessionId;
            $aiMessage->content = $aiResponse['content'] ?? 'Sorry, I could not generate a response at this time.';
            $aiMessage->type = 'ai';
            $aiMessage->metadata = [
                'model_used' => $aiResponse['modelUsed'] ?? null,
                'knowledge_used' => isset($aiResponse['knowledgeBaseResults']) && $aiResponse['knowledgeBaseResults'] > 0
            ];
            $aiMessage->save();

            // Update session last activity
            $session->touch();

            return response()->json([
                'status' => 'success',
                'data' => [
                    'user_message' => $userMessage,
                    'ai_message' => $aiMessage
                ],
                'message' => 'Message sent successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error sending message: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to send message'
            ], 500);
        }
    }

    /**
     * Validate if a domain is allowed for a widget
     *
     * @param string $id Widget ID
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function validateDomain($id, Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'domain' => 'required|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid domain',
                    'errors' => $validator->errors()
                ], 400);
            }

            $widget = Widget::findOrFail($id);
            $domain = $request->input('domain');

            // If no domains are specified, all domains are allowed
            if (!$widget->allowed_domains || count($widget->allowed_domains) === 0) {
                return response()->json([
                    'status' => 'success',
                    'data' => [
                        'is_valid' => true
                    ],
                    'message' => 'Domain is allowed'
                ]);
            }

            // Check if domain is allowed
            $isAllowed = false;
            foreach ($widget->allowed_domains as $allowedDomain) {
                // Check exact match or wildcard subdomain
                if ($allowedDomain === $domain ||
                   (str_starts_with($allowedDomain, '*.') &&
                    (substr_count($domain, '.') > 1 &&
                     str_ends_with($domain, substr($allowedDomain, 2))))) {
                    $isAllowed = true;
                    break;
                }
            }

            return response()->json([
                'status' => 'success',
                'data' => [
                    'is_valid' => $isAllowed
                ],
                'message' => $isAllowed ? 'Domain is allowed' : 'Domain is not allowed'
            ]);
        } catch (\Exception $e) {
            Log::error('Error validating domain: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to validate domain'
            ], 500);
        }
    }
}
