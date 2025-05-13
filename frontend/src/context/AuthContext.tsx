import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '@/services/api';
import { User } from '@/types';

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Try to get token from storage on initial load
        const storedToken = sessionStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            fetchUserProfile(storedToken);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUserProfile = async (authToken: string) => {
        try {
            const userData = await authApi.getProfile(authToken);
            setUser(userData);
        } catch (err) {
            console.error('Failed to fetch user profile:', err);
            // If fetching profile fails, clear token
            sessionStorage.removeItem('token');
            setToken(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await authApi.login(email, password);

            const { access_token, user } = response;

            sessionStorage.setItem('token', access_token);
            setToken(access_token);
            setUser(user);

        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Failed to login. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (name: string, email: string, password: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await authApi.register(name, email, password);

            const { access_token, user } = response;

            sessionStorage.setItem('token', access_token);
            setToken(access_token);
            setUser(user);

        } catch (err: any) {
            console.error('Registration error:', err);
            setError(err.message || 'Failed to register. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);

        try {
            if (token) {
                await authApi.logout(token);
            }
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            // Clear token and user regardless of API success
            sessionStorage.removeItem('token');
            setToken(null);
            setUser(null);
            setIsLoading(false);
        }
    };

    const clearError = () => {
        setError(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                isAuthenticated: !!user,
                isLoading,
                error,
                login,
                register,
                logout,
                clearError,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
} 