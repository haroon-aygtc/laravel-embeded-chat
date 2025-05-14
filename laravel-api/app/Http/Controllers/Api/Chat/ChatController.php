<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Chat;

use App\Http\Controllers\Controller;
use App\Services\Chat\ChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Events\ChatMessageEvent;
use App\Events\ChatTypingEvent;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use App\Models\ChatSession;
use App\Models\ChatMessage;
use Illuminate\Support\Facades\Log;
use App\Services\AI\AIService;

class ChatController extends Controller
{
    public function __construct(
        private readonly ChatService $chatService,
        private readonly AIService $aiService
    ) {}

    /**
     * Get all chat sessions for the current user
     */
    public function getSessions(Request $request): JsonResponse
    {
        return $this->chatService->getSessions($request->user());
    }

    /**
     * Get a specific chat session
     */
    public function getSession(Request $request, string $sessionId): JsonResponse
    {
        return $this->chatService->getSession($request->user(), $sessionId);
    }

    /**
     * Create a new chat session
     */
    public function createSession(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contextRuleId' => 'nullable|string',
            'contextName' => 'nullable|string',
            'contextMode' => 'nullable|string|in:restricted,general',
        ]);

        return $this->chatService->createSession($request->user(), $validated);
    }

    /**
     * Update a chat session
     */
    public function updateSession(Request $request, string $sessionId): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'contextRuleId' => 'sometimes|nullable|string',
            'contextName' => 'sometimes|nullable|string',
            'contextMode' => 'sometimes|nullable|string|in:restricted,general',
        ]);

        return $this->chatService->updateSession($request->user(), $sessionId, $validated);
    }

    /**
     * Delete a chat session
     */
    public function deleteSession(Request $request, string $sessionId): JsonResponse
    {
        return $this->chatService->deleteSession($request->user(), $sessionId);
    }

    /**
     * Get messages from a chat session
     */
    public function getMessages(Request $request, string $sessionId): JsonResponse
    {
        return $this->chatService->getMessages($request->user(), $sessionId);
    }

    /**
     * Send a message in a chat session.
     */
    public function sendMessage(Request $request, string $sessionId): JsonResponse
    {
        try {
            $chatSession = ChatSession::where('id', $sessionId)
                ->where('user_id', Auth::id())
                ->first();
            
            if (!$chatSession) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Chat session not found'
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
            
            // Broadcast that the user has sent a message (and is no longer typing)
            event(new ChatTypingEvent($sessionId, Auth::id(), false));
            
            // Broadcast the user message
            event(new ChatMessageEvent($userMessage));
            
            // Get AI response
            $aiResponse = $this->aiService->generate(
                $validated['content'],
                $chatSession->context_rule_id,
                null,
                $sessionId
            );
            
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
            Log::error('Error sending chat message: ' . $e->getMessage(), [
                'exception' => $e,
                'user_id' => Auth::id(),
                'session_id' => $sessionId
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to send message'
            ], 500);
        }
    }

    /**
     * Update typing status for a chat session.
     */
    public function updateTypingStatus(Request $request, string $sessionId): JsonResponse
    {
        try {
            $chatSession = ChatSession::find($sessionId);
            
            if (!$chatSession) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Chat session not found'
                ], 404);
            }
            
            // Check if user has access to this session
            if ($chatSession->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthorized access to chat session'
                ], 403);
            }
            
            $validated = $request->validate([
                'is_typing' => 'required|boolean',
            ]);
            
            // Broadcast typing status
            event(new ChatTypingEvent(
                $sessionId, 
                Auth::id(), 
                $validated['is_typing']
            ));
            
            return response()->json([
                'status' => 'success',
                'message' => 'Typing status updated'
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating typing status: ' . $e->getMessage(), [
                'exception' => $e,
                'user_id' => Auth::id(),
                'session_id' => $sessionId
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update typing status'
            ], 500);
        }
    }

    /**
     * Clear messages in a chat session
     */
    public function clearMessages(Request $request, string $sessionId): JsonResponse
    {
        return $this->chatService->clearMessages($request->user(), $sessionId);
    }

    /**
     * Get chat sessions for a specific user
     */
    public function getUserSessions(Request $request, string $userId): JsonResponse
    {
        return $this->chatService->getUserSessions($request->user(), $userId);
    }

    /**
     * Get chat sessions for a specific widget
     */
    public function getWidgetSessions(Request $request, string $widgetId): JsonResponse
    {
        return $this->chatService->getWidgetSessions($request->user(), $widgetId);
    }

    /**
     * Mark messages in a session as read
     */
    public function markAsRead(Request $request, string $sessionId): JsonResponse
    {
        return $this->chatService->markAsRead($request->user(), $sessionId);
    }

    /**
     * Upload a file attachment
     */
    public function uploadAttachment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file' => 'required|file|max:10240', // 10MB max
            'sessionId' => 'required|string',
        ]);

        return $this->chatService->uploadAttachment($request->user(), $validated);
    }

    /**
     * Get a specific attachment
     */
    public function getAttachment(Request $request, string $id): JsonResponse
    {
        return $this->chatService->getAttachment($request->user(), $id);
    }

    /**
     * Download a specific attachment file
     */
    public function downloadAttachment(Request $request, string $id)
    {
        return $this->chatService->downloadAttachment($request->user(), $id);
    }

    /**
     * Get chat analytics
     */
    public function getAnalytics(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'startDate' => 'sometimes|date',
            'endDate' => 'sometimes|date',
            'userId' => 'sometimes|string',
        ]);

        return $this->chatService->getAnalytics($request->user(), $validated);
    }

    /**
     * Get session statistics
     */
    public function getSessionStats(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'startDate' => 'sometimes|date',
            'endDate' => 'sometimes|date',
            'userId' => 'sometimes|string',
        ]);

        return $this->chatService->getSessionStats($request->user(), $validated);
    }

    /**
     * Get message statistics
     */
    public function getMessageStats(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'startDate' => 'sometimes|date',
            'endDate' => 'sometimes|date',
            'userId' => 'sometimes|string',
            'sessionId' => 'sometimes|string',
        ]);

        return $this->chatService->getMessageStats($request->user(), $validated);
    }
}
