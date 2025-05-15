import React, { ReactNode } from 'react';
import { usePermissions } from '@/context/PermissionContext';

interface PermissionGateProps {
    children: ReactNode;
    permissions?: string | string[];
    roles?: string | string[];
    fallback?: ReactNode;
}

/**
 * A component that conditionally renders children based on user permissions
 */
export function PermissionGate({
    children,
    permissions,
    roles,
    fallback = null
}: PermissionGateProps) {
    const { hasPermission, hasRole, isAdmin } = usePermissions();

    // Admins always have access to everything
    if (isAdmin) {
        return <>{children}</>;
    }

    // Check for role-based access
    if (roles) {
        const roleArray = Array.isArray(roles) ? roles : [roles];
        if (!hasRole(roleArray)) {
            return <>{fallback}</>;
        }
    }

    // Check for permission-based access
    if (permissions) {
        const permissionArray = Array.isArray(permissions) ? permissions : [permissions];

        // User must have ALL permissions specified
        const hasAllPermissions = permissionArray.every(permission =>
            hasPermission(permission)
        );

        if (!hasAllPermissions) {
            return <>{fallback}</>;
        }
    }

    // If we get here, the user has the required permissions/roles
    return <>{children}</>;
} 