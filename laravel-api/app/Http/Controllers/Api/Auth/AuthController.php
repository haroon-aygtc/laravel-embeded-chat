<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Services\Auth\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(private readonly AuthService $authService) {}

    public function login(LoginRequest $request): JsonResponse
    {
        return $this->authService->login($request->validated());
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        return $this->authService->register($request->validated());
    }

    public function logout(Request $request): JsonResponse
    {
        return $this->authService->logout($request->user());
    }

    public function profile(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }
}
