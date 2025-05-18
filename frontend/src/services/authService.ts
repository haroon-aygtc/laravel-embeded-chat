import { v4 as uuidv4 } from 'uuid';
import Cookies from 'js-cookie';
import { User } from '@/types/user';
import { Permission, Role } from '@/types/permissions';
import logger from '@/utils/logger';
import { ROLE_PERMISSIONS } from '@/types/auth';

// Constants
const AUTH_STORAGE = {
    USER: 'auth_user',
    CSRF: 'XSRF-TOKEN',
    SESSION: 'auth_session',
    LAST_ACTIVITY: 'last_activity',
    PROFILE: 'profile_data'
};

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export class AuthService {
    private static instance: AuthService;
    private user: User | null = null;
    private csrfToken: string | null = null;
    private lastActivity: number = Date.now();
    private sessionCheckInterval: NodeJS.Timeout | null = null;

    private constructor() { }

    static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
            this.startSessionCheck();
        }
        return AuthService.instance;
    }

    private static startSessionCheck(): void {
        const instance = AuthService.getInstance();
        instance.sessionCheckInterval = setInterval(() => {
            instance.checkSession();
        }, 5000);
    }

    private checkSession(): void {
        const now = Date.now();
        if (now - this.lastActivity > SESSION_TIMEOUT) {
            this.clearAuth();
        }
    }

    // CSRF Management
    async getCsrfToken(): Promise<string> {
        if (this.csrfToken) return this.csrfToken;

        try {
            const response = await fetch('/sanctum/csrf-cookie');
            if (!response.ok) {
                throw new Error('Failed to get CSRF token');
            }

            this.csrfToken = Cookies.get(AUTH_STORAGE.CSRF) || uuidv4();
            return this.csrfToken;
        } catch (error) {
            logger.error('Failed to get CSRF token:', error);
            throw error;
        }
    }

    // User Management
    setUser(user: User): void {
        this.user = user;
        // Store user data in both localStorage and cookies for better persistence
        localStorage.setItem(AUTH_STORAGE.USER, JSON.stringify(user));
        Cookies.set(AUTH_STORAGE.USER, JSON.stringify(user), { expires: 7 }); // Extend expiry to 7 days
        this.lastActivity = Date.now();
    }

    setToken(token: string, tokenType: string = 'Bearer'): void {
        if (!token) {
            logger.warn('Attempted to set null/empty token');
            return;
        }

        // Store the token in localStorage for API requests
        const fullToken = `${tokenType} ${token}`;
        localStorage.setItem('access_token', fullToken);

        // Also store the raw token for other uses
        localStorage.setItem('auth_token', token);

        // Store in cookies as well for better persistence
        Cookies.set('access_token', fullToken, { expires: 7, path: '/' });
        Cookies.set('auth_token', token, { expires: 7, path: '/' });

        logger.debug('Auth token set successfully in localStorage and cookies');
    }

    getToken(): string | null {
        // Try to get token from localStorage first
        const localStorageToken = localStorage.getItem('access_token');
        if (localStorageToken) {
            return localStorageToken;
        }

        // Fallback to cookies if localStorage failed
        const cookieToken = Cookies.get('access_token');
        if (cookieToken) {
            // Sync with localStorage for future requests
            localStorage.setItem('access_token', cookieToken);
            return cookieToken;
        }

        return null;
    }

    getUser(): User | null {
        // Return cached user if available
        if (this.user) return this.user;

        // Try to get user from localStorage first (more reliable across page refreshes)
        const localStorageUser = localStorage.getItem(AUTH_STORAGE.USER);
        if (localStorageUser) {
            try {
                this.user = JSON.parse(localStorageUser);
                return this.user;
            } catch (error) {
                logger.error('Failed to parse user from localStorage:', error);
                // Don't clear auth yet, try cookies as fallback
            }
        }

        // Fallback to cookies if localStorage failed
        const cookieUser = Cookies.get(AUTH_STORAGE.USER);
        if (cookieUser) {
            try {
                this.user = JSON.parse(cookieUser);
                // Sync with localStorage for future requests
                localStorage.setItem(AUTH_STORAGE.USER, cookieUser);
                return this.user;
            } catch (error) {
                logger.error('Failed to parse user from cookies:', error);
                this.clearAuth();
                return null;
            }
        }

        // No user found in either storage
        return null;
    }

    clearAuth(): void {
        this.user = null;
        this.csrfToken = null;

        // Clear cookies with proper path
        Cookies.remove(AUTH_STORAGE.USER, { path: '/' });
        Cookies.remove(AUTH_STORAGE.CSRF, { path: '/' });
        Cookies.remove(AUTH_STORAGE.SESSION, { path: '/' });
        Cookies.remove(AUTH_STORAGE.LAST_ACTIVITY, { path: '/' });
        Cookies.remove(AUTH_STORAGE.PROFILE, { path: '/' });
        Cookies.remove('access_token', { path: '/' });
        Cookies.remove('auth_token', { path: '/' });

        // Clear localStorage tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('auth_token');
        localStorage.removeItem(AUTH_STORAGE.USER);

        // Clear session storage
        sessionStorage.removeItem('profile_response');
        sessionStorage.removeItem('last_profile_request_time');

        logger.debug('Auth data cleared from cookies, localStorage, and sessionStorage');
    }

    // Authentication State
    isAuthenticated(): boolean {
        // First check for user object AND token to ensure both are present
        const userObject = this.getUser();
        const token = this.getToken();

        // Only consider authenticated if we have both a user and a token
        if (userObject && token) {
            logger.debug('User has both a user object and token');
            this.updateLastActivity(); // Update last activity timestamp
            return true;
        }

        // If we only have a token but no user, we can consider the user authenticated
        // The AuthContext will try to load the user data
        if (!userObject && token) {
            logger.debug('Token found but no user object, considering authenticated and will reload user data');
            // Return true to prevent immediate logout, AuthContext will try to load user data
            return true;
        }

        // If we only have a user but no token, we can try to use the user data
        // This is a partial auth state that might work for some operations
        if (userObject && !token) {
            logger.debug('User object found but no token, partial authentication state');
            // Return true to prevent immediate logout, AuthContext will try to refresh the token
            return true;
        }

        logger.debug('User is not authenticated (missing both token and user data)');
        return false;
    }

    // Session Management
    updateLastActivity(): void {
        this.lastActivity = Date.now();
        Cookies.set(AUTH_STORAGE.LAST_ACTIVITY, this.lastActivity.toString());
    }

    // Permission Checks
    hasPermission(permission: Permission): boolean {
        const user = this.getUser();
        if (!user) return false;

        // Super admin and admin have all permissions
        if (user.role === 'super_admin' || user.role === 'admin') return true;

        // Check specific permissions
        const rolePermissions = ROLE_PERMISSIONS[user.role as Role] || [];
        return rolePermissions.includes(permission);
    }

    // Role Checks
    hasRole(role: Role): boolean {
        const user = this.getUser();
        return user?.role === role;
    }

    // Profile Request Management
    private profileRequestInProgress = false;
    private profileRequestCount = 0;
    private lastProfileFetchTime: number | null = null;
    private cachedProfileResponse: any | null = null;

    isProfileRequestInProgress(): boolean {
        return this.profileRequestInProgress;
    }

    getProfileRequestCount(): number {
        return this.profileRequestCount;
    }

    wasProfileFetchedRecently(): boolean {
        if (!this.lastProfileFetchTime) return false;
        const now = Date.now();
        return now - this.lastProfileFetchTime < 5 * 60 * 1000; // 5 minutes
    }

    getCachedProfileResponse(): any | null {
        return this.cachedProfileResponse;
    }

    setProfileRequestFlag(): void {
        this.profileRequestInProgress = true;
    }

    clearProfileRequestFlag(): void {
        this.profileRequestInProgress = false;
    }

    incrementProfileRequestCount(): void {
        this.profileRequestCount++;
    }

    cacheProfileResponse(response: any): void {
        this.cachedProfileResponse = response;
    }

    markProfileFetched(): void {
        this.lastProfileFetchTime = Date.now();
    }
}
