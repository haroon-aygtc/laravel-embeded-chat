import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
    getAuthToken,
    removeAuthToken,
    getAuthUser,
    setAuthUser,
    isAuthenticated as checkIsAuthenticated
} from '@/utils/auth';
import { authApi, User as AuthApiUser } from '@/services/api/features/auth';
import logger from '@/utils/logger';

export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
}

// Convert auth API user to context user
const convertUser = (apiUser: AuthApiUser): User => ({
    id: apiUser.id,
    name: apiUser.name || '',
    email: apiUser.email,
    role: apiUser.role || 'user',
    avatar: apiUser.metadata?.avatar
});

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    clearError: () => void;
    register: (name: string, email: string, password: string) => Promise<boolean>;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    clearError: () => { },
    register: async () => false,
    login: async () => false,
    logout: () => { },
    refreshUser: async () => { },
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // Prevent duplicate API calls
    const [isProcessing, setIsProcessing] = useState(false);

    // Function to clear error state
    const clearError = () => {
        setError(null);
    };

    // Check for stored authentication on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                if (checkIsAuthenticated()) {
                    const storedUser = getAuthUser();
                    if (storedUser) {
                        setUser(convertUser(storedUser));
                    } else {
                        // If we have a token but no user, fetch the user data
                        await refreshUser();
                    }
                }
            } catch (error) {
                logger.error('Authentication check failed:', error);
                // If there's an error, clear auth data to be safe
                removeAuthToken();
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    const refreshUser = async (): Promise<void> => {
        try {
            const userData = await authApi.getCurrentUser();
            if (userData) {
                const contextUser = convertUser(userData);
                setUser(contextUser);
                setAuthUser(userData);
            } else {
                throw new Error('Failed to get user data');
            }
        } catch (error) {
            logger.error('Failed to refresh user data:', error);
            // If we can't refresh the user data, force logout
            logout();
            throw error;
        }
    };

    const login = async (email: string, password: string): Promise<boolean> => {
        // Prevent multiple simultaneous login attempts
        if (isProcessing) {
            logger.warn('Login operation already in progress');
            return false;
        }

        setIsLoading(true);
        setIsProcessing(true);
        clearError();

        try {
            const response = await authApi.login({ email, password });
            if (response && response.user) {
                // Auth token and user are handled in the authApi service
                const contextUser = convertUser(response.user);
                setUser(contextUser);
                return true;
            }

            return false;
        } catch (error: any) {
            const errorMessage = error?.message || 'Login failed. Please try again.';
            setError(errorMessage);
            logger.error('Login error:', error);
            return false;
        } finally {
            setIsLoading(false);
            setIsProcessing(false);
        }
    };

    const register = async (name: string, email: string, password: string): Promise<boolean> => {
        // Prevent multiple simultaneous registration attempts
        if (isProcessing) {
            logger.warn('Registration operation already in progress');
            return false;
        }

        setIsLoading(true);
        setIsProcessing(true);
        clearError();

        try {
            logger.info('Starting user registration process');

            // Call the registration API once
            const response = await authApi.register({
                name,
                email,
                password
            });

            // Check if we have a valid response with user and token
            if (response && response.user && response.token) {
                // Set the user state with the converted user from the response
                const contextUser = convertUser(response.user);
                setUser(contextUser);
                logger.info('Registration successful, user set in context');
                return true;
            } else {
                logger.warn('Registration returned an unexpected response format', response);
                return false;
            }
        } catch (error: any) {
            // Extract the error message
            let errorMessage = 'Registration failed. Please try again.';

            if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error?.message) {
                errorMessage = error.message;
            }

            setError(errorMessage);
            logger.error('Registration error:', error);
            return false;
        } finally {
            setIsLoading(false);
            setIsProcessing(false);
        }
    };

    const logout = () => {
        // Remove token and user data from storage
        removeAuthToken();

        // Clear user state
        setUser(null);

        // Call logout API
        authApi.logout().catch(error => {
            logger.error('Logout error:', error);
        });
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                error,
                clearError,
                register,
                login,
                logout,
                refreshUser
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;