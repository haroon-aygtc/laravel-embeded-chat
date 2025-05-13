<?php

declare(strict_types=1);

namespace App\Services\Profile;

use App\Models\Feedback;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\PersonalAccessToken;

class ProfileService
{
    public function updateProfile(User $user, array $data): JsonResponse
    {
        $user->update($data);
        return response()->json($user);
    }

    public function updateSecurity(User $user, array $data): JsonResponse
    {
        // In a real app, you would store these in a separate table
        // This is a simplified version for the demo
        $securitySettings = [
            'security_settings' => json_encode($data)
        ];

        $user->update($securitySettings);
        return response()->json($data);
    }

    public function getSessions(User $user): JsonResponse
    {
        $sessions = $user->tokens()->with('tokenable')->get()->map(function ($token) {
            return [
                'id' => $token->id,
                'device' => $token->name,
                'ip_address' => $token->last_used_ip ?? 'Unknown',
                'last_active' => $token->last_used_at ? $token->last_used_at->diffForHumans() : 'Never',
                'created_at' => $token->created_at->toDateTimeString(),
            ];
        });

        return response()->json($sessions);
    }

    public function revokeSession(User $user, string $tokenId): JsonResponse
    {
        $token = PersonalAccessToken::findOrFail($tokenId);

        // Check if the token belongs to the user
        if ($token->tokenable_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $token->delete();
        return response()->json(['message' => 'Session revoked successfully']);
    }

    public function submitFeedback(User $user, array $data): JsonResponse
    {
        $feedback = Feedback::create([
            'user_id' => $user->id,
            'message' => $data['message'],
        ]);

        return response()->json([
            'message' => 'Feedback submitted successfully',
            'feedback' => $feedback,
        ], 201);
    }
}
