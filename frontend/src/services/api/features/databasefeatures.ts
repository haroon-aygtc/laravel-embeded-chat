/**
 * Database API Service
 *
 * This service provides methods for interacting with database endpoints without direct DB connections
 */

import { api, ApiResponse } from "../middleware/apiMiddleware";
import { databaseEndpoints } from "../endpoints/databaseEndpoints";

export interface ContextRule {
    id: string;
    name: string;
    description?: string;
    created_at?: string;
    updated_at?: string;
}

export interface ExportLogsOptions {
    query?: string;
    modelUsed?: string;
    contextRuleId?: string | null;
    startDate?: string;
    endDate?: string;
}

export interface ExportLogsResponse {
    csvUrl: string;
    filename: string;
}

export interface DatabaseQueryOptions {
    sql: string;
    params?: any[];
}

export interface ModelPerformanceOptions {
    timeRange?: string;
    startDate?: string;
    endDate?: string;
}

export interface ModelUsage {
    model: string;
    count: number;
    successRate: number;
}

export interface ContextUsage {
    name: string;
    count: number;
    effectiveness: number;
}

export interface ModelPerformanceData {
    modelUsage: ModelUsage[];
    avgResponseTimes: Array<{ model: string; avgTime: number }>;
    contextUsage: ContextUsage[];
    timeRange: string;
}

export const databaseApi = {
    /**
     * Get all context rules
     */
    getContextRules: async (): Promise<ApiResponse<ContextRule[]>> => {
        return api.get<ContextRule[]>(databaseEndpoints.getContextRules);
    },

    /**
     * Get a context rule by ID
     */
    getContextRule: async (id: string): Promise<ApiResponse<ContextRule>> => {
        return api.get<ContextRule>(databaseEndpoints.getContextRule(id));
    },

    /**
     * Export AI logs to CSV with optional filters
     */
    exportLogs: async (options: ExportLogsOptions): Promise<ApiResponse<ExportLogsResponse>> => {
        return api.post<ExportLogsResponse>(databaseEndpoints.exportLogs, options);
    },

    /**
     * Get model performance data
     */
    getModelPerformance: async (options: ModelPerformanceOptions): Promise<ApiResponse<ModelPerformanceData>> => {
        return api.get<ModelPerformanceData>(databaseEndpoints.modelPerformance, { params: options });
    },

    /**
     * Get database tables (protected, admin only)
     */
    getDatabaseTables: async (): Promise<ApiResponse<string[]>> => {
        return api.get<string[]>(databaseEndpoints.getDatabaseTables);
    },

    /**
     * Execute a database query (protected, admin only)
     * THIS SHOULD BE USED WITH EXTREME CAUTION AND PROPER AUTHORIZATION
     */
    executeQuery: async (options: DatabaseQueryOptions): Promise<ApiResponse<any[]>> => {
        return api.post<any[]>(databaseEndpoints.executeQuery, options);
    }
}; 