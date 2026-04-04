import { apiService, ApiResponse } from "./apiService";
import { API_ENDPOINTS } from "../config/api";
import { StandaloneQuestion } from "../data/mockData";

/**
 * Standalone Question Service
 * Handles all standalone question-related API calls (Questions that belong directly to Tests)
 */

/**
 * CREATE QUESTION DATA (WRITE MODEL)
 * Used when creating a new standalone question
 */
export interface CreateStandaloneQuestionData {
  testId: string;
  text: string;
  type: "MultipleChoice" | "FreeAnswer";
  order: number;
  image?: File; // Image file for upload (WRITE only)
}

/**
 * UPDATE QUESTION DATA (WRITE MODEL)
 * Used when updating an existing standalone question
 */
export interface UpdateStandaloneQuestionData {
  testId?: string;
  text?: string;
  type?: "MultipleChoice" | "FreeAnswer";
  order?: number;
  image?: File; // Image file for upload (WRITE only)
}

export const standaloneQuestionService = {
  /**
   * Get all standalone questions
   */
  async getQuestions(): Promise<ApiResponse<StandaloneQuestion[]>> {
    return await apiService.get<StandaloneQuestion[]>(API_ENDPOINTS.STANDALONE_QUESTIONS);
  },

  /**
   * Get standalone question by ID
   */
  async getQuestionById(id: string): Promise<ApiResponse<StandaloneQuestion>> {
    return await apiService.get<StandaloneQuestion>(API_ENDPOINTS.STANDALONE_QUESTION_BY_ID(id));
  },

  /**
   * Get standalone questions by test ID
   */
  async getQuestionsByTestId(testId: string): Promise<ApiResponse<StandaloneQuestion[]>> {
    return await apiService.get<StandaloneQuestion[]>(
      API_ENDPOINTS.STANDALONE_QUESTIONS_BY_TEST(testId)
    );
  },

  /**
   * Create standalone question (with optional image upload)
   */
  async createQuestion(data: CreateStandaloneQuestionData): Promise<ApiResponse<StandaloneQuestion>> {
    const formData = new FormData();

    // Required fields - match API contract with PascalCase
    formData.append("TestId", data.testId);
    formData.append("Order", data.order.toString());
    formData.append("Score", "10"); // Default score, adjust as needed
    formData.append("Type", data.type);

    // Optional fields
    if (data.text) {
      formData.append("Text", data.text);
    }

    if (data.image) {
      formData.append("Image", data.image);
    }

    // Always use FormData for consistency with API contract
    return await apiService.upload<StandaloneQuestion>(
      API_ENDPOINTS.STANDALONE_QUESTIONS,
      formData
    );
  },

  /**
   * Update standalone question
   */
  async updateQuestion(
    id: string,
    data: UpdateStandaloneQuestionData
  ): Promise<ApiResponse<StandaloneQuestion>> {
    const formData = new FormData();

    // Required fields with PascalCase to match API contract
    if (data.order !== undefined) {
      formData.append("Order", data.order.toString());
    } else {
      formData.append("Order", "1"); // Default order
    }

    formData.append("Score", "10"); // Default score

    if (data.type) {
      formData.append("Type", data.type);
    } else {
      formData.append("Type", "MultipleChoice"); // Default type
    }

    if (data.testId) {
      formData.append("TestId", data.testId);
    }

    // Optional fields
    if (data.text !== undefined) {
      formData.append("Text", data.text);
    }

    if (data.image) {
      formData.append("Image", data.image);
    }

    // Use uploadPut for PUT request (multipart/form-data)
    return await apiService.uploadPut<StandaloneQuestion>(
      API_ENDPOINTS.STANDALONE_QUESTION_BY_ID(id),
      formData
    );
  },

  /**
   * Delete standalone question
   */
  async deleteQuestion(id: string): Promise<ApiResponse<void>> {
    return await apiService.delete<void>(API_ENDPOINTS.STANDALONE_QUESTION_BY_ID(id));
  },
};

export default standaloneQuestionService;
