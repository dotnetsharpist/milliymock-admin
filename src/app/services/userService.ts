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

/**
 * Raw user object as returned by the backend (UserResultDto).
 * Fields are camelCase; `role` is serialized as a string enum
 * ("SuperAdmin" | "Admin" | "User"). Extra fallbacks keep the UI resilient
 * if a field name varies.
 */
interface RawUser {
  id?: string | number;
  firstName?: string;
  lastName?: string;
  fatherName?: string;
  fullName?: string;
  name?: string;
  userName?: string;
  email?: string;
  emailConfirmed?: boolean;
  role?: string;
  roles?: string[];
  createdAt?: string;
  createdDate?: string;
  registeredAt?: string;
  dateCreated?: string;
}

/**
 * Normalize a raw backend user into the shape the UI expects.
 */
const normalizeUser = (u: RawUser): User => {
  const composedName = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return {
    id: String(u.id ?? ""),
    name:
      u.fullName ||
      composedName ||
      u.name ||
      u.userName ||
      (u.email ? u.email.split("@")[0] : "—"),
    email: u.email || "—",
    role: u.role || u.roles?.[0] || "User",
    createdAt:
      u.createdAt || u.createdDate || u.registeredAt || u.dateCreated || "",
    emailConfirmed: u.emailConfirmed,
  };
};

/**
 * Extract the user array from a response that may be a plain array or a
 * paginated wrapper ({ items | users | results | data: [...] }).
 */
const extractList = (raw: any): RawUser[] => {
  if (Array.isArray(raw)) return raw;
  return raw?.items ?? raw?.users ?? raw?.results ?? raw?.data ?? [];
};

export const userService = {
  /**
   * Get all users
   */
  async getUsers(): Promise<ApiResponse<User[]>> {
    const response = await apiService.get<any>(API_ENDPOINTS.USERS_ALL);
    if (!response.success) {
      return { success: false, error: response.error };
    }
    return {
      success: true,
      data: extractList(response.data).map(normalizeUser),
    };
  },

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<ApiResponse<User>> {
    const response = await apiService.get<RawUser>(API_ENDPOINTS.USER_BY_ID(id));
    if (!response.success || !response.data) {
      return { success: response.success, error: response.error };
    }
    return { success: true, data: normalizeUser(response.data) };
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
