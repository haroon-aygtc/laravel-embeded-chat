export const env = {
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
    API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
    APP_URL: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
}; 