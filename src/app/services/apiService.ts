import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { BASE_URL, STORAGE_KEYS } from "../config/api";

/**
 * API Service
 * Centralized service for all HTTP requests with automatic token handling
 */

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor - automatically attach auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle common errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

/**
 * Backend API Response wrapper
 * All API responses follow this structure
 */
export interface BackendResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

/**
 * API Response wrapper (internal)
 */
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

/**
 * Error handler - converts axios errors to user-friendly messages
 */
const handleError = (error: any): string => {
  if (axios.isAxiosError(error)) {
    // Server responded with error
    if (error.response) {
      // Check if response follows backend format { code, message, data }
      const backendResponse = error.response.data as BackendResponse;
      if (backendResponse?.message) {
        return backendResponse.message;
      }

      // Fallback to other error formats
      const message = error.response.data?.error;
      return message || `Server error: ${error.response.status}`;
    }

    // Request was made but no response
    if (error.request) {
      return "Network error. Please check your connection.";
    }
  }

  // Something else happened
  return error.message || "An unexpected error occurred";
};

/**
 * Unwrap backend response
 * Checks code === 200 and extracts data
 */
const unwrapResponse = <T>(response: AxiosResponse<BackendResponse<T>>): ApiResponse<T> => {
  const { code, message, data } = response.data;

  // Success: code === 200
  if (code === 200) {
    return {
      data,
      success: true,
    };
  }

  // Error: code !== 200
  return {
    error: message || "Request failed",
    success: false,
  };
};

/**
 * Generic API methods
 */
export const apiService = {
  /**
   * GET request
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<BackendResponse<T>> = await apiClient.get(url, config);
      return unwrapResponse(response);
    } catch (error) {
      return {
        error: handleError(error),
        success: false,
      };
    }
  },

  /**
   * POST request
   */
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<BackendResponse<T>> = await apiClient.post(url, data, config);
      return unwrapResponse(response);
    } catch (error) {
      return {
        error: handleError(error),
        success: false,
      };
    }
  },

  /**
   * PUT request
   */
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<BackendResponse<T>> = await apiClient.put(url, data, config);
      return unwrapResponse(response);
    } catch (error) {
      return {
        error: handleError(error),
        success: false,
      };
    }
  },

  /**
   * DELETE request
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<BackendResponse<T>> = await apiClient.delete(url, config);
      return unwrapResponse(response);
    } catch (error) {
      return {
        error: handleError(error),
        success: false,
      };
    }
  },

  /**
   * Upload file with multipart/form-data (POST)
   */
  async upload<T>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<BackendResponse<T>> = await apiClient.post(url, formData, {
        ...config,
        headers: {
          "Content-Type": "multipart/form-data",
          ...config?.headers,
        },
      });
      return unwrapResponse(response);
    } catch (error) {
      return {
        error: handleError(error),
        success: false,
      };
    }
  },

  /**
   * Upload file with multipart/form-data (PUT)
   */
  async uploadPut<T>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<BackendResponse<T>> = await apiClient.put(url, formData, {
        ...config,
        headers: {
          "Content-Type": "multipart/form-data",
          ...config?.headers,
        },
      });
      return unwrapResponse(response);
    } catch (error) {
      return {
        error: handleError(error),
        success: false,
      };
    }
  },
};

export default apiService;
