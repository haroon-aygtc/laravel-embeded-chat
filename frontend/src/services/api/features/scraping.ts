import { api } from "../middleware/apiMiddleware";
import {
  ScrapingTarget,
  ScrapingResult,
  DatabaseConfig,
  ScrapeOptions,
  ScrapeResult,
  SelectorConfig,
} from "@/services/scrapingService";

/**
 * Scraping API Service
 * Provides methods for interacting with scraping endpoints
 */
export const scrapingApi = {
  /**
   * Scrape multiple URLs based on provided selectors
   */
  scrapeMultipleUrls: async (
    targets: ScrapingTarget[],
  ): Promise<ScrapingResult[]> => {
    try {
      const response = await api.post("/scraping/scrape", { targets });
      return response.data.data || [];
    } catch (error) {
      console.error("Error scraping multiple URLs:", error);
      return [];
    }
  },

  /**
   * Scrape a single URL with the provided selectors
   */
  scrapeUrl: async (
    url: string,
    selectors: SelectorConfig[],
    options?: ScrapingTarget["options"],
  ): Promise<ScrapingResult> => {
    try {
      const response = await api.post("/scraping/scrape", {
        targets: [{ url, selectors, options }],
      });
      return response.data.data[0];
    } catch (error) {
      console.error(`Error scraping URL ${url}:`, error);
      return {
        url,
        timestamp: new Date().toISOString(),
        data: {},
        success: false,
        error: error.message || "Failed to scrape URL",
      };
    }
  },

  /**
   * Save scraping results to a database
   */
  saveToDatabase: async (
    results: ScrapingResult[],
    dbConfig: DatabaseConfig,
  ): Promise<boolean> => {
    try {
      await api.post("/scraping/save-database", { results, dbConfig });
      return true;
    } catch (error) {
      console.error("Error saving scraping results to database:", error);
      return false;
    }
  },

  /**
   * Save scraping results to a file
   */
  saveToFile: async (
    results: ScrapingResult[],
    filename: string,
    format: "json" | "csv" | "xml" | "excel" = "json",
  ): Promise<string> => {
    try {
      const response = await api.post("/scraping/save-file", {
        results,
        filename,
        format,
      });
      return response.data.filePath;
    } catch (error) {
      console.error("Error saving scraping results to file:", error);
      throw new Error(`Failed to save results to file: ${error.message}`);
    }
  },

  /**
   * Fetch HTML content from a URL for preview
   */
  fetchHtmlPreview: async (url: string): Promise<string> => {
    try {
      const response = await api.post("/scraping/fetch", { url });
      return response.data.html;
    } catch (error) {
      console.error("Error fetching HTML preview:", error);
      throw new Error(`Failed to fetch HTML preview: ${error.message}`);
    }
  },

  /**
   * Test a selector against a URL
   */
  testSelector: async (
    url: string,
    selector: SelectorConfig,
  ): Promise<{ success: boolean; result: any; error?: string }> => {
    try {
      const response = await api.post("/scraping/test-selector", {
        url,
        selector,
      });
      return response.data;
    } catch (error) {
      console.error("Error testing selector:", error);
      return {
        success: false,
        result: null,
        error: error.message || "An unknown error occurred",
      };
    }
  },

  /**
   * Start a new scraping job with AI processing
   */
  startScraping: async (options: ScrapeOptions): Promise<string> => {
    try {
      const response = await api.post("/scraping/start-job", { options });
      return response.data.jobId;
    } catch (error) {
      console.error("Error starting scraping job:", error);
      throw new Error(`Failed to start scraping job: ${error.message}`);
    }
  },

  /**
   * Get the status and results of a scraping job
   */
  getJobStatus: async (jobId: string): Promise<ScrapeResult | null> => {
    try {
      const response = await api.get(`/scraping/job/${jobId}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error getting job status for ${jobId}:`, error);
      return null;
    }
  },

  /**
   * Get all scraping jobs
   */
  getAllJobs: async (): Promise<ScrapeResult[]> => {
    try {
      const response = await api.get("/scraping/jobs");
      return response.data.data || [];
    } catch (error) {
      console.error("Error getting all scraping jobs:", error);
      return [];
    }
  },

  /**
   * Delete a scraping job
   */
  deleteJob: async (jobId: string): Promise<boolean> => {
    try {
      await api.delete(`/scraping/job/${jobId}`);
      return true;
    } catch (error) {
      console.error(`Error deleting scraping job ${jobId}:`, error);
      return false;
    }
  },

  /**
   * Run AI analysis on scraped content
   */
  runAIAnalysis: async (
    resultId: string,
    options: ScrapeOptions["aiOptions"],
  ): Promise<any> => {
    try {
      const response = await api.post("/scraping/analyze", {
        resultId,
        options,
      });
      return response.data;
    } catch (error) {
      console.error("Error running AI analysis:", error);
      throw new Error(`Failed to run AI analysis: ${error.message}`);
    }
  },
};
