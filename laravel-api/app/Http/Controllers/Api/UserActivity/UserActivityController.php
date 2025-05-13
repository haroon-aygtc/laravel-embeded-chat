<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\UserActivity;

use App\Http\Controllers\Controller;
use App\Http\Requests\UserActivity\CreateUserActivityRequest;
use App\Models\User;
use App\Services\UserActivity\UserActivityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserActivityController extends Controller
{
    public function __construct(private readonly UserActivityService $userActivityService) {}

    public function index(Request $request): JsonResponse
    {
        return $this->userActivityService->getAll($request);
    }

    public function getByUser(User $user): JsonResponse
    {
        return $this->userActivityService->getByUser($user);
    }

    public function store(CreateUserActivityRequest $request): JsonResponse
    {
        return $this->userActivityService->create($request->validated());
    }
}
