<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\User;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
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
        if (!Gate::allows('manage_users')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized to view roles'
            ], 403);
        }

        // Get roles from the database
        $roles = Role::all()->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
                'description' => $role->description,
                'permissions' => $role->permissions(),
            ];
        });

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
        if (!Gate::allows('manage_users')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized to change user roles'
            ], 403);
        }

        $validated = $request->validate([
            'role_id' => ['required', 'exists:roles,id'],
        ]);

        $user = User::findOrFail($userId);
        $role = Role::findOrFail($validated['role_id']);

        // Protect against changing one's own role if admin
        if ($user->id === Auth::id() && $user->isAdmin && $role->slug !== 'admin' && $role->slug !== 'super_admin') {
            return response()->json([
                'status' => 'error',
                'message' => 'You cannot downgrade your own admin role'
            ], 403);
        }

        $user->role_id = $role->id;
        $user->role = $role->slug; // For backward compatibility
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => "User role updated to {$role->name}",
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
     * Check if a user has a specific permission
     */
    public function checkPermission(Request $request, string $permission): JsonResponse
    {
        $user = $request->user();
        $hasPermission = $user->hasPermission($permission);

        return response()->json([
            'status' => 'success',
            'data' => [
                'hasPermission' => $hasPermission
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
            'view_users',
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
                'roleId' => $user->role_id,
                'roleName' => $user->roleModel?->name,
                'isAdmin' => $user->isAdmin,
                'isSuperAdmin' => $user->isSuperAdmin,
                'permissions' => $userPermissions
            ]
        ]);
    }
}
