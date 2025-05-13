import { useState, useCallback } from "react";
import { api } from "@/services/api/middleware/apiMiddleware";
import logger from "@/utils/logger";

interface ApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

interface ApiHook<T, P> extends ApiState<T> {
  execute: (params?: P) => Promise<T | null>;
  reset: () => void;
}

/**
 * Custom hook for making API requests with standardized error handling and loading states
 * @param endpoint API endpoint path
 * @param method HTTP method to use
 * @param initialData Optional initial data
 * @returns API hook with execute function, data, loading state, and error handling
 */
function useApi<T = any, P = any>(
  endpoint: string,
  method: "get" | "post" | "put" | "patch" | "delete" = "get",
  initialData: T | null = null,
): ApiHook<T, P> {
  const [state, setState] = useState<ApiState<T>>({
    data: initialData,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(
    async (params?: P): Promise<T | null> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        let response;

        switch (method) {
          case "get":
            response = await api.get<T>(endpoint, { params });
            break;
          case "post":
            response = await api.post<T>(endpoint, params);
            break;
          case "put":
            response = await api.put<T>(endpoint, params);
            break;
          case "patch":
            response = await api.patch<T>(endpoint, params);
            break;
          case "delete":
            response = await api.delete<T>(endpoint, { params });
            break;
          default:
            throw new Error(`Unsupported method: ${method}`);
        }

        // Check if response has the expected structure
        if (response && response.data) {
          setState({
            data: response.data.data || response.data,
            isLoading: false,
            error: null,
          });

          return response.data.data || response.data;
        } else {
          throw new Error("Invalid API response format");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred";
        const apiError = new Error(errorMessage);

        setState({
          data: null,
          isLoading: false,
          error: apiError,
        });

        logger.error(
          `API Error (${method.toUpperCase()} ${endpoint}):`,
          error instanceof Error ? error : new Error(String(error)),
        );
        return null;
      }
    },
    [endpoint, method],
  );

  const reset = useCallback(() => {
    setState({
      data: initialData,
      isLoading: false,
      error: null,
    });
  }, [initialData]);

  return {
    ...state,
    execute,
    reset,
  };
}

export default useApi;
