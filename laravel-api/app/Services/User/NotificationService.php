<?php

declare(strict_types=1);

namespace App\Services\User;

use App\Models\User\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class NotificationService
{
    /**
     * Get notifications for a user.
     */
    public function getUserNotifications(array $data): JsonResponse
    {
        try {
            $userId = $data['userId'];
            $limit = $data['limit'] ?? 15;

            $notifications = Notification::forUser($userId)
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get();

            return response()->json($notifications);
        } catch (\Exception $e) {
            Log::error('Failed to get user notifications', [
                'error' => $e->getMessage(),
                'userId' => $data['userId'] ?? null,
            ]);

            return response()->json([
                'message' => 'Failed to get notifications',
            ], 500);
        }
    }

    /**
     * Get unread notification count for a user.
     */
    public function getUnreadCount(string $userId): JsonResponse
    {
        try {
            $count = Notification::forUser($userId)
                ->unread()
                ->count();

            return response()->json(['count' => $count]);
        } catch (\Exception $e) {
            Log::error('Failed to get unread notification count', [
                'error' => $e->getMessage(),
                'userId' => $userId,
            ]);

            return response()->json([
                'message' => 'Failed to get unread count',
                'count' => 0,
            ], 500);
        }
    }

    /**
     * Mark specific notifications as read.
     */
    public function markAsRead(array $notificationIds): JsonResponse
    {
        try {
            $count = Notification::whereIn('id', $notificationIds)
                ->update([
                    'read' => true,
                    'read_at' => now(),
                ]);

            return response()->json([
                'success' => true,
                'count' => $count,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to mark notifications as read', [
                'error' => $e->getMessage(),
                'notificationIds' => $notificationIds,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to mark notifications as read',
            ], 500);
        }
    }

    /**
     * Mark all notifications as read for a user.
     */
    public function markAllAsRead(string $userId): JsonResponse
    {
        try {
            $count = Notification::forUser($userId)
                ->unread()
                ->update([
                    'read' => true,
                    'read_at' => now(),
                ]);

            return response()->json([
                'success' => true,
                'count' => $count,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to mark all notifications as read', [
                'error' => $e->getMessage(),
                'userId' => $userId,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to mark all notifications as read',
            ], 500);
        }
    }

    /**
     * Create a new notification.
     */
    public function createNotification(array $data): JsonResponse
    {
        try {
            $notification = Notification::create([
                'id' => (string) Str::uuid(),
                'user_id' => $data['userId'],
                'title' => $data['title'],
                'message' => $data['message'],
                'read' => false,
                'type' => $data['type'] ?? null,
                'link' => $data['link'] ?? null,
                'metadata' => $data['metadata'] ?? null,
            ]);

            // Broadcast notification to WebSocket if available
            $this->broadcastNotification($notification);

            return response()->json($notification, 201);
        } catch (\Exception $e) {
            Log::error('Failed to create notification', [
                'error' => $e->getMessage(),
                'data' => $data,
            ]);

            return response()->json([
                'message' => 'Failed to create notification',
            ], 500);
        }
    }

    /**
     * Delete a notification.
     */
    public function deleteNotification(string $id): JsonResponse
    {
        try {
            $notification = Notification::find($id);

            if (!$notification) {
                return response()->json([
                    'message' => 'Notification not found',
                ], 404);
            }

            $notification->delete();

            return response()->json([
                'success' => true,
                'message' => 'Notification deleted successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete notification', [
                'error' => $e->getMessage(),
                'id' => $id,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete notification',
            ], 500);
        }
    }

    /**
     * Broadcast notification to WebSocket.
     * Implement this method based on your WebSocket solution (Laravel Echo, Pusher, etc.)
     */
    private function broadcastNotification(Notification $notification): void
    {
        try {
            // Broadcast using Laravel Echo Server/Pusher
            event(new \App\Events\NewNotification($notification));

            Log::info('Broadcasting notification', [
                'notification_id' => $notification->id,
                'user_id' => $notification->user_id,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to broadcast notification', [
                'error' => $e->getMessage(),
                'notification_id' => $notification->id,
            ]);
        }
    }
}
