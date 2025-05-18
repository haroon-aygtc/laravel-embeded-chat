import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { roleApi, UserPermissions } from '@/services/api/features/roleManagement';
import { useAuth } from '@/context/AuthContext';
import logger from '@/utils/logger';

interface PermissionContextType {
    role: string;
    isAdmin: boolean;
    permissions: Record<string, boolean>;
    hasPermission: (permission: string) => boolean;
    hasRole: (role: string | string[]) => boolean;
    loading: boolean;
    refreshPermissions: () => Promise<void>;
}

const defaultPermissions: Record<string, boolean> = {
    view_context_rule: false,
    create_context_rule: false,
    edit_context_rule: false,
    delete_context_rule: false,
    view_knowledge_base: false,
    create_knowledge_base: false,
    edit_knowledge_base: false,
    delete_knowledge_base: false,
    view_prompt_template: false,
    create_prompt_template: false,
    edit_prompt_template: false,
    delete_prompt_template: false,
    manage_chat: false,
    manage_users: false,
    view_analytics: false,
    view_logs: false,
    view_own_resources: false,
    edit_own_resources: false,
    manage_own_chat: false,
};

const defaultPermissionContext: PermissionContextType = {
    role: 'user',
    isAdmin: false,
    permissions: defaultPermissions,
    hasPermission: () => false,
    hasRole: () => false,
    loading: true,
    refreshPermissions: async () => { },
};

const PermissionContext = createContext<PermissionContextType>(defaultPermissionContext);

export const usePermissions = () => useContext(PermissionContext);

interface PermissionProviderProps {
    children: ReactNode;
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
    const [loading, setLoading] = useState(true);

    const loadPermissions = async () => {
        if (!isAuthenticated) {
            setUserPermissions(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // Make sure we have a user object before proceeding
            if (!user) {
                logger.warn('User is authenticated but user object is missing');
                setLoading(false);
                return;
            }

            try {
                const response = await roleApi.getUserPermissions();

                if (response.success && response.data) {
                    setUserPermissions(response.data);
                } else {
                    logger.warn('Failed to load user permissions from API, using defaults');
                    // Set default permissions based on user role
                    setUserPermissions({
                        role: user.role,
                        isAdmin: user.role === 'admin' || user.role === 'super_admin',
                        permissions: defaultPermissions
                    });
                }
            } catch (apiError) {
                logger.error('API error loading permissions', apiError);
                // Fallback to default permissions based on user role
                setUserPermissions({
                    role: user.role,
                    isAdmin: user.role === 'admin' || user.role === 'super_admin',
                    permissions: defaultPermissions
                });
            }
        } catch (error) {
            logger.error('Error in permission loading process', error);
            // Set minimal permissions as a last resort
            if (user) {
                setUserPermissions({
                    role: user.role,
                    isAdmin: user.role === 'admin' || user.role === 'super_admin',
                    permissions: defaultPermissions
                });
            }
        } finally {
            setLoading(false);
        }
    };

    // Load permissions when auth status changes
    useEffect(() => {
        loadPermissions();
    }, [isAuthenticated, user?.role]);

    const hasPermission = (permission: string): boolean => {
        if (!isAuthenticated || !userPermissions) return false;

        // Admin has all permissions
        if (userPermissions.isAdmin) return true;

        // Safely check if permissions exist and if the specific permission is granted
        return userPermissions.permissions &&
            typeof userPermissions.permissions === 'object' &&
            permission in userPermissions.permissions ?
            !!userPermissions.permissions[permission] : false;
    };

    const hasRole = (role: string | string[]): boolean => {
        if (!isAuthenticated || !userPermissions) return false;

        if (Array.isArray(role)) {
            return role.includes(userPermissions.role);
        }

        return userPermissions.role === role;
    };

    const refreshPermissions = async () => {
        await loadPermissions();
    };

    const value = {
        role: userPermissions?.role || 'user',
        isAdmin: userPermissions?.isAdmin || false,
        permissions: userPermissions?.permissions || defaultPermissions,
        hasPermission,
        hasRole,
        loading,
        refreshPermissions,
    };

    return (
        <PermissionContext.Provider value={value}>
            {children}
        </PermissionContext.Provider>
    );
};