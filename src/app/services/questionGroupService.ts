import {apiService, ApiResponse} from "./apiService";
import {API_ENDPOINTS} from "../config/api";
import {Question, Option} from "../data/mockData";
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
        const formData = new FormData();
        formData.append("testId", data.testId);
        formData.append("TitleUz", data.textUz);
        formData.append("TitleRu", data.textRu);
        formData.append("ImageUz", data.imageUz);
        formData.append("ImageRu", data.imageRu);

        return await apiService.upload<QuestionGroup>(
            API_ENDPOINTS.QUESTION_GROUPS,
            formData
        );

    },


    /**
     * Delete group question
     */
    async deleteGroupQuestion(id: string): Promise<ApiResponse<void>> {
        return await apiService.delete<void>(API_ENDPOINTS.STANDALONE_QUESTION_BY_ID(id));
    },

    /**
     * Delete question group
     */
    async deleteQuestionGroup(id: string): Promise<ApiResponse<void>> {
        return await apiService.delete<void>(API_ENDPOINTS.QUESTION_GROUP_BY_ID(id));
    },


};

export default questionGroupService;
