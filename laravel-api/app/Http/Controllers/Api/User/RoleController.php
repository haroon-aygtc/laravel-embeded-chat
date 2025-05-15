<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\User;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    /**
     * Get all available roles
     */
    public function index(): JsonResponse
    {
        if (!Gate::allows('manage-users')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized to view roles'
            ], 403);
        }

        // Define the available roles with their permissions
        $roles = [
            [
                'id' => 'admin',
                'name' => 'Administrator',
                'description' => 'Full access to all features and settings',
                'permissions' => ['*'],
            ],
            [
                'id' => 'editor',
                'name' => 'Editor',
                'description' => 'Can create and edit content, but cannot manage users',
                'permissions' => [
                    'create_context_rule',
                    'edit_context_rule',
                    'delete_context_rule',
                    'create_knowledge_base',
                    'edit_knowledge_base',
                    'delete_knowledge_base',
                    'create_prompt_template',
                    'edit_prompt_template',
                    'delete_prompt_template',
                    'manage_chat',
                    'view_analytics',
                    'view_logs',
                ],
            ],
            [
                'id' => 'viewer',
                'name' => 'Viewer',
                'description' => 'Read-only access to analytics and content',
                'permissions' => [
                    'view_analytics',
                    'view_logs',
                    'view_context_rule',
                    'view_knowledge_base',
                    'view_prompt_template',
                ],
            ],
            [
                'id' => 'user',
                'name' => 'User',
                'description' => 'Standard user with limited permissions',
                'permissions' => [
                    'view_own_resources',
                    'edit_own_resources',
                    'manage_own_chat',
                ],
            ],
        ];

        return response()->json([
            'status' => 'success',
            'data' => $roles
        ]);
    }

    /**
     * Update a user's role
     */
    public function update(Request $request, string $userId): JsonResponse
    {
        if (!Gate::allows('manage-users')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized to change user roles'
            ], 403);
        }

        $validated = $request->validate([
            'role' => ['required', 'string', Rule::in(['admin', 'editor', 'viewer', 'user'])],
        ]);

        $user = User::findOrFail($userId);

        // Protect against changing one's own role if admin
        if ($user->id === Auth::id() && $user->role === 'admin' && $validated['role'] !== 'admin') {
            return response()->json([
                'status' => 'error',
                'message' => 'You cannot downgrade your own admin role'
            ], 403);
        }

        $user->role = $validated['role'];
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => "User role updated to {$validated['role']}",
            'data' => $user
        ]);
    }

    /**
     * Check if a user has a specific role
     */
    public function check(Request $request, string $role): JsonResponse
    {
        $user = $request->user();
        $hasRole = $user->hasRole($role);

        return response()->json([
            'status' => 'success',
            'data' => [
                'hasRole' => $hasRole
            ]
        ]);
    }

    /**
     * Get user permissions
     */
    public function permissions(Request $request): JsonResponse
    {
        $user = $request->user();

        // Define the available permissions
        $allPermissions = [
            'view_context_rule',
            'create_context_rule',
            'edit_context_rule',
            'delete_context_rule',
            'view_knowledge_base',
            'create_knowledge_base',
            'edit_knowledge_base',
            'delete_knowledge_base',
            'view_prompt_template',
            'create_prompt_template',
            'edit_prompt_template',
            'delete_prompt_template',
            'manage_chat',
            'manage_users',
            'view_analytics',
            'view_logs',
            'view_own_resources',
            'edit_own_resources',
            'manage_own_chat',
        ];

        // Check each permission
        $userPermissions = [];
        foreach ($allPermissions as $permission) {
            $userPermissions[$permission] = $user->hasPermission($permission);
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'role' => $user->role,
                'isAdmin' => $user->isAdmin,
                'permissions' => $userPermissions
            ]
        ]);
    }
}
