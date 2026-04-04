import { apiService, ApiResponse } from "./apiService";
import { API_ENDPOINTS, STORAGE_KEYS } from "../config/api";

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: {
    fullName: string;
    email: string;
    emailConfirmed: boolean;
    role: "SuperAdmin" | "Admin" | "User";
  };
}

export const authService = {
  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    // Create FormData for multipart/form-data request
    const formData = new FormData();
    formData.append("Email", credentials.email);
    formData.append("Password", credentials.password);

    const response = await apiService.upload<AuthResponse>(
      API_ENDPOINTS.LOGIN,
      formData
    );

    // Check role-based access control
    if (response.success && response.data) {
      const { role } = response.data.user;

      // Only allow Admin and SuperAdmin
      if (role === "User") {
        return {
          error: "Access denied. Admins only.",
          success: false,
        };
      }

      // Store token and user in localStorage
      localStorage.setItem(STORAGE_KEYS.TOKEN, response.data.token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data.user));
    }

    return response;
  },

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
    const response = await apiService.post<AuthResponse>(
      API_ENDPOINTS.REGISTER,
      data
    );

    // Store token in localStorage if registration successful
    if (response.success && response.data) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, response.data.token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data.user));
    }

    return response;
  },

  /**
   * Logout user
   */
  async logout(): Promise<ApiResponse<void>> {
    const response = await apiService.post<void>(API_ENDPOINTS.LOGOUT);
    
    // Clear local storage regardless of API response
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);

    return response;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem(STORAGE_KEYS.TOKEN);
  },

  /**
   * Get current user from localStorage
   */
  getCurrentUser(): AuthResponse["user"] | null {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  /**
   * Get auth token
   */
  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  },
};

export default authService;
