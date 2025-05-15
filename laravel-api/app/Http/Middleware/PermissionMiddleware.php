<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class PermissionMiddleware
{
    /**
     * The role permission map defines what each role can do
     */
    protected array $rolePermissions = [
        'admin' => ['*'], // Admin can do anything
        'editor' => [
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
        'viewer' => [
            'view_analytics',
            'view_logs',
            'view_context_rule',
            'view_knowledge_base',
            'view_prompt_template',
        ],
        'user' => [
            'view_own_resources',
            'edit_own_resources',
            'manage_own_chat',
        ],
    ];

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        if (!Auth::check()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthenticated.'
            ], 401);
        }

        $user = Auth::user();

        // Admin has all permissions
        if ($user->role === 'admin') {
            return $next($request);
        }

        // Get the user's role permissions
        $userRolePermissions = $this->rolePermissions[$user->role] ?? [];

        // Check if the user has the wildcard permission
        if (in_array('*', $userRolePermissions)) {
            return $next($request);
        }

        // Check if the user has at least one of the required permissions
        foreach ($permissions as $permission) {
            if (in_array($permission, $userRolePermissions)) {
                return $next($request);
            }
        }

        return response()->json([
            'status' => 'error',
            'message' => 'Unauthorized. You do not have the required permission to perform this action.'
        ], 403);
    }
}
