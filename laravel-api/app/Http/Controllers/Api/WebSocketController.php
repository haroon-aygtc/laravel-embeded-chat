<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Events\WebSocketMessage;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebSocketController extends Controller
{
    /**
     * Send a WebSocket message.
     */
    public function sendMessage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string',
            'user_id' => 'nullable|string',
        ]);

        try {
            // Broadcast the message using Laravel's event system
            event(new WebSocketMessage($validated['message'], $validated['user_id'] ?? null));

            return response()->json([
                'success' => true,
                'message' => 'Message sent successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send WebSocket message: ' . $e->getMessage(), [
                'exception' => $e,
                'message' => $validated['message'],
                'user_id' => $validated['user_id'] ?? null,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to send message',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get authentication data for private channels.
     */
    public function auth(Request $request): JsonResponse
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $channelName = $request->input('channel_name');
        $socketId = $request->input('socket_id');

        // Check if the user is authorized to join this channel
        if (strpos($channelName, 'private-user.' . $request->user()->id) === 0) {
            // Generate auth signature for Pusher protocol
            $signature = hash_hmac(
                'sha256',
                $socketId . ':' . $channelName,
                env('PUSHER_APP_SECRET', 'local')
            );

            return response()->json([
                'auth' => env('PUSHER_APP_KEY', 'local') . ':' . $signature,
            ]);
        }

        return response()->json(['message' => 'Unauthorized'], 403);
    }
}
