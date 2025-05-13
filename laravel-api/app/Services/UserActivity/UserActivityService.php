<?php

declare(strict_types=1);

namespace App\Services\UserActivity;

use App\Models\User;
use App\Models\UserActivity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserActivityService
{
    public function getAll(Request $request): JsonResponse
    {
        $query = UserActivity::with('user')
            ->orderBy('timestamp', 'desc');

        $activities = $request->has('per_page')
            ? $query->paginate($request->input('per_page', 15))
            : $query->get();

        return response()->json($activities);
    }

    public function getByUser(User $user): JsonResponse
    {
        $activities = $user->activities()
            ->orderBy('timestamp', 'desc')
            ->get();

        return response()->json($activities);
    }

    public function create(array $data): JsonResponse
    {
        $activity = UserActivity::create($data);
        return response()->json($activity, 201);
    }
}
