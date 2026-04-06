import { apiService, ApiResponse } from "./apiService";
import { API_ENDPOINTS } from "../config/api";
import { Question, Option } from "../data/mockData";
import {
    QuestionGroup,
    QuestionGroupDetailModel,
    QuestionGroupFormData
} from "../models/questionGroups"

/**
 * Question Group Service
 * Handles all question group-related API calls (Groups with shared options)
 */

/**
 * CREATE QUESTION GROUP DATA (WRITE MODEL)
 * Used when creating a new question group
 */
export interface CreateQuestionGroupData {
  testId: string;
  title: string;
  image?: File; // Image file for upload (WRITE only)
}

/**
 * UPDATE QUESTION GROUP DATA (WRITE MODEL)
 * Used when updating an existing question group
 */
export interface UpdateQuestionGroupData {
  title?: string;
  image?: File; // Image file for upload (WRITE only)
}

export interface CreateGroupQuestionData {
  questionGroupId: string;
  text: string;
  type: "Matching" | "FreeAnswer";
  order: number;
  correctOptionId?: string; // For matching type
}

export interface UpdateGroupQuestionData {
  text?: string;
  type?: "Matching" | "FreeAnswer";
  order?: number;
  correctOptionId?: string;
}

export interface CreateGroupOptionData {
  questionGroupId: string;
  text: string;
}

export interface UpdateGroupOptionData {
  text?: string;
}

export const questionGroupService = {
  // ============= QUESTION GROUPS =============

    async getQuestionGroupById(groupId: string): Promise<ApiResponse<QuestionGroupDetailModel>> {
        return await apiService.get<QuestionGroupDetailModel[]>(
            API_ENDPOINTS.QUESTION_GROUP_BY_ID(groupId)
        );
    },

  /**
   * Get question groups by test ID
   */
  async getQuestionGroupsByTestId(testId: string): Promise<ApiResponse<QuestionGroup[]>> {
    return await apiService.get<QuestionGroup[]>(
      API_ENDPOINTS.QUESTION_GROUPS_BY_TEST(testId)
    );
  },

  /**
   * Create question group (with optional image upload)
   */
  async createQuestionGroup(data: QuestionGroupFormData): Promise<ApiResponse<QuestionGroup>> {
    // If image is provided, use multipart/form-data
    if (data.image) {
      const formData = new FormData();
      formData.append("testId", data.testId);
      formData.append("title", data.title);
      formData.append("image", data.image);

      return await apiService.upload<QuestionGroup>(
        API_ENDPOINTS.QUESTION_GROUPS,
        formData
      );
    }

    // Otherwise, use regular JSON
    const { image, ...jsonData } = data;
    return await apiService.post<QuestionGroup>(API_ENDPOINTS.QUESTION_GROUPS, jsonData);
  },


  /**
   * Delete question group
   */
  async deleteQuestionGroup(id: string): Promise<ApiResponse<void>> {
    return await apiService.delete<void>(API_ENDPOINTS.QUESTION_GROUP_BY_ID(id));
  },

  // ============= GROUP QUESTIONS =============

  /**
   * Get questions by group ID
   */
  async getQuestionsByGroupId(groupId: string): Promise<ApiResponse<Question[]>> {
    return await apiService.get<Question[]>(
      API_ENDPOINTS.GROUP_QUESTIONS_BY_GROUP(groupId)
    );
  },

  /**
   * Create question in group
   */
  async createGroupQuestion(data: CreateGroupQuestionData): Promise<ApiResponse<Question>> {
    return await apiService.post<Question>(API_ENDPOINTS.GROUP_QUESTIONS, data);
  },

  /**
   * Update group question
   */
  async updateGroupQuestion(
    id: string,
    data: UpdateGroupQuestionData
  ): Promise<ApiResponse<Question>> {
    return await apiService.put<Question>(API_ENDPOINTS.GROUP_QUESTION_BY_ID(id), data);
  },

  /**
   * Delete group question
   */
  async deleteGroupQuestion(id: string): Promise<ApiResponse<void>> {
    return await apiService.delete<void>(API_ENDPOINTS.GROUP_QUESTION_BY_ID(id));
  },

  // ============= GROUP OPTIONS (SHARED) =============

  /**
   * Get options by group ID (shared options for all questions in the group)
   */
  async getOptionsByGroupId(groupId: string): Promise<ApiResponse<Option[]>> {
    return await apiService.get<Option[]>(API_ENDPOINTS.GROUP_OPTIONS_BY_GROUP(groupId));
  },

  /**
   * Create option for group
   */
  async createGroupOption(data: CreateGroupOptionData): Promise<ApiResponse<Option>> {
    return await apiService.post<Option>(API_ENDPOINTS.GROUP_OPTIONS, data);
  },

  /**
   * Update group option
   */
  async updateGroupOption(id: string, data: UpdateGroupOptionData): Promise<ApiResponse<Option>> {
    return await apiService.put<Option>(API_ENDPOINTS.GROUP_OPTION_BY_ID(id), data);
  },

  /**
   * Delete group option
   */
  async deleteGroupOption(id: string): Promise<ApiResponse<void>> {
    return await apiService.delete<void>(API_ENDPOINTS.GROUP_OPTION_BY_ID(id));
  },
};

export default questionGroupService;
