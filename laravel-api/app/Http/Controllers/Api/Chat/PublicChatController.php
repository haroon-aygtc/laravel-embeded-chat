<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Chat;

use App\Http\Controllers\Controller;
use App\Models\Chat\ChatMessage;
use App\Models\Chat\ChatSession;
use App\Services\AI\AIService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use App\Events\ChatMessageEvent;
use App\Events\ChatTypingEvent;

class PublicChatController extends Controller
{
    /**
     * Constructor.
     */
    public function __construct(
        protected AIService $aiService
    ) {
    }

    /**
     * Get messages for a public chat session.
     */
    public function getMessages(string $sessionId, Request $request): JsonResponse
    {
        try {
            $chatSession = ChatSession::where('id', $sessionId)
                ->where('context_mode', 'embedded')
                ->where('is_active', true)
                ->first();
            
            if (!$chatSession) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Chat session not found or inactive'
                ], 404);
            }
            
            $perPage = (int) $request->input('limit', 50);
            $page = (int) $request->input('page', 1);
            
            $messages = ChatMessage::where('chat_session_id', $sessionId)
                ->orderBy('created_at', 'desc')
                ->paginate($perPage, ['*'], 'page', $page);
            
            return response()->json([
                'status' => 'success',
                'data' => $messages
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching public chat messages: ' . $e->getMessage(), [
                'exception' => $e,
                'session_id' => $sessionId
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch chat messages'
            ], 500);
        }
    }

    /**
     * Send a message in a public chat session.
     */
    public function sendMessage(string $sessionId, Request $request): JsonResponse
    {
        try {
            $chatSession = ChatSession::where('id', $sessionId)
                ->where('context_mode', 'embedded')
                ->where('is_active', true)
                ->first();
            
            if (!$chatSession) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Chat session not found or inactive'
                ], 404);
            }
            
            // Validate the request
            $validated = $request->validate([
                'content' => 'required|string|max:10000',
                'type' => 'required|string|in:text,image,file',
                'attachment_id' => 'nullable|string|exists:chat_attachments,id',
            ]);
            
            // Create the user message
            $userMessage = ChatMessage::create([
                'id' => (string) Str::uuid(),
                'chat_session_id' => $sessionId,
                'content' => $validated['content'],
                'type' => $validated['type'],
                'role' => 'user',
                'attachment_id' => $validated['attachment_id'] ?? null,
            ]);
            
            // Broadcast the user message
            event(new ChatMessageEvent($userMessage));
            
            // Get the widget ID and context rule ID from the session
            $widgetId = $chatSession->widget_id;
            $contextRuleId = $chatSession->context_rule_id;
            
            // Get AI response
            $aiResponse = null;
            
            if ($widgetId) {
                // Use widget settings to customize AI response
                $widget = \App\Models\Widget::find($widgetId);
                
                if ($widget) {
                    // Use context rule from widget if available
                    $contextRuleId = $contextRuleId ?? $widget->context_rule_id;
                    
                    // Use knowledge base IDs from widget if available
                    $knowledgeBaseIds = $widget->knowledge_base_ids;
                    
                    // Generate AI response
                    $aiResponse = $this->aiService->generate(
                        $validated['content'],
                        $contextRuleId,
                        $knowledgeBaseIds,
                        $sessionId
                    );
                }
            }
            
            if (!$aiResponse) {
                // Fallback if no widget settings or AI generation failed
                $aiResponse = $this->aiService->generate(
                    $validated['content'],
                    $contextRuleId,
                    null,
                    $sessionId
                );
            }
            
            // Create the AI response message
            $aiMessage = ChatMessage::create([
                'id' => (string) Str::uuid(),
                'chat_session_id' => $sessionId,
                'content' => $aiResponse['content'] ?? 'Sorry, I could not generate a response at this time.',
                'type' => 'text',
                'role' => 'assistant',
                'metadata' => [
                    'model' => $aiResponse['model'] ?? null,
                    'processing_time' => $aiResponse['processing_time'] ?? null,
                    'tokens' => $aiResponse['tokens'] ?? null,
                ]
            ]);
            
            // Broadcast the AI response
            event(new ChatMessageEvent($aiMessage));
            
            return response()->json([
                'status' => 'success',
                'data' => [
                    'user_message' => $userMessage,
                    'ai_message' => $aiMessage
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error sending public chat message: ' . $e->getMessage(), [
                'exception' => $e,
                'session_id' => $sessionId,
                'content' => $request->input('content')
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to send message'
            ], 500);
        }
    }

    /**
     * Update typing status for a public chat session.
     */
    public function updateTypingStatus(Request $request, string $sessionId): JsonResponse
    {
        try {
            $chatSession = ChatSession::where('id', $sessionId)
                ->where('context_mode', 'embedded')
                ->where('is_active', true)
                ->first();
            
            if (!$chatSession) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Chat session not found or inactive'
                ], 404);
            }
            
            $validated = $request->validate([
                'is_typing' => 'required|boolean',
                'client_id' => 'required|string',
            ]);
            
            // Broadcast typing status using client_id as user_id for public chats
            event(new ChatTypingEvent(
                $sessionId, 
                $validated['client_id'], 
                $validated['is_typing']
            ));
            
            return response()->json([
                'status' => 'success',
                'message' => 'Typing status updated'
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating public typing status: ' . $e->getMessage(), [
                'exception' => $e,
                'session_id' => $sessionId
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update typing status'
            ], 500);
        }
    }
} 