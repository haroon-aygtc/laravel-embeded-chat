type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Determine if we're in development mode
const isDev = import.meta.env.DEV;

// Set the minimum log level
const minLevel: LogLevel = isDev ? 'debug' : 'warn';

const levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

// Colors for different log levels
const colors: Record<LogLevel, string> = {
    debug: '#808080', // Gray
    info: '#0077cc',  // Blue
    warn: '#ff9900',  // Orange
    error: '#cc0000', // Red
};

/**
 * Simple logger utility with log levels
 */
const logger = {
    debug(...args: any[]): void {
        if (levels[minLevel] <= levels.debug) {
            console.log(`%c[DEBUG]`, `color: ${colors.debug}; font-weight: bold;`, ...args);
        }
    },

    info(...args: any[]): void {
        if (levels[minLevel] <= levels.info) {
            console.info(`%c[INFO]`, `color: ${colors.info}; font-weight: bold;`, ...args);
        }
    },

    warn(...args: any[]): void {
        if (levels[minLevel] <= levels.warn) {
            console.warn(`%c[WARN]`, `color: ${colors.warn}; font-weight: bold;`, ...args);
        }
    },

    error(...args: any[]): void {
        if (levels[minLevel] <= levels.error) {
            console.error(`%c[ERROR]`, `color: ${colors.error}; font-weight: bold;`, ...args);
        }
    },

    /**
     * Log group for related messages
     */
    group(name: string, level: LogLevel = 'info', collapsed = false): void {
        if (levels[minLevel] <= levels[level]) {
            if (collapsed) {
                console.groupCollapsed(`%c[${level.toUpperCase()}] ${name}`, `color: ${colors[level]}; font-weight: bold;`);
            } else {
                console.group(`%c[${level.toUpperCase()}] ${name}`, `color: ${colors[level]}; font-weight: bold;`);
            }
        }
    },

    /**
     * End a log group
     */
    groupEnd(): void {
        console.groupEnd();
    },

    /**
     * Time a function execution
     */
    time(label: string): void {
        if (isDev) {
            console.time(label);
        }
    },

    /**
     * End timing a function execution
     */
    timeEnd(label: string): void {
        if (isDev) {
            console.timeEnd(label);
        }
    },
};

export default logger; 