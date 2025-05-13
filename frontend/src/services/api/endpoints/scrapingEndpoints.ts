/**
 * Scraping API Endpoints
 * Defines the API endpoints for scraping operations
 */
export const scrapingEndpoints = {
  scrape: "/scraping/scrape",
  saveToDatabase: "/scraping/save-database",
  saveToFile: "/scraping/save-file",
  fetchHtml: "/scraping/fetch",
  testSelector: "/scraping/test-selector",
  startJob: "/scraping/start-job",
  getJob: (jobId: string) => `/scraping/job/${jobId}`,
  getAllJobs: "/scraping/jobs",
  deleteJob: (jobId: string) => `/scraping/job/${jobId}`,
  analyze: "/scraping/analyze",
};
