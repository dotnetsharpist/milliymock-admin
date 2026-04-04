import { useState, useCallback } from "react";
import { ApiResponse } from "../services/apiService";

/**
 * Custom hook for managing API call states
 * Provides loading, error, and success states for any API call
 */

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useApi<T = any>(options?: UseApiOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(
    async (apiCall: () => Promise<ApiResponse<T>>) => {
      setLoading(true);
      setError(null);

      const response = await apiCall();

      if (response.success && response.data) {
        setData(response.data);
        options?.onSuccess?.(response.data);
      } else if (response.error) {
        setError(response.error);
        options?.onError?.(response.error);
      }

      setLoading(false);
      return response;
    },
    [options]
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    reset,
  };
}

/**
 * Custom hook specifically for mutations (create, update, delete)
 */
export function useMutation<T = any>(options?: UseApiOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (apiCall: () => Promise<ApiResponse<T>>) => {
      setLoading(true);
      setError(null);

      const response = await apiCall();

      if (response.success) {
        options?.onSuccess?.(response.data);
      } else if (response.error) {
        setError(response.error);
        options?.onError?.(response.error);
      }

      setLoading(false);
      return response;
    },
    [options]
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return {
    loading,
    error,
    mutate,
    reset,
  };
}
