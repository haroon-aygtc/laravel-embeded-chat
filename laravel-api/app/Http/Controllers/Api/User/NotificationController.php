<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\User;

use App\Http\Controllers\Controller;
use App\Services\User\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(private readonly NotificationService $notificationService) {}

    /**
     * Get notifications for a user
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'userId' => 'required|exists:users,id',
            'limit' => 'sometimes|integer|min:1|max:50',
        ]);

        return $this->notificationService->getUserNotifications($validated);
    }

    /**
     * Get unread notification count for a user
     */
    public function getUnreadCount(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'userId' => 'required|exists:users,id',
        ]);

        return $this->notificationService->getUnreadCount($validated['userId']);
    }

    /**
     * Mark specific notifications as read
     */
    public function markAsRead(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'notificationIds' => 'required|array',
            'notificationIds.*' => 'required|string',
        ]);

        return $this->notificationService->markAsRead($validated['notificationIds']);
    }

    /**
     * Mark all notifications as read for a user
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'userId' => 'required|exists:users,id',
        ]);

        return $this->notificationService->markAllAsRead($validated['userId']);
    }

    /**
     * Create a new notification
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'userId' => 'required|exists:users,id',
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'type' => 'sometimes|string|max:50',
            'link' => 'sometimes|nullable|string',
            'metadata' => 'sometimes|nullable|array',
        ]);

        return $this->notificationService->createNotification($validated);
    }

    /**
     * Delete a notification
     */
    public function destroy(string $id): JsonResponse
    {
        return $this->notificationService->deleteNotification($id);
    }
}
