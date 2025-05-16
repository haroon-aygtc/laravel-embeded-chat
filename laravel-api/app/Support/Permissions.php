<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Centralized permission definitions for the application
 */
class Permissions
{
    /**
     * All available permissions in the system
     */
    public const ALL_PERMISSIONS = [
        // User management
        'manage_users',
        'view_users',

        // Context Rules
        'view_context_rule',
        'create_context_rule',
        'edit_context_rule',
        'delete_context_rule',

        // Knowledge Base
        'view_knowledge_base',
        'create_knowledge_base',
        'edit_knowledge_base',
        'delete_knowledge_base',

        // Prompt Templates
        'view_prompt_template',
        'create_prompt_template',
        'edit_prompt_template',
        'delete_prompt_template',

        // Chat
        'manage_chat',
        'manage_own_chat',

        // Analytics & Logs
        'view_analytics',
        'view_logs',

        // User resources
        'view_own_resources',
        'edit_own_resources',
    ];

    /**
     * Permissions for the editor role
     */
    public const EDITOR_PERMISSIONS = [
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
    ];

    /**
     * Permissions for the viewer role
     */
    public const VIEWER_PERMISSIONS = [
        'view_analytics',
        'view_logs',
        'view_context_rule',
        'view_knowledge_base',
        'view_prompt_template',
    ];

    /**
     * Permissions for the user role
     */
    public const USER_PERMISSIONS = [
        'view_own_resources',
        'edit_own_resources',
        'manage_own_chat',
    ];
}
