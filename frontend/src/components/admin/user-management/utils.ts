import { BadgeProps } from "@/components/ui/badge";
import type { User } from "@/types";

/**
 * Maps user roles to badge variants for consistent UI representation
 */
export const getRoleBadgeVariant = (role: string): BadgeProps["variant"] => {
    switch (role) {
        case "admin":
            return "destructive";
        case "editor":
            return "secondary";
        case "viewer":
            return "outline";
        case "user":
        default:
            return "default";
    }
};

/**
 * Handles API validation errors for forms
 * Maps server errors to form fields for better user feedback
 */
export const handleApiValidationErrors = (error: any, form: any) => {
    if (error.status === 422 && error.error?.details) {
        // Form validation errors from the server
        const validationErrors = error.error.details;

        // Set errors on the form fields
        Object.entries(validationErrors).forEach(([field, messages]) => {
            if (field in form.getValues()) {
                form.setError(field as any, {
                    type: 'server',
                    message: Array.isArray(messages) ? messages[0] : messages.toString()
                });
            }
        });

        return "Please correct the validation errors";
    } else if (error.error?.message) {
        return error.error.message;
    } else if (error.message) {
        return error.message;
    }
    return "An unexpected error occurred. Please try again.";
};

/**
 * Formats a user object for display, handling various response formats
 */
export const formatUserObject = (userData: any): User => {
    return {
        id: userData.id?.toString() || '',
        name: userData.name || '',
        email: userData.email || '',
        role: (userData.role || 'user') as User['role'],
        isActive: typeof userData.is_active !== 'undefined' ? userData.is_active :
            typeof userData.isActive !== 'undefined' ? userData.isActive : true,
        avatar: userData.avatar || userData.avatarUrl || null,
        bio: userData.bio || null,
        lastLogin: userData.last_login || userData.lastLoginAt || null,
        createdAt: userData.created_at || userData.createdAt || new Date().toISOString(),
        updatedAt: userData.updated_at || userData.updatedAt || new Date().toISOString()
    };
};

/**
 * Compares two users for equality (useful for memoization)
 */
export const areUsersEqual = (userA: User, userB: User): boolean => {
    return (
        userA.id === userB.id &&
        userA.name === userB.name &&
        userA.email === userB.email &&
        userA.role === userB.role &&
        userA.isActive === userB.isActive
    );
};

/**
 * Maps API userProfile to frontend User format
 */
export const mapUserProfileToUser = (userProfile: any): User => {
    return {
        id: userProfile.id,
        name: userProfile.name || '',
        email: userProfile.email || '',
        role: userProfile.role === 'guest'
            ? 'viewer' // Map guest role from backend to viewer in frontend
            : userProfile.role as User['role'],
        isActive: userProfile.isActive,
        avatar: userProfile.avatarUrl || null,
        bio: userProfile.bio || null,
        lastLogin: userProfile.lastLoginAt || null,
        createdAt: userProfile.createdAt,
        updatedAt: userProfile.updatedAt
    };
};

/**
 * Maps frontend User role to API userProfile role
 */
export const mapRoleToApiRole = (role: User['role']): "admin" | "user" | "guest" => {
    switch (role) {
        case 'admin':
            return "admin";
        case 'editor':
        case 'viewer':
        case 'user':
            return "user"; // Map editor and viewer roles to 'user' in the backend
        default:
            return "user";
    }
}; 