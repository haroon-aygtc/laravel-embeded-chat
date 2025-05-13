<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Profile;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\FeedbackRequest;
use App\Http\Requests\Profile\UpdateProfileRequest;
use App\Http\Requests\Profile\UpdateSecurityRequest;
use App\Services\Profile\ProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function __construct(private readonly ProfileService $profileService) {}

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        return $this->profileService->updateProfile($request->user(), $request->validated());
    }

    public function updateSecurity(UpdateSecurityRequest $request): JsonResponse
    {
        return $this->profileService->updateSecurity($request->user(), $request->validated());
    }

    public function getSessions(Request $request): JsonResponse
    {
        return $this->profileService->getSessions($request->user());
    }

    public function revokeSession(Request $request, string $sessionId): JsonResponse
    {
        return $this->profileService->revokeSession($request->user(), $sessionId);
    }

    public function submitFeedback(FeedbackRequest $request): JsonResponse
    {
        return $this->profileService->submitFeedback($request->user(), $request->validated());
    }
}
