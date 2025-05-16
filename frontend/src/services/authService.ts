import { v4 as uuidv4 } from 'uuid';
import Cookies from 'js-cookie';
import { User } from '@/types/user';
import { Permission, Role } from '@/types/permissions';
import logger from '@/utils/logger';

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

    private constructor() {}

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
        Cookies.set(AUTH_STORAGE.USER, JSON.stringify(user), { expires: 1 });
        this.lastActivity = Date.now();
    }

    getUser(): User | null {
        if (this.user) return this.user;
        
        const storedUser = Cookies.get(AUTH_STORAGE.USER);
        if (storedUser) {
            try {
                this.user = JSON.parse(storedUser);
                return this.user;
            } catch (error) {
                logger.error('Failed to parse stored user:', error);
                this.clearAuth();
                return null;
            }
        }
        return null;
    }

    clearAuth(): void {
        this.user = null;
        this.csrfToken = null;
        Cookies.remove(AUTH_STORAGE.USER);
        Cookies.remove(AUTH_STORAGE.CSRF);
        Cookies.remove(AUTH_STORAGE.SESSION);
        Cookies.remove(AUTH_STORAGE.LAST_ACTIVITY);
        Cookies.remove(AUTH_STORAGE.PROFILE);
    }

    // Authentication State
    isAuthenticated(): boolean {
        return !!this.getUser();
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
