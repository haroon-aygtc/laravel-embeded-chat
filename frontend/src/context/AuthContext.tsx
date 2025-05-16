import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { AuthService } from '@/services/authService';
import { authApi, User } from '@/services/api/features/auth';
import { useNavigate } from 'react-router-dom';
import { Permission, Role } from '@/types/permissions';
import { getCsrfToken } from '@/utils/auth';
import { useToast } from '@/components/ui/use-toast';
import console from 'console';

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
    clearError: () => {},
    register: () => Promise.resolve(false),
    login: () => Promise.resolve(false),
    logout: () => {},
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

    const hasPreviousLoginEvidence = () => {
        return !!authService.getUser();
    };

    const checkIsAuthenticated = async () => {
        return await authService.isAuthenticated();
    };

    const initializeAuth = async () => {
        try {
            resetProfileRequestCount();
            if (!hasPreviousLoginEvidence()) return setIsLoading(false);
            await getCsrfToken();
            const isUserAuthenticated = await checkIsAuthenticated();
            if (!isUserAuthenticated) return setIsLoading(false);
            const response = await authApi.getCurrentUser();
            if (response) {
                setUser(convertUser(response));
                lastProfileFetchTime.current = Date.now();
            }
        } catch (error: any) {
            setError(error.message || 'Failed to initialize authentication');
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            setIsProcessing(true);
            const credentials = { email, password };
            const response = await authApi.login(credentials);
            console.log(response);
            if (response.status === 'success') {
                const user = convertUser(response.user);
                setUser(user);
                return true;
            }

            // Handle API error response
            if (response.status === 'error') {
                setErrors(response.errors);
                throw new Error(response.message || 'Login failed');
            }

            throw new Error('Login failed');
        } catch (error: any) {
            const errorMessage = error?.message || 'Login failed';
            setError(errorMessage);
            setErrors(error?.errors || { general: [errorMessage] });
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

    const value = {
        user,
        isAuthenticated: !!user,
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
