export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    avatar?: string;
    metadata?: {
        avatar?: string;
        [key: string]: any;
    };
}

export type Role = 'super_admin' | 'admin' | 'user';

export type Permission = 
    | 'view_dashboard'
    | 'manage_users'
    | 'manage_roles'
    | 'manage_permissions'
    | 'view_reports'
    | 'manage_settings';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    super_admin: [
        'view_dashboard',
        'manage_users',
        'manage_roles',
        'manage_permissions',
        'view_reports',
        'manage_settings'
    ],
    admin: [
        'view_dashboard',
        'manage_users',
        'view_reports',
        'manage_settings'
    ],
    user: [
        'view_dashboard'
    ]
};

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    errors: Record<string, string[]> | null;
}

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    errors: Record<string, string[]> | null;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    hasPermission: (permission: Permission) => boolean;
    hasRole: (role: Role) => boolean;
}
