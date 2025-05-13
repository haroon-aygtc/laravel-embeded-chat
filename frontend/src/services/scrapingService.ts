/**
 * Scraping Service
 *
 * This service handles interactions with the scraping API endpoints
 * instead of direct database access.
 */

import logger from "@/utils/logger";
import { api } from "./api/middleware/apiMiddleware";

export interface SelectorConfig {
  id: string;
  selector: string;
  name: string;
  attribute?: string;
  type: "text" | "html" | "attribute" | "list";
  listItemSelector?: string;
}

export interface ScrapingTarget {
  url: string;
  selectors: SelectorConfig[];
  options?: {
    headers?: Record<string, string>;
    method?: string;
    body?: any;
    waitForSelector?: string;
    waitTimeout?: number;
    enableJavaScript?: boolean;
    followRedirects?: boolean;
    maxDepth?: number;
    throttle?: number;
    proxy?: string;
    cookies?: string;
    captureScreenshot?: boolean;
    device?: string;
    viewport?: {
      width: number;
      height: number;
    };
  };
}

export interface ScrapingResult {
  url: string;
  timestamp: string;
  data: Record<string, any>;
  success: boolean;
  error?: string;
  screenshot?: string;
  metadata?: {
    statusCode?: number;
    contentType?: string;
    responseTime?: number;
    pageTitle?: string;
  };
}

export interface ScrapeOptions {
  url: string;
  includeHeader: boolean;
  includeFooter: boolean;
  scrapeFullPage: boolean;
  scrapeImages: boolean;
  scrapeVideos: boolean;
  scrapeText: boolean;
  handleDynamicContent: boolean;
  skipHeadersFooters: boolean;
  skipMedia: boolean;
  waitForDynamicContent: boolean;
  respectRobotsTxt: boolean;
  stealthMode: boolean;
  maxPages?: number;
  waitTime?: number;
  selector?: string;
  loginRequired?: boolean;
  loginCredentials?: {
    username: string;
    password: string;
    usernameSelector: string;
    passwordSelector: string;
    submitSelector: string;
  };
  pagination?: {
    enabled: boolean;
    nextButtonSelector: string;
    maxPages: number;
  };
  aiOptions?: {
    enabled: boolean;
    cleaningLevel: "basic" | "thorough" | "semantic";
    extractStructuredData: boolean;
    performSentimentAnalysis: boolean;
    extractEntities: boolean;
    generateSummary: boolean;
    extractKeywords: boolean;
    categorizeContent: boolean;
  };
  exportOptions?: {
    format: "json" | "csv" | "xml" | "excel" | "text";
    includeMetadata: boolean;
    useSemanticKeys: boolean;
    extractLinks: boolean;
    extractImages: boolean;
    extractTables: boolean;
    saveToPublic: boolean;
    overwriteExisting: boolean;
    customFilename: string;
  };
  securityOptions?: {
    enableProxy: boolean;
    proxyUrl: string;
    rateLimitDelay: number;
    maxRetries: number;
    followRedirects: boolean;
  };
}

export interface ScrapeResult {
  id: string;
  url: string;
  timestamp: string;
  status: "in-progress" | "completed" | "failed";
  progress: number;
  error?: string;
  data: {
    text: string[];
    images: string[];
    videos: string[];
    tables: any[];
    lists: any[];
    links?: string[];
    structuredData?: Record<string, any>;
  };
  aiAnalysis?: {
    sentiment?: {
      overall: string;
      score: number;
    };
    entities?: {
      name: string;
      type: string;
      count: number;
    }[];
    summary?: string;
    keywords?: string[];
    categories?: string[];
    structuredData?: Record<string, any>;
    cleanedText?: string;
  };
  metadata: {
    pageTitle: string;
    pageDescription: string;
    pageKeywords: string[];
    totalElements: number;
    statusCode?: number;
    contentType?: string;
    responseTime?: number;
    robotsTxtStatus?: string;
    removedElements?: {
      headers?: number;
      footers?: number;
      ads?: number;
      media?: number;
    };
  };
  exportPath?: string;
  exportFormat?: string;
}

class ScrapingService {
  private batchSize = 5;
  private retryLimit = 3;
  private retryDelay = 1000;

  /**
   * Scrapes data from multiple URLs based on provided selectors
   */
  async scrapeMultipleUrls(
    targets: ScrapingTarget[],
  ): Promise<ScrapingResult[]> {
    try {
      const response = await api.post<ScrapingResult[]>("/scraping/batch", {
        targets,
      });

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to scrape multiple URLs",
        );
      }

      return response.data || [];
    } catch (error) {
      logger.error("Error in scrapeMultipleUrls:", error);
      throw error;
    }
  }

  /**
   * Scrapes a single URL with the provided selectors
   */
  async scrapeUrl(
    url: string,
    selectors: SelectorConfig[],
    options?: ScrapingTarget["options"],
  ): Promise<ScrapingResult> {
    try {
      const response = await api.post<ScrapingResult>("/scraping/scrape", {
        url,
        selectors,
        options,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || "Failed to scrape URL");
      }

      return response.data;
    } catch (error) {
      logger.error(`Error scraping URL ${url}:`, error);
      return {
        url,
        timestamp: new Date().toISOString(),
        data: {},
        success: false,
        error: error.message || "Failed to scrape URL",
      };
    }
  }

  /**
   * Fetches HTML content from a URL for preview
   */
  async fetchHtmlPreview(url: string): Promise<string> {
    try {
      const response = await api.post<{ html: string }>("/scraping/fetch", {
        url,
      });

      if (!response.success || !response.data) {
        throw new Error(
          response.error?.message || "Failed to fetch HTML preview",
        );
      }

      return response.data.html || "";
    } catch (error) {
      logger.error("Error fetching HTML preview:", error);
      throw error;
    }
  }

  /**
   * Tests a selector against a URL
   */
  async testSelector(
    url: string,
    selector: SelectorConfig,
  ): Promise<{ success: boolean; result: any; error?: string }> {
    try {
      const response = await api.post<{
        success: boolean;
        result: any;
        error?: string;
      }>("/scraping/test-selector", {
        url,
        selector,
      });

      if (!response.success) {
        return {
          success: false,
          result: null,
          error: response.error?.message || "Failed to test selector",
        };
      }

      return (
        response.data || {
          success: false,
          result: null,
          error: "No response data",
        }
      );
    } catch (error) {
      logger.error("Error testing selector:", error);
      return {
        success: false,
        result: null,
        error: error.message || "An unknown error occurred",
      };
    }
  }

  /**
   * Validates a URL
   */
  validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Start a new scraping job with AI processing
   */
  async startScraping(options: ScrapeOptions): Promise<string> {
    try {
      const response = await api.post<{ jobId: string }>(
        "/scraping/jobs",
        options,
      );

      if (!response.success || !response.data) {
        throw new Error(
          response.error?.message || "Failed to start scraping job",
        );
      }

      return response.data.jobId;
    } catch (error) {
      logger.error("Error starting scraping job:", error);
      throw error;
    }
  }

  /**
   * Get the status and results of a scraping job
   */
  async getJobStatus(jobId: string): Promise<ScrapeResult | null> {
    try {
      const response = await api.get<ScrapeResult>(`/scraping/jobs/${jobId}`);

      if (!response.success) {
        if (response.error?.code === "ERR_404") {
          return null;
        }
        throw new Error(response.error?.message || "Failed to get job status");
      }

      return response.data || null;
    } catch (error) {
      logger.error(`Error getting job status for ${jobId}:`, error);
      return null;
    }
  }

  /**
   * Get all scraping jobs
   */
  async getAllJobs(): Promise<ScrapeResult[]> {
    try {
      const response = await api.get<ScrapeResult[]>("/scraping/jobs");

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to get all jobs");
      }

      return response.data || [];
    } catch (error) {
      logger.error("Error getting all jobs:", error);
      return [];
    }
  }

  /**
   * Delete a scraping job
   */
  async deleteJob(jobId: string): Promise<boolean> {
    try {
      const response = await api.delete<{ success: boolean }>(
        `/scraping/jobs/${jobId}`,
      );

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to delete job");
      }

      return true;
    } catch (error) {
      logger.error(`Error deleting job ${jobId}:`, error);
      return false;
    }
  }

  /**
   * Run AI analysis on scraped content
   */
  async runAIAnalysis(
    resultId: string,
    options: ScrapeOptions["aiOptions"],
  ): Promise<any> {
    try {
      const response = await api.post<any>(
        `/scraping/jobs/${resultId}/analyze`,
        { options },
      );

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to run AI analysis");
      }

      return response.data || {};
    } catch (error) {
      logger.error("Error running AI analysis:", error);
      throw error;
    }
  }
}

// Create a singleton instance
const scrapingService = new ScrapingService();

export default scrapingService;
