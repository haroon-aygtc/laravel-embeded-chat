/**
 * Application Constants
 * 
 * This file contains constants used throughout the application.
 */

// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// WebSocket Base URL (derived from API URL)
export const WS_BASE_URL = import.meta.env.VITE_WS_URL ||
    (typeof window !== 'undefined' && API_BASE_URL.startsWith('http')
        ? API_BASE_URL.replace(/^http/, 'ws')
        : typeof window !== 'undefined' ? `ws://${window.location.host}${API_BASE_URL}` : '');

// Auth configuration
export const AUTH_TOKEN_KEY = 'auth_token';
export const AUTH_USER_KEY = 'auth_user';
export const TOKEN_EXPIRY_MARGIN = 300; // 5 minutes in seconds

// Other global constants
export const APP_NAME = 'The Last Lab';
export const DEFAULT_PAGE_SIZE = 10;

// Chat widget defaults
export const DEFAULT_WIDGET_CONFIG = {
    primaryColor: '#4f46e5',
    secondaryColor: '#f3f4f6',
    fontFamily: 'Inter',
    borderRadius: 8,
    position: 'bottom-right',
    initialMessage: 'Hello! How can I help you today?',
    placeholderText: 'Type your message here...',
    showHeader: true,
    showFooter: true,
    allowAttachments: false,
    allowEmoji: true,
    initiallyOpen: false
};

// Log levels
export const LOG_LEVEL = import.meta.env.VITE_NODE_ENV === 'development' ? 'debug' : 'error';