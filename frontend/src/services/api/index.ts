/**
 * API Module Index
 *
 * This file exports all API-related services and utilities
 * for importing API functionality throughout the application.
 */

// Core API utilities
import { api } from "./middleware/apiMiddleware";

// Feature-specific API services
import { authApi } from "./features/auth";
import { userApi } from "./features/user";
import { chatApi } from "./features/chat";
import { aiApi } from "./features/aifeatures";
import { knowledgeBaseApi } from "./features/knowledgeBase";
import { widgetApi } from "./features/widget";
import { contextRulesApi } from "./features/contextRulesfeatures";
import { followUpConfigApi } from "./features/followUpConfig";
import { followUpApi } from "./features/followupfeatures";
import { responseFormattingApi } from "./features/responseFormatting";
import { promptTemplateApi } from "./features/promptTemplatefeatures";
import { vectorSearchApi } from "./features/vectorSearchFeatures";

// Endpoint definitions (for external use if needed)
import * as endpoints from "./endpoints";

// Export API middleware and utilities
export { api, endpoints };

// Export feature-specific APIs
export {
  authApi,
  userApi,
  chatApi,
  aiApi,
  knowledgeBaseApi,
  widgetApi,
  contextRulesApi,
  followUpConfigApi,
  followUpApi,
  responseFormattingApi,
  promptTemplateApi,
  vectorSearchApi
};

// Export type definitions from features
export type { RegisterData, LoginCredentials } from "./features/auth";
export type { ChatMessage } from "./features/chat";
export type {
  FollowUpConfig,
  FollowUpQuestion
} from "./features/followupfeatures";
export type {
  KnowledgeEntryWithScore,
  VectorSearchSettings
} from "./features/vectorSearchFeatures";
