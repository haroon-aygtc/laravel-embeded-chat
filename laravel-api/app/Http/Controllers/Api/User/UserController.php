<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Services\User\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\User;

class UserController extends Controller
{
    public function __construct(private readonly UserService $userService) {}

    public function index(Request $request): JsonResponse
    {
        return $this->userService->index($request);
    }

    public function show(User $user): JsonResponse
    {
        return $this->userService->show($user);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        return $this->userService->store($request->validated());
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        return $this->userService->update($user, $request->validated());
    }

    public function destroy(User $user): JsonResponse
    {
        return $this->userService->destroy($user);
    }
}
