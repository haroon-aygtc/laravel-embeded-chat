<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Chat;

use App\Http\Controllers\Controller;
use App\Services\Chat\ChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function __construct(private readonly ChatService $chatService) {}

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
     * Send a message in a chat session
     */
    public function sendMessage(Request $request, string $sessionId): JsonResponse
    {
        $validated = $request->validate([
            'content' => 'required|string',
            'attachments' => 'nullable|array',
            'contextSnippets' => 'nullable|array',
        ]);

        return $this->chatService->sendMessage($request->user(), $sessionId, $validated);
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
