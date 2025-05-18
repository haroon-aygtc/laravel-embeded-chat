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
                Log::warning('Unauthorized WebSocket authentication attempt', [
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);

                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthorized user'
                ], 401);
            }

            // Revoke any existing WebSocket tokens for this user
            $user->tokens()->where('name', 'websocket')->delete();

            // Generate a short-lived token (1 hour) that can be used for WebSocket authentication
            $token = $user->createToken(
                'websocket',
                ['websocket:connect'],
                now()->addHour()
            )->plainTextToken;

            Log::info('WebSocket authentication successful', [
                'user_id' => $user->id,
                'token_expiry' => now()->addHour()->toIso8601String(),
            ]);

            return response()->json([
                'status' => 'success',
                'data' => [
                    'token' => $token,
                    'user_id' => $user->id,
                    'expires_at' => now()->addHour()->toIso8601String(),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('WebSocket authentication error: ' . $e->getMessage(), [
                'exception' => $e,
                'user_id' => Auth::id(),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to authenticate WebSocket connection',
                'error_code' => 'websocket_auth_failed'
            ], 500);
        }
    }

    /**
     * Generate a public token for unauthenticated access to public channels
     * This endpoint is rate-limited to prevent abuse
     */
    public function guestAuth(Request $request): JsonResponse
    {
        try {
            // Validate the request with more strict rules
            $validated = $request->validate([
                'session_id' => 'nullable|string|exists:chat_sessions,id',
                'widget_id' => 'nullable|string|exists:widgets,id',
                'client_id' => 'required|string|max:100',
                'origin' => 'nullable|string|max:255'
            ]);

            // Log guest authentication attempt
            Log::info('WebSocket guest authentication attempt', [
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'origin' => $request->header('Origin'),
                'client_id' => $validated['client_id'],
                'session_id' => $validated['session_id'] ?? null,
                'widget_id' => $validated['widget_id'] ?? null,
            ]);

            // Validate that at least one ID is provided
            if (empty($validated['session_id']) && empty($validated['widget_id'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Either session_id or widget_id must be provided',
                    'error_code' => 'missing_channel_identifiers'
                ], 422);
            }

            // Generate a unique guest token with a short expiry (15 minutes)
            $guestToken = hash('sha256', $validated['client_id'] . time() . uniqid('', true));

            // Store the token in cache with a 15-minute expiry
            $expiresAt = now()->addMinutes(15);
            \Cache::put(
                'websocket_guest_token:' . $guestToken,
                [
                    'client_id' => $validated['client_id'],
                    'channels' => [
                        $validated['widget_id'] ? 'widget.' . $validated['widget_id'] : null,
                        $validated['session_id'] ? 'chat.' . $validated['session_id'] : null,
                    ],
                    'ip' => $request->ip(),
                    'created_at' => now()->toIso8601String(),
                ],
                $expiresAt
            );

            // For guest users, return a temporary token and the channels they're allowed to listen to
            return response()->json([
                'status' => 'success',
                'data' => [
                    'token' => $guestToken,
                    'expires_at' => $expiresAt->toIso8601String(),
                    'channels' => array_filter([
                        $validated['widget_id'] ? 'widget.' . $validated['widget_id'] : null,
                        $validated['session_id'] ? 'chat.' . $validated['session_id'] : null,
                        'public'
                    ])
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('WebSocket guest authentication error: ' . $e->getMessage(), [
                'exception' => $e,
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'origin' => $request->header('Origin'),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to authenticate guest WebSocket connection',
                'error_code' => 'guest_auth_failed'
            ], 500);
        }
    }
}
