<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\WebSocket;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class WebSocketController extends Controller
{
    /**
     * Get authentication information for WebSocket connections
     */
    public function auth(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthorized user'
                ], 401);
            }
            
            // Generate a temporary token that can be used for WebSocket authentication
            $token = $user->createToken('websocket', ['websocket:connect'])->plainTextToken;
            
            return response()->json([
                'status' => 'success',
                'data' => [
                    'token' => $token,
                    'user_id' => $user->id,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('WebSocket authentication error: ' . $e->getMessage(), [
                'exception' => $e,
                'user_id' => Auth::id(),
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to authenticate WebSocket connection'
            ], 500);
        }
    }
    
    /**
     * Generate a public token for unauthenticated access to public channels
     */
    public function guestAuth(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'session_id' => 'nullable|string|exists:chat_sessions,id',
                'widget_id' => 'nullable|string|exists:widgets,id'
            ]);
            
            // For guest users, we'll just return a channel name they're allowed to listen to
            return response()->json([
                'status' => 'success',
                'data' => [
                    'channels' => [
                        'widget.' . ($validated['widget_id'] ?? 'all'),
                        'chat.' . ($validated['session_id'] ?? 'public')
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('WebSocket guest authentication error: ' . $e->getMessage(), [
                'exception' => $e,
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to authenticate guest WebSocket connection'
            ], 500);
        }
    }
} 