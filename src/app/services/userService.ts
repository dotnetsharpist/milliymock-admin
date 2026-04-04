import { apiService, ApiResponse } from "./apiService";
import { API_ENDPOINTS } from "../config/api";
import { User } from "../data/mockData";

/**
 * User Service
 * Handles all user-related API calls
 */

export interface CreateUserData {
  email: string;
  name: string;
  password: string;
  role: string;
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  role?: string;
  password?: string;
}

export const userService = {
  /**
   * Get all users
   */
  async getUsers(): Promise<ApiResponse<User[]>> {
    return await apiService.get<User[]>(API_ENDPOINTS.USERS);
  },

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<ApiResponse<User>> {
    return await apiService.get<User>(API_ENDPOINTS.USER_BY_ID(id));
  },

  /**
   * Create new user
   */
  async createUser(data: CreateUserData): Promise<ApiResponse<User>> {
    return await apiService.post<User>(API_ENDPOINTS.USERS, data);
  },

  /**
   * Update user
   */
  async updateUser(id: string, data: UpdateUserData): Promise<ApiResponse<User>> {
    return await apiService.put<User>(API_ENDPOINTS.USER_BY_ID(id), data);
  },

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return await apiService.delete<void>(API_ENDPOINTS.USER_BY_ID(id));
  },
};

export default userService;
