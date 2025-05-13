import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { env } from "@/config/env";
import logger from "@/utils/logger";
import {
  ContextRule,
  ContextRuleCreateInput,
  ContextRuleUpdateInput,
  ContextRuleTestResult,
} from "@/types/contextRules";
import { PromptTemplate } from "@/types/promptTemplates";
import { v4 as uuidv4 } from "uuid";


/**
 * Base API service with methods for standard REST operations and streaming
 */
export class ApiService {
  private client: AxiosInstance
  private baseUrl: string

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || '/api') {
    this.baseUrl = baseUrl
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      withCredentials: true,
    })

    // Add interceptors for authentication
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('api_token')
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const config: AxiosRequestConfig = { params }
    const response: AxiosResponse<T> = await this.client.get(endpoint, config)
    return response.data
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(endpoint, data)
    return response.data
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(endpoint, data)
    return response.data
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(endpoint, data)
    return response.data
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(endpoint)
    return response.data
  }

  /**
   * Stream data from a server-sent events (SSE) endpoint
   * Particularly useful for AI streaming responses
   */
  streamResponse<T>(
    endpoint: string,
    data: any,
    callbacks: {
      onStart?: (data: any) => void,
      onChunk: (chunk: any) => void,
      onComplete?: (data: any) => void,
      onError?: (error: any) => void,
    }
  ): () => void {
    // Create the SSE URL with query params
    const url = new URL(`${this.baseUrl}${endpoint}`, window.location.origin)

    // Create headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    }

    // Add auth token if available
    const token = localStorage.getItem('api_token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // Create AbortController to allow cancellation
    const controller = new AbortController()
    const { signal } = controller

    // Start the fetch
    fetch(url.toString(), {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      credentials: 'include',
      signal,
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }

        if (!response.body) {
          throw new Error('ReadableStream not supported in this browser.')
        }

        // Get the reader from the response body stream
        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        // Read the stream
        const processStream = ({ done, value }: ReadableStreamReadResult<Uint8Array>): Promise<void> => {
          // Stream is done
          if (done) {
            return Promise.resolve()
          }

          // Decode the stream chunk
          const chunk = decoder.decode(value, { stream: true })

          // Process each SSE event
          const events = chunk.split('\n\n').filter(Boolean)

          events.forEach(event => {
            const eventTypeMatch = event.match(/^event: (.+)$/m)
            const dataMatch = event.match(/^data: (.+)$/m)

            if (eventTypeMatch && dataMatch) {
              const eventType = eventTypeMatch[1]
              const data = JSON.parse(dataMatch[1])

              switch (eventType) {
                case 'start':
                  callbacks.onStart?.(data)
                  break
                case 'chunk':
                  callbacks.onChunk(data)
                  break
                case 'done':
                  callbacks.onComplete?.(data)
                  break
                case 'error':
                  callbacks.onError?.(data)
                  break
              }
            }
          })

          // Continue reading the stream
          return reader.read().then(processStream)
        }

        // Start processing the stream
        reader.read().then(processStream)
      })
      .catch(error => {
        callbacks.onError?.(error)
      })

    // Return a function to cancel the stream
    return () => controller.abort()
  }
}

// Context Rules API
export const contextRulesApi = {
  getAll: async (): Promise<ContextRule[]> => {
    try {
      const response = await api.get("/context-rules");
      return response.data;
    } catch (error) {
      logger.error(
        "Error fetching context rules",
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  },

  getById: async (id: string): Promise<ContextRule> => {
    try {
      const response = await api.get(`/context-rules/${id}`);
      return response.data;
    } catch (error) {
      logger.error(
        `Error fetching context rule ${id}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  },

  create: async (rule: ContextRuleCreateInput): Promise<ContextRule> => {
    try {
      const response = await api.post("/context-rules", rule);
      return response.data;
    } catch (error) {
      logger.error(
        "Error creating context rule",
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  },

  update: async (
    id: string,
    rule: ContextRuleUpdateInput,
  ): Promise<ContextRule> => {
    try {
      const response = await api.put(`/context-rules/${id}`, rule);
      return response.data;
    } catch (error) {
      logger.error(
        `Error updating context rule ${id}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/context-rules/${id}`);
      return true;
    } catch (error) {
      logger.error(
        `Error deleting context rule ${id}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  },

  testRule: async (
    ruleId: string,
    query: string,
  ): Promise<ContextRuleTestResult> => {
    try {
      const response = await api.post(`/context-rules/${ruleId}/test`, {
        query,
      });
      return response.data;
    } catch (error) {
      logger.error(
        `Error testing context rule ${ruleId}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  },
};

// Chat API
export const chatApi = {
  sendMessage: async (message: string, contextRuleId?: string) => {
    try {
      const response = await api.post("/chat/message", {
        message,
        contextRuleId,
      });
      return response.data;
    } catch (error) {
      logger.error(
        "Error sending chat message",
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  },

  getHistory: async () => {
    try {
      const response = await api.get("/chat/history");
      return response.data;
    } catch (error) {
      logger.error(
        "Error fetching chat history",
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  },

  // Delete chat history
  deleteChatHistory: async () => {
    try {
      await api.delete("/chat/history");
      return { success: true };
    } catch (error) {
      logger.error(
        "Error deleting chat history",
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  },

  // Get chat history for a specific context
  getContextHistory: async (contextRuleId: string) => {
    try {
      const response = await api.get(`/chat/history/${contextRuleId}`);
      return response.data;
    } catch (error) {
      logger.error(
        `Error fetching chat history for context ${contextRuleId}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  },
};

// Widget Configuration API
export const widgetConfigApi = {
  getAll: async () => {
    try {
      const response = await api.get("/widget-configs");
      return response.data;
    } catch (error) {
      logger.error(
        "Error fetching widget configurations",
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  },

  getByUserId: async (userId: string) => {
    try {
      const response = await api.get(`/widget-configs/user/${userId}`);
      return response.data;
    } catch (error) {
      logger.error(
        `Error fetching widget configuration for user ${userId}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await api.get(`/widget-configs/${id}`);
      return response.data;
    } catch (error) {
      logger.error(
        `Error fetching widget configuration with id ${id}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  },

  create: async (config: any) => {
    try {
      const response = await api.post("/widget-configs", config);
      return response.data;
    } catch (error) {
      logger.error(
        "Error creating widget configuration",
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  },

  update: async (id: string, config: any) => {
    try {
      const response = await api.put(`/widget-configs/${id}`, config);
      return response.data;
    } catch (error) {
      logger.error(
        `Error updating widget configuration with id ${id}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      await api.delete(`/widget-configs/${id}`);
      return true;
    } catch (error) {
      logger.error(
        `Error deleting widget configuration with id ${id}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  },
};

// System Settings API
export const systemSettingsApi = {
  getSettings: async (category: string, environment = "production") => {
    try {
      const response = await api.get(
        `/system-settings/${category}?environment=${environment}`,
      );
      return response.data;
    } catch (error) {
      logger.error(
        `Error fetching system settings for category ${category} and environment ${environment}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  },

  saveSettings: async (
    category: string,
    settings: any,
    environment = "production",
  ) => {
    try {
      const response = await api.post(`/system-settings/${category}`, {
        settings,
        environment,
      });
      return response.data;
    } catch (error) {
      logger.error(
        `Error saving system settings for category ${category} and environment ${environment}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  },
};

// Prompt Templates API
export const promptTemplatesApi = {
  getAll: async (): Promise<PromptTemplate[]> => {
    try {
      const response = await api.get("/prompt-templates");
      return response.data;
    } catch (error) {
      logger.error(
        "Error fetching prompt templates",
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  },

  getById: async (id: string): Promise<PromptTemplate> => {
    try {
      const response = await api.get(`/prompt-templates/${id}`);
      return response.data;
    } catch (error) {
      logger.error(
        `Error fetching prompt template ${id}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  },

  create: async (
    template: Partial<PromptTemplate>,
  ): Promise<PromptTemplate> => {
    try {
      const response = await api.post("/prompt-templates", template);
      return response.data;
    } catch (error) {
      logger.error(
        "Error creating prompt template",
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  },

  update: async (
    id: string,
    template: Partial<PromptTemplate>,
  ): Promise<PromptTemplate> => {
    try {
      const response = await api.put(`/prompt-templates/${id}`, template);
      return response.data;
    } catch (error) {
      logger.error(
        `Error updating prompt template ${id}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/prompt-templates/${id}`);
      return true;
    } catch (error) {
      logger.error(
        `Error deleting prompt template ${id}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  },
};

export default {
  contextRulesApi,
  chatApi,
  widgetConfigApi,
  systemSettingsApi,
  promptTemplatesApi,
};
