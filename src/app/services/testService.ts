import { apiService, ApiResponse } from "./apiService";
import { API_ENDPOINTS } from "../config/api";
import { Test } from "../data/mockData";

/**
 * Test Service
 * Handles all test-related API calls
 */

export interface CreateTestData {
  title: string;
  description: string | null;
}

export interface UpdateTestData {
  title: string;
  description: string | null;
}

export const testService = {
  /**
   * Get all tests
   */
  async getTests(): Promise<ApiResponse<Test[]>> {
    return await apiService.get<Test[]>(API_ENDPOINTS.TESTS);
  },

  /**
   * Get test by ID
   */
  async getTestById(id: string): Promise<ApiResponse<Test>> {
    return await apiService.get<Test>(API_ENDPOINTS.GET_TEST_BY_ID(id));
  },

  /**
   * Create new test
   */
  async createTest(data: CreateTestData): Promise<ApiResponse<Test>> {
    return await apiService.post<Test>(API_ENDPOINTS.TESTS, data);
  },

  /**
   * Update test
   */
  async updateTest(id: string, data: UpdateTestData): Promise<ApiResponse<Test>> {
    return await apiService.put<Test>(API_ENDPOINTS.TEST_BY_ID(id), data);
  },

  /**
   * Delete test
   */
  async deleteTest(id: string): Promise<ApiResponse<void>> {
    return await apiService.delete<void>(API_ENDPOINTS.TEST_BY_ID(id));
  },
};

export default testService;
