<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Events\NewNotification;
use App\Events\WebSocketMessage;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebSocketDemoController extends Controller
{
    /**
     * Send a test notification via WebSocket
     */
    public function sendNotification(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string',
            'channel' => 'nullable|string',
        ]);

        try {
            $message = $validated['message'];
            $userId = null;

            // If channel starts with "private-user.", extract the user ID
            if (isset($validated['channel']) && str_starts_with($validated['channel'], 'private-user.')) {
                $userId = substr($validated['channel'], strlen('private-user.'));
            }

            // Broadcast using Laravel's event system
            event(new WebSocketMessage($message, $userId));

            return response()->json([
                'success' => true,
                'message' => 'Notification sent successfully',
                'data' => [
                    'sent_to' => $validated['channel'] ?? 'public',
                    'content' => $message,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send WebSocket notification: ' . $e->getMessage(), [
                'exception' => $e,
                'message' => $validated['message'],
                'channel' => $validated['channel'] ?? 'public',
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to send notification',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get connection status of WebSocket server
     */
    public function status(): JsonResponse
    {
        try {
            // Check if Reverb is configured properly
            $reverbEnabled = config('broadcasting.default') === 'reverb';
            $reverbKey = config('reverb.apps.apps.0.key');

            if ($reverbEnabled && $reverbKey) {
                return response()->json([
                    'success' => true,
                    'message' => 'WebSocket server (Reverb) is configured',
                    'status' => 'online',
                    'driver' => 'reverb',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'WebSocket server (Reverb) is not properly configured',
                'status' => 'error',
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error checking WebSocket server status',
                'status' => 'error',
                'error' => $e->getMessage(),
            ], 503);
        }
    }
}
