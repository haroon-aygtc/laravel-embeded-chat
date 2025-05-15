<?php

declare(strict_types=1);

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cookie;

class AuthService
{
    /**
     * Handle user login.
     */
    public function login(array $credentials): JsonResponse
    {
        try {
            if (!Auth::attempt($credentials)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'The provided credentials are incorrect.',
                    'errors' => [
                        'email' => ['These credentials do not match our records.']
                    ]
                ], 401);
            }

            /** @var User $user */
            $user = Auth::user();
            $user->last_login = now();
            $user->save();

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'status' => 'success',
                'message' => 'Login successful',
                'access_token' => $token,
                'token_type' => 'Bearer',
                'user' => $user,
            ])->cookie('laravel_session', Cookie::get('laravel_session'), 60 * 24 * 7, null, null, true, true);
        } catch (\Exception $e) {
            Log::error('Login error: ' . $e->getMessage(), ['exception' => $e]);

            return response()->json([
                'status' => 'error',
                'message' => 'An error occurred during login.',
                'errors' => [
                    'system' => [$e->getMessage()]
                ]
            ], 500);
        }
    }

    /**
     * Handle user registration.
     */
    public function register(array $data): JsonResponse
    {
        try {
            // Check if email already exists
            if (User::where('email', $data['email'])->exists()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Registration failed.',
                    'errors' => [
                        'email' => ['This email address is already registered.']
                    ]
                ], 422);
            }

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
                'status' => 'success',
                'message' => 'Registration successful',
                'access_token' => $token,
                'token_type' => 'Bearer',
                'user' => $user,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Registration error: ' . $e->getMessage(), ['exception' => $e]);

            return response()->json([
                'status' => 'error',
                'message' => 'An error occurred during registration.',
                'errors' => [
                    'system' => [$e->getMessage()]
                ]
            ], 500);
        }
    }

    /**
     * Handle user logout.
     */
    public function logout(?User $user): JsonResponse
    {
        try {
            if ($user) {
                // Revoke all tokens
                $user->tokens()->delete();
            }

            // Clear session and cookie
            Auth::guard('web')->logout();

            // Create a response
            $response = response()->json([
                'status' => 'success',
                'message' => 'Successfully logged out',
            ]);

            // Clear the session cookie
            $response->cookie('laravel_session', '', -1);
            $response->cookie('XSRF-TOKEN', '', -1);

            return $response;
        } catch (\Exception $e) {
            Log::error('Logout error: ' . $e->getMessage(), ['exception' => $e]);

            return response()->json([
                'status' => 'error',
                'message' => 'An error occurred during logout.',
                'errors' => [
                    'system' => [$e->getMessage()]
                ]
            ], 500);
        }
    }
}
