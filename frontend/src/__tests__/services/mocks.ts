// Mock data for testing
import { User, UserActivity, Session, SecuritySettings, SelectorConfig, TableInfo } from '@/types';

// Mock User data
export const mockUser: User = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'admin',
    isActive: true,
    avatar: null,
    bio: 'This is a test user bio',
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

// Mock Users list
export const mockUsers: User[] = [
    mockUser,
    {
        id: '2',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'editor',
        isActive: true,
        avatar: null,
        bio: 'Editor user',
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: '3',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'viewer',
        isActive: false,
        avatar: null,
        bio: 'Viewer user',
        lastLogin: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];

// Mock User Activities
export const mockUserActivities: UserActivity[] = [
    {
        id: '1',
        userId: '1',
        action: 'Logged in',
        timestamp: new Date().toISOString(),
    },
    {
        id: '2',
        userId: '1',
        action: 'Updated profile',
        timestamp: new Date(Date.now() - 60000).toISOString(),
    },
    {
        id: '3',
        userId: '2',
        action: 'Created content',
        timestamp: new Date(Date.now() - 120000).toISOString(),
    },
];

// Mock Sessions
export const mockSessions: Session[] = [
    {
        id: '1',
        device: 'Chrome / Windows',
        ip_address: '192.168.1.1',
        last_active: '5 minutes ago',
        created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
        id: '2',
        device: 'Firefox / MacOS',
        ip_address: '192.168.1.2',
        last_active: '2 days ago',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
];

// Mock Security Settings
export const mockSecuritySettings: SecuritySettings = {
    enableMFA: false,
    loginNotifications: true,
    sessionTimeout: '4hours',
};

// Mock Scraping Selectors
export const mockSelectors: SelectorConfig[] = [
    {
        name: 'Title',
        selector: 'h1.product-title',
    },
    {
        name: 'Price',
        selector: 'span.price-value',
    },
    {
        name: 'Description',
        selector: 'div.product-description',
    },
];

// Mock Database Tables
export const mockDatabaseTables: TableInfo[] = [
    {
        name: 'scraped_data',
        columns: ['id', 'url', 'title', 'description', 'price', 'image_url', 'created_at'],
    },
    {
        name: 'products',
        columns: ['id', 'name', 'price', 'description', 'image_url', 'category', 'created_at'],
    },
]; 