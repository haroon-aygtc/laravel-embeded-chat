<?php

declare(strict_types=1);

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    /**
     * Handle user login.
     */
    public function login(array $credentials): JsonResponse
    {
        if (!Auth::attempt($credentials)) {
            return response()->json([
                'message' => 'The provided credentials are incorrect.'
            ], 401);
        }

        /** @var User $user */
        $user = Auth::user();
        $user->last_login = now();
        $user->save();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ]);
    }

    /**
     * Handle user registration.
     */
    public function register(array $data): JsonResponse
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => 'user', // Default role
            'is_active' => true,
            'last_login' => now(),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ], 201);
    }

    /**
     * Handle user logout.
     */
    public function logout(?User $user): JsonResponse
    {
        if ($user) {
            // Revoke all tokens
            $user->tokens()->delete();
        }

        return response()->json([
            'message' => 'Successfully logged out',
        ]);
    }
}
