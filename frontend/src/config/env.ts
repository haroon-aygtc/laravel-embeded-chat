export const env = {
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
    API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:9000/api',
    APP_URL: import.meta.env.VITE_APP_URL || 'http://localhost:3000',

    GEMINI_API_KEY: import.meta.env.GEMINI_API_KEY,
    GROK_API_KEY: import.meta.env.GROK_API_KEY,

    WS_PORT: import.meta.env.VITE_WS_PORT || 9001,
    WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:9001',

    API_WS_HOST: import.meta.env.VITE_API_WS_HOST || 'localhost',
    API_WS_PORT: import.meta.env.VITE_API_WS_PORT || 9001,
    API_WS_URL: import.meta.env.VITE_API_WS_URL || 'ws://localhost:9001',
}; 