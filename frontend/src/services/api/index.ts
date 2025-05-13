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
import { contextRulesApi } from "./features/contextRules";
import { followUpConfigApi } from "./features/followUpConfig";
import { followUpQuestionsApi } from "./features/followUpQuestions";
import { responseFormattingApi } from "./features/responseFormatting";
import { scrapingApi } from "./features/scraping";

// API endpoints
import * as endpoints from "./endpoints";

// Export all API-related services and utilities
export {
  // Core API utilities
  api,

  // Feature-specific API services
  authApi,
  userApi,
  chatApi,
  aiApi,
  knowledgeBaseApi,
  widgetApi,
  contextRulesApi,
  followUpConfigApi,
  followUpQuestionsApi,
  responseFormattingApi,
  scrapingApi,

  // API endpoints
  endpoints,
};

// Re-export types from feature services
export type {
  LoginCredentials,
  RegisterData,
  User,
  AuthResponse,
} from "./features/auth";

export type {
  UserProfile,
  UserActivity,
  UserQueryParams,
  UserListResponse,
} from "./features/user";

export type {
  ChatSession,
  ChatMessage,
  ChatAttachment,
  SendMessageRequest,
  CreateSessionRequest,
} from "./features/chat";

export type {
  AIModel,
  GenerateRequest,
  GenerateResponse,
  AIInteractionLog,
  PerformanceMetrics,
} from "./features/aifeatures";

export type {
  KnowledgeBaseConfig,
  KnowledgeBaseQueryRequest,
} from "./features/knowledgeBase";
