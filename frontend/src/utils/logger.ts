/**
 * Simple logger utility for application logging
 */

import { LOG_LEVEL } from '@/config/constants';

// Define log levels and their priorities
const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
};

// Default to 'info' log level if not specified
const currentLogLevel = LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'error');

const shouldLog = (level: keyof typeof LOG_LEVELS): boolean => {
    return LOG_LEVELS[level] >= LOG_LEVELS[currentLogLevel as keyof typeof LOG_LEVELS];
};

const logger = {
    /**
     * Log debug message (development only)
     */
    debug: (message: string, ...args: any[]) => {
        if (shouldLog('debug')) {
            console.debug(`[DEBUG] ${message}`, ...args);
        }
    },

    /**
     * Log informational message
     */
    info: (message: string, ...args: any[]) => {
        if (shouldLog('info')) {
            console.info(`[INFO] ${message}`, ...args);
        }
    },

    /**
     * Log warning message
     */
    warn: (message: string, ...args: any[]) => {
        if (shouldLog('warn')) {
            console.warn(`[WARN] ${message}`, ...args);
        }
    },

    /**
     * Log error message
     */
    error: (message: string, ...args: any[]) => {
        if (shouldLog('error')) {
            console.error(`[ERROR] ${message}`, ...args);
        }
    },

    /**
     * Group log messages
     */
    group: (name: string, collapsed = false) => {
        if (collapsed) {
            console.groupCollapsed(name);
        } else {
            console.group(name);
        }
    },

    /**
     * End a log group
     */
    groupEnd: () => {
        console.groupEnd();
    },

    /**
     * Log with a timestamp
     */
    time: (message: string, ...args: any[]) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${message}`, ...args);
    }
};

export default logger; 