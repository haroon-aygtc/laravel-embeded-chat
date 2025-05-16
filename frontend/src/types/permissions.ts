/**
 * Permission types that match the backend permissions
 */

export type Permission =
    // User management
    | 'manage_users'
    | 'view_users'

    // Context Rules
    | 'view_context_rule'
    | 'create_context_rule'
    | 'edit_context_rule'
    | 'delete_context_rule'

    // Knowledge Base
    | 'view_knowledge_base'
    | 'create_knowledge_base'
    | 'edit_knowledge_base'
    | 'delete_knowledge_base'

    // Prompt Templates
    | 'view_prompt_template'
    | 'create_prompt_template'
    | 'edit_prompt_template'
    | 'delete_prompt_template'

    // Chat
    | 'manage_chat'
    | 'manage_own_chat'

    // Analytics & Logs
    | 'view_analytics'
    | 'view_logs'

    // User resources
    | 'view_own_resources'
    | 'edit_own_resources';

export type Role = 'super_admin' | 'admin' | 'editor' | 'viewer' | 'user';

export const rolePermissions: Record<Role, Permission[]> = {
    super_admin: [
        'manage_users',
        'view_users',
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
        'view_analytics',
        'view_logs'
    ],
    admin: [
        'manage_users',
        'view_users',
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
        'view_analytics',
        'view_logs'
    ],
    editor: [
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
    viewer: [
        'view_analytics',
        'view_logs',
        'view_context_rule',
        'view_knowledge_base',
        'view_prompt_template',
    ],
    user: [
        'view_own_resources',
        'edit_own_resources',
        'manage_own_chat',
    ]
}; 