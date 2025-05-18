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
    const { hasPermission, hasRole, isAdmin, loading } = usePermissions();

    // If permissions are still loading, return null or a loading state
    if (loading) {
        return null; // or return a loading spinner if you prefer
    }

    // Admins always have access to everything
    if (isAdmin) {
        return <>{children}</>;
    }

    // Check for role-based access
    if (roles && roles.length > 0) {
        const roleArray = Array.isArray(roles) ? roles : [roles];
        if (roleArray.length > 0 && !hasRole(roleArray)) {
            return <>{fallback}</>;
        }
    }


    // Check for permission-based access
    if (permissions) {
        const permissionArray = Array.isArray(permissions) ? permissions : [permissions];

        // If no permissions are required, grant access
        if (permissionArray.length === 0) {
            return <>{children}</>;
        }


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