import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
    getAuthUser,
    setAuthUser,
    isAuthenticated as checkIsAuthenticated,
    getCsrfToken
} from '@/utils/auth';
import { authApi, User as AuthApiUser, ApiErrorResponse } from '@/services/api/features/auth';
import logger from '@/utils/logger';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api/middleware/apiMiddleware';

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
    errors?: Record<string, string[]>;
    clearError: () => void;
    register: (name: string, email: string, password: string) => Promise<boolean>;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    initializeAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    errors: undefined,
    clearError: () => { },
    register: async () => false,
    login: async () => false,
    logout: () => { },
    refreshUser: async () => { },
    initializeAuth: async () => { },
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string[]> | undefined>(undefined);
    // Prevent duplicate API calls
    const [isProcessing, setIsProcessing] = useState(false);
    const navigate = useNavigate();

    // Function to clear error state
    const clearError = () => {
        setError(null);
        setErrors(undefined);
    };

    // Initialize app - fetch user data and ensure CSRF token
    const initializeAuth = async () => {
        setIsLoading(true);
        try {
            // Always fetch CSRF token first - critical for maintaining session
            try {
                await getCsrfToken();
                logger.info('CSRF token refreshed during initialization');
            } catch (csrfError) {
                logger.error('Failed to refresh CSRF token, but continuing auth flow:', csrfError);
                // Continue with auth flow even if CSRF fetch fails
            }

            try {
                // Try to get the current user using cookie authentication
                const response = await authApi.getCurrentUser();

                if (response) {
                    setUser(convertUser(response));
                    // Only store user data in memory, not the token
                    logger.info('User authenticated during initialization');
                } else {
                    // If the user is not authenticated, clear any stored data
                    setUser(null);
                    logger.warn('Empty response from getCurrentUser, clearing auth state');
                }
            } catch (userError) {
                // Handle authentication errors specifically
                if (userError?.status === 401) {
                    setUser(null);
                    logger.info('User not authenticated (401 response)');
                } else {
                    logger.error('Error fetching user data:', userError);
                    // Don't clear token on network errors to prevent logout on temporary issues
                }
            }
        } catch (err) {
            console.error('Auth initialization error:', err);
            setError('Failed to initialize authentication');
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        initializeAuth();

        // Set up an interval to refresh the CSRF token periodically
        const csrfRefreshInterval = setInterval(async () => {
            try {
                await getCsrfToken();
                logger.debug('CSRF token refreshed periodically');
            } catch (error) {
                logger.error('Failed to refresh CSRF token in interval:', error);
            }
        }, 30 * 60 * 1000); // Refresh every 30 minutes

        return () => {
            clearInterval(csrfRefreshInterval);
        };
    }, []);

    // Debug user authentication status
    useEffect(() => {
        if (user) {
            logger.info('User is authenticated:', { id: user.id, role: user.role });
        } else if (!isLoading) {
            logger.info('User is not authenticated');
        }
    }, [user, isLoading]);

    const refreshUser = async (): Promise<void> => {
        try {
            // Refresh CSRF token first
            await getCsrfToken();

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
            // First ensure we have a CSRF token
            await getCsrfToken();

            const response = await authApi.login({ email, password });
            if (response && response.status === 'success' && response.user) {
                // Auth token is handled by the cookies now, we only need the user object
                const contextUser = convertUser(response.user);
                setUser(contextUser);
                return true;
            }

            return false;
        } catch (error: any) {
            if (error.status === 'error') {
                const apiError = error as ApiErrorResponse;
                setError(apiError.message);
                setErrors(apiError.errors);
                logger.error('Login error:', apiError);
            } else {
                const errorMessage = error?.message || 'Login failed. Please try again.';
                setError(errorMessage);
                logger.error('Login error:', error);
            }
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
            // First ensure we have a CSRF token
            await getCsrfToken();

            logger.info('Starting user registration process');

            // Call the registration API once
            const response = await authApi.register({
                name,
                email,
                password
            });

            // Check if we have a valid response with user and token
            if (response && response.status === 'success' && response.user) {
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
            if (error.status === 'error') {
                const apiError = error as ApiErrorResponse;
                setError(apiError.message);
                setErrors(apiError.errors);
                logger.error('Registration error:', apiError);
            } else {
                // Extract the error message
                let errorMessage = 'Registration failed. Please try again.';

                if (error?.response?.data?.message) {
                    errorMessage = error.response.data.message;
                } else if (error?.message) {
                    errorMessage = error.message;
                }

                setError(errorMessage);
                logger.error('Registration error:', error);
            }
            return false;
        } finally {
            setIsLoading(false);
            setIsProcessing(false);
        }
    };

    const logout = () => {
        // Clear user state first
        setUser(null);

        // Call logout API with CSRF protection
        getCsrfToken()
            .then(() => authApi.logout())
            .catch(error => {
                logger.error('Logout error:', error);
            });
    };

    const value = {
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        errors,
        clearError,
        register,
        login,
        logout,
        refreshUser,
        initializeAuth,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;