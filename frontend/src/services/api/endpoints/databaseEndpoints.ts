/**
 * Database API Endpoints
 *
 * Defines the API endpoints for database operations
 */

export const databaseEndpoints = {
    // Context rules
    getContextRules: "/context-rules",
    getContextRule: (id: string) => `/context-rules/${id}`,

    // Export operations
    exportLogs: "/ai/logs/export",

    // Model performance
    modelPerformance: "/ai/performance",

    // Database query operations - these should be used sparingly and with proper authorization
    getDatabaseTables: "/database/tables",
    executeQuery: "/database/query",
}; 