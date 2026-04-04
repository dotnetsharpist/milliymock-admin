/**
 * Centralized API Client
 * Handles all HTTP requests with authentication and response unwrapping
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.example.com';

/**
 * API Response wrapper type
 */
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/**
 * Get the authentication token from localStorage
 * @returns The bearer token
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

/**
 * Centralized request wrapper
 * @param endpoint - API endpoint (relative to BASE_URL)
 * @param options - Fetch options
 * @returns Unwrapped response data
 */
export const request = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = getAuthToken();

  const config: RequestInit = {
    ...options,
    headers: {
      ...options.headers,
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  };

  // Only add Content-Type for JSON requests (not for FormData)
  if (options.body && !(options.body instanceof FormData)) {
    config.headers = {
      ...config.headers,
      'Content-Type': 'application/json',
    };
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    // Parse JSON response
    const json: ApiResponse<T> = await response.json();

    // Check if the API-level response is successful (code === 200)
    if (json.code !== 200) {
      throw new Error(json.message || 'API request failed');
    }

    // Return unwrapped data
    return json.data;
  } catch (error) {
    // Re-throw with more context
    throw new Error(error instanceof Error ? error.message : 'Network request failed');
  }
};

/**
 * Helper to build query parameters
 * @param params - Query parameters
 * @returns Query string
 */
export const buildQueryString = (params: Record<string, any>): string => {
  const filtered = Object.entries(params).filter(([_, value]) => value !== undefined && value !== null);
  if (filtered.length === 0) return '';
  return '?' + new URLSearchParams(filtered).toString();
};
