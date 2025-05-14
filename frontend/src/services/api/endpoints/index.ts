/**
 * API Endpoints Index
 *
 * This file exports all API endpoint modules to provide a unified interface
 * for importing API functionality throughout the application.
 */

// Authentication and user management
export * from "./authEndpoints";
export * from "./userEndpoints";

// Chat functionality
export * from "./chatEndpoints";

// AI and context management
export * from "./aiEndpoints";
export * from "./aiProviderEndpoints";
export * from "./contextRuleEndpoints";
export * from "./promptTemplateEndpoints";

// Knowledge base
export * from "./knowledgeBaseEndpoints";
export * from "./vectorSearchEndpoints";

// Widget and embedding
export * from "./widgetEndpoints";

// Follow-up and response formatting
export * from "./followUpConfigEndpoints";
export * from "./followUpEndpoints";
export * from "./responseFormattingEndpoints";

// Scraping and data collection
export * from "./scrapingEndpoints";
