import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { User } from '@/types';
import { getUsers, createUser, updateUser, deleteUser } from '@/services/userService';
import { handleApiValidationErrors } from './utils';

interface UseUserManagementOptions {
    onSuccess?: () => void;
}

/**
 * Hook for managing user operations with built-in state handling and error management
 */
export function useUserManagement(options?: UseUserManagementOptions) {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const allUsers = await getUsers();
            setUsers(allUsers);
            return allUsers;
        } catch (error) {
            console.error("Error fetching users:", error);

            const errorMessage = error instanceof Error
                ? error.message
                : "Failed to fetch users. Please check your connection and try again.";

            toast({
                title: "Error loading users",
                description: errorMessage,
                variant: "destructive",
            });
            return [];
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const createNewUser = useCallback(async (userData: any, form?: any) => {
        setLoading(true);
        try {
            const user = await createUser(userData);

            if (user) {
                toast({
                    title: "User created successfully",
                    description: `${userData.name} has been added to the system.`,
                    variant: "default",
                    className: "bg-green-500 text-white font-medium",
                });

                if (options?.onSuccess) {
                    options.onSuccess();
                }

                await fetchUsers();
                return user;
            } else {
                throw new Error("Failed to create user");
            }
        } catch (error) {
            console.error("Error creating user:", error);

            // Use the helper function to handle validation errors if form is provided
            const errorMessage = form
                ? handleApiValidationErrors(error, form)
                : error instanceof Error
                    ? error.message
                    : "An unexpected error occurred";

            toast({
                title: "Error creating user",
                description: errorMessage,
                variant: "destructive",
            });

            return null;
        } finally {
            setLoading(false);
        }
    }, [fetchUsers, toast, options]);

    const updateExistingUser = useCallback(async (id: string, userData: Partial<User>, form?: any) => {
        setLoading(true);
        try {
            const user = await updateUser(id, userData);

            if (user) {
                toast({
                    title: "User updated successfully",
                    description: `${userData.name || 'User'}'s information has been updated.`,
                    variant: "default",
                    className: "bg-green-500 text-white font-medium",
                });

                if (options?.onSuccess) {
                    options.onSuccess();
                }

                await fetchUsers();
                return user;
            } else {
                throw new Error("Failed to update user");
            }
        } catch (error) {
            console.error(`Error updating user ${id}:`, error);

            // Use the helper function to handle validation errors if form is provided
            const errorMessage = form
                ? handleApiValidationErrors(error, form)
                : error instanceof Error
                    ? error.message
                    : "An unexpected error occurred";

            toast({
                title: "Error updating user",
                description: errorMessage,
                variant: "destructive",
            });

            return null;
        } finally {
            setLoading(false);
        }
    }, [fetchUsers, toast, options]);

    const deleteExistingUser = useCallback(async (id: string, userName: string) => {
        setLoading(true);
        try {
            const success = await deleteUser(id);

            if (success) {
                toast({
                    title: "User deleted",
                    description: `${userName} has been removed from the system.`,
                    variant: "default",
                    className: "bg-slate-800 text-white font-medium",
                });

                if (options?.onSuccess) {
                    options.onSuccess();
                }

                await fetchUsers();
                return true;
            } else {
                throw new Error("Failed to delete user");
            }
        } catch (error) {
            console.error(`Error deleting user ${id}:`, error);

            const errorMessage = error instanceof Error
                ? error.message
                : "An unexpected error occurred";

            toast({
                title: "Error deleting user",
                description: errorMessage,
                variant: "destructive",
            });

            return false;
        } finally {
            setLoading(false);
        }
    }, [fetchUsers, toast, options]);

    return {
        users,
        selectedUser,
        setSelectedUser,
        loading,
        fetchUsers,
        createUser: createNewUser,
        updateUser: updateExistingUser,
        deleteUser: deleteExistingUser,
    };
} 