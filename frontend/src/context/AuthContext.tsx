import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { AuthService } from '@/services/authService';
import { authApi, User } from '@/services/api/features/auth';
import { useNavigate } from 'react-router-dom';
import { Permission, Role } from '@/types/permissions';
import { getCsrfToken } from '@/utils/auth';
import { useToast } from '@/components/ui/use-toast';


const authService = AuthService.getInstance();

const MAX_PROFILE_REQUESTS = 5;

const convertUser = (apiUser: any): User => {
    return {
        id: apiUser.id,
        name: apiUser.name || '',
        email: apiUser.email,
        role: apiUser.role,
        avatar: apiUser.avatar,
        permissions: apiUser.permissions,
        last_login: apiUser.lastLoginAt,
        created_at: apiUser.createdAt,
        updated_at: apiUser.updatedAt
    };
};

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    errors: Record<string, string[]> | undefined;
    clearError: () => void;
    register: (name: string, email: string, password: string) => Promise<boolean>;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    initializeAuth: () => Promise<void>;
    hasPermission: (permission: Permission | Permission[]) => boolean;
    hasRole: (role: Role | Role[]) => boolean;
}



const hasPreviousLoginEvidence = () => {
    return localStorage.getItem('auth_user') !== null;
};

const checkIsAuthenticated = () => {
    return authService.isAuthenticated();
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    errors: undefined,
    clearError: () => { },
    register: () => Promise.resolve(false),
    login: () => Promise.resolve(false),
    logout: () => { },
    refreshUser: () => Promise.resolve(),
    initializeAuth: () => Promise.resolve(),
    hasPermission: () => false,
    hasRole: () => false
});

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string[]> | undefined>(undefined);
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();

    const profileRequestCount = useRef(0);
    const lastProfileFetchTime = useRef<number | null>(null);
    const cachedProfileResponse = useRef<any | null>(null);

    const resetProfileRequestCount = () => {
        profileRequestCount.current = 0;
    };

    const incrementProfileRequestCount = () => {
        profileRequestCount.current += 1;
    };

    // This function is no longer needed as we check for user directly in initializeAuth

    const checkIsAuthenticated = () => {
        return authService.isAuthenticated();
    };

    const initializeAuth = async () => {
        try {
            setIsLoading(true);
            resetProfileRequestCount();

            console.log('Initializing authentication state...');

            // First check if we have a token
            const token = authService.getToken();

            // Then check for user data
            const storedUser = authService.getUser();

            // Log what we found for debugging
            console.log(`Auth initialization: token=${!!token}, user=${!!storedUser}`);

            // If we have a user in storage, set it in state immediately
            if (storedUser) {
                setUser(storedUser);
                console.log('Set stored user data to state:', storedUser.name);
            }

            // If we have a token, we should try to validate it by getting current user
            if (token) {
                try {
                    // Try to refresh the CSRF token silently first
                    await getCsrfToken();

                    // Then try to get current user data
                    console.log('Attempting to fetch current user data with token');
                    const response = await authApi.getCurrentUser();

                    if (response) {
                        // Successfully got user data, update state and storage
                        const userData = convertUser(response);
                        setUser(userData);
                        console.log('Successfully validated token and fetched fresh user data:', userData.name);

                        // Also update the auth service with required fields
                        authService.setUser({
                            id: userData.id,
                            name: userData.name || '',  // Ensure name is not undefined
                            email: userData.email,
                            role: userData.role,
                            avatar: userData.avatar,
                            permissions: userData.permissions,
                            last_login: userData.last_login,
                            created_at: userData.created_at || new Date().toISOString(),
                            updated_at: userData.updated_at || new Date().toISOString()
                        });

                        lastProfileFetchTime.current = Date.now();
                        console.log('Authentication successful, user is logged in');
                    } else {
                        // No user data returned, but we still have a token
                        // Don't clear auth yet, just log a warning
                        console.warn('No user data returned despite valid token, keeping token');

                        // If we have stored user data, keep using it
                        if (storedUser) {
                            console.log('Using stored user data as fallback');
                        } else {
                            // Only clear user state if we don't have stored user data
                            setUser(null);
                        }
                    }
                } catch (getUserError: any) {
                    console.error('Failed to get user data with existing token:', getUserError);

                    // If we get a 401, the token might be invalid, but we'll try to refresh it first
                    if (getUserError.response && getUserError.response.status === 401) {
                        console.warn('Token might be invalid, attempting to refresh');

                        try {
                            // Try to refresh the token
                            const refreshResponse = await authApi.refreshToken();
                            if (refreshResponse && refreshResponse.token) {
                                authService.setToken(refreshResponse.token);
                                console.log('Successfully refreshed token after 401');

                                // Try to get user data again with the new token
                                try {
                                    const retryResponse = await authApi.getCurrentUser();
                                    if (retryResponse) {
                                        const userData = convertUser(retryResponse);
                                        setUser(userData);
                                        // Ensure we have all required fields for authService
                                        authService.setUser({
                                            id: userData.id,
                                            name: userData.name || '',  // Ensure name is not undefined
                                            email: userData.email,
                                            role: userData.role,
                                            avatar: userData.avatar,
                                            permissions: userData.permissions,
                                            last_login: userData.last_login,
                                            created_at: userData.created_at || new Date().toISOString(),
                                            updated_at: userData.updated_at || new Date().toISOString()
                                        });
                                        console.log('Successfully fetched user data with refreshed token');
                                    }
                                } catch (retryError) {
                                    console.error('Failed to get user data with refreshed token:', retryError);
                                    // Keep using stored user if available
                                    if (storedUser) {
                                        console.log('Using stored user data as fallback after refresh attempt');
                                    }
                                }
                            } else {
                                // Token refresh failed, but we'll still keep the user if we have it
                                console.warn('Token refresh failed after 401');
                                if (storedUser) {
                                    console.log('Using stored user data despite token refresh failure');
                                } else {
                                    // Only clear auth if we don't have stored user data
                                    authService.clearAuth();
                                    setUser(null);
                                }
                            }
                        } catch (refreshError) {
                            console.error('Failed to refresh token after 401:', refreshError);
                            // Keep using stored user if available
                            if (storedUser) {
                                console.log('Using stored user data as fallback after refresh error');
                            } else {
                                // Only clear auth if we don't have stored user data
                                authService.clearAuth();
                                setUser(null);
                            }
                        }
                    } else {
                        // For other errors, we'll keep the user logged in if we already have their data
                        console.warn('Error fetching user data, but not clearing auth yet:', getUserError.message);
                        if (storedUser) {
                            console.log('Using stored user data as fallback after non-401 error');
                        }
                    }
                }
            } else if (storedUser) {
                // We have user data but no token - this is a partial auth state
                // Try to refresh the token
                try {
                    console.log('Have user data but no token, attempting to refresh token');
                    const refreshResponse = await authApi.refreshToken();
                    if (refreshResponse && refreshResponse.token) {
                        authService.setToken(refreshResponse.token);
                        console.log('Successfully refreshed token');
                        // No need to fetch user again, we already have it
                    } else {
                        // Token refresh failed, but we'll still keep the user
                        console.warn('Token refresh failed, but keeping user data');
                    }
                } catch (refreshError) {
                    console.error('Failed to refresh token:', refreshError);
                    // Keep the user data even if token refresh fails
                    console.log('Keeping user data despite token refresh failure');
                }
            } else {
                // No token and no user, definitely not authenticated
                console.log('No authentication data found');
                authService.clearAuth();
                setUser(null);
            }
        } catch (error: any) {
            console.error('Auth initialization error:', error);
            setError(error.message || 'Failed to initialize authentication');

            // Even if initialization fails, check if we have stored user data
            const fallbackUser = authService.getUser();
            if (fallbackUser) {
                console.log('Using stored user data as fallback after initialization error');
                setUser(fallbackUser);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            setIsProcessing(true);
            setError(null);
            setErrors(undefined);

            const credentials = { email, password };
            const response = await authApi.login(credentials);
            console.log('Login response in AuthContext:', response);

            // Check if the response has status success
            if (response && response.status === 'success') {
                // Store user data if not already done in the API layer
                if (response.user) {
                    const userData = convertUser(response.user);
                    setUser(userData);
                    console.log('User data set in context:', userData);
                }

                // Update token in auth service if it's not already done
                if (response.access_token) {
                    authService.setToken?.(response.access_token);
                    console.log('Token set in auth service');
                }

                return true; // Explicitly return true for successful login
            } else {
                // Handle API error response with proper error message
                console.log('Login response indicates failure:', response);
                setError(response?.message || 'Login failed');
                if (response?.errors) {
                    setErrors(response.errors);
                }
                return false;
            }
        } catch (error: any) {
            // Only set error if it's an actual error, not a successful response
            console.error('Login error caught in AuthContext:', error);
            const errorMessage = error?.message || 'Login failed';
            setError(errorMessage);
            setErrors(error?.errors || { general: [errorMessage] });

            // Show error toast
            toast({
                variant: 'destructive',
                title: 'Error',
                description: errorMessage,
            });
            return false;
        } finally {
            setIsProcessing(false);
        }
    };

    const logout = async () => {
        try {
            setIsProcessing(true);
            await authApi.logout();
            authService.clearAuth();
            setUser(null);
            navigate('/login');
        } catch (error: any) {
            setError(error.message || 'Logout failed');
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Logout failed',
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const hasPermission = (permission: Permission | Permission[]): boolean => {
        const currentUser = authService.getUser();
        if (!currentUser) return false;
        if (Array.isArray(permission)) {
            return permission.some(p => currentUser.permissions?.includes(p));
        }
        return currentUser.permissions?.includes(permission) || false;
    };

    const hasRole = (role: Role | Role[]): boolean => {
        const currentUser = authService.getUser();
        if (!currentUser) return false;
        if (Array.isArray(role)) {
            return role.some(r => currentUser.role === r);
        }
        return currentUser.role === role;
    };

    const register = async (name: string, email: string, password: string): Promise<boolean> => {
        try {
            setIsProcessing(true);
            await authService.getCsrfToken();
            const response = await authApi.register({
                name,
                email,
                password
            });

            if (response.status === 'success') {
                setUser(convertUser(response.user));
                navigate('/dashboard');
                return true;
            }

            throw new Error(response.message || 'Registration failed');
        } catch (error: any) {
            setError(error.message || 'Registration failed');
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Registration failed',
            });
            return false;
        } finally {
            setIsProcessing(false);
        }
    };

    const refreshUser = async () => {
        try {
            setIsProcessing(true);
            const response = await authApi.getCurrentUser();
            if (response) {
                setUser(convertUser(response));
            }
        } catch (error: any) {
            setError(error.message || 'Failed to refresh user data');
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to refresh user data',
            });
        } finally {
            setIsProcessing(false);
        }
    };

    // Determine authentication status based on authService's isAuthenticated method
    // and the presence of a user object in state
    const isAuthenticated = authService.isAuthenticated() || !!user;

    const value = {
        user,
        isAuthenticated,
        isLoading,
        error,
        errors,
        clearError: () => setError(null),
        register,
        login,
        logout,
        refreshUser,
        initializeAuth,
        hasPermission,
        hasRole
    };

    useEffect(() => {
        initializeAuth();
        const csrfRefreshInterval = setInterval(() => getCsrfToken(), 1800000);
        return () => {
            if (csrfRefreshInterval) {
                clearInterval(csrfRefreshInterval);
            }
        };
    }, []);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthProvider;
