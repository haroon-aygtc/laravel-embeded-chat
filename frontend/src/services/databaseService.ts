/**
 * Database Service
 * 
 * Provides a simplified interface for database operations using the databaseApi feature.
 */

import { databaseApi, ContextRule, ExportLogsOptions, ModelPerformanceOptions, ModelPerformanceData } from "./api/features/databasefeatures";
import logger from "@/utils/logger";

/**
 * Service to handle database operations
 */
class DatabaseService {
    /**
     * Get all context rules
     */
    getContextRules = async (): Promise<ContextRule[]> => {
        try {
            const response = await databaseApi.getContextRules();

            if (!response.success) {
                throw new Error(response.error?.message || "Failed to fetch context rules");
            }

            return response.data || [];
        } catch (error) {
            logger.error("Error getting context rules:", error);
            return [];
        }
    };

    /**
     * Export AI logs to CSV with filters
     * Returns a download URL
     */
    exportLogs = async (options: ExportLogsOptions): Promise<{ url: string; filename: string } | null> => {
        try {
            const response = await databaseApi.exportLogs(options);

            if (!response.success) {
                throw new Error(response.error?.message || "Failed to export logs");
            }

            return {
                url: response.data.csvUrl,
                filename: response.data.filename
            };
        } catch (error) {
            logger.error("Error exporting logs:", error);
            return null;
        }
    };

    /**
     * Get model performance data
     */
    getModelPerformance = async (options: ModelPerformanceOptions): Promise<ModelPerformanceData | null> => {
        try {
            const response = await databaseApi.getModelPerformance(options);

            if (!response.success) {
                throw new Error(response.error?.message || "Failed to fetch model performance data");
            }

            return response.data;
        } catch (error) {
            logger.error("Error getting model performance:", error);
            return null;
        }
    };

    /**
     * Download a file from a URL
     */
    downloadFile = (url: string, filename: string): void => {
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
}

// Create and export a singleton instance
export const databaseService = new DatabaseService();
export default databaseService; 