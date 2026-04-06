import {apiService, ApiResponse} from "./apiService";
import {API_ENDPOINTS} from "../config/api";
import {StandaloneOption} from "../data/mockData";
import {CreateOptionForQuestionGroupData} from "../models/options";

/**
 * Standalone Option Service
 * Handles all standalone option-related API calls (Options that belong to standalone questions)
 *
 * DATA FLOW:
 * - questionId is used ONLY as query parameter in GET requests
 * - StandaloneOption response does NOT include questionId
 * - API returns: { id, text, isCorrect } only
 */

/**
 * CREATE OPTION DATA (WRITE MODEL)
 * Used when creating a new standalone option
 */
export interface CreateStandaloneOptionData {
    questionId: string;
    text: string;
    isCorrect: boolean;
}

/**
 * UPDATE OPTION DATA (WRITE MODEL)
 * Used when updating an existing standalone option
 */
export interface UpdateStandaloneOptionData {
    text?: string;
    isCorrect?: boolean;
}

export const optionService = {
    /**
     * Get options by question ID
     *
     * @param questionId - Used only as query parameter
     * @returns StandaloneOption[] - Response does NOT include questionId field
     *
     * Response structure:
     * {
     *   code: number,
     *   message: string,
     *   data: [{ id, text, isCorrect }]
     * }
     */
    async getOptionsByQuestionId(questionId: string): Promise<ApiResponse<StandaloneOption[]>> {
        return await apiService.get<StandaloneOption[]>(
            API_ENDPOINTS.STANDALONE_OPTIONS_BY_QUESTION(questionId)
        );
    },

    /**
     * Create option for standalone question (JSON)
     */
    async createOption(data: CreateStandaloneOptionData): Promise<ApiResponse<StandaloneOption>> {
        // Convert to match API contract with proper field names
        const payload = {
            questionId: data.questionId,
            questionGroupId: null,
            text: data.text,
            isCorrect: data.isCorrect,
        };
        return await apiService.post<StandaloneOption>(API_ENDPOINTS.STANDALONE_OPTIONS, payload);
    },

    /**
     * Update option (JSON)
     */
    async updateOption(
        id: string,
        data: UpdateStandaloneOptionData
    ): Promise<ApiResponse<StandaloneOption>> {
        // Convert to match API contract
        const payload = {
            text: data.text,
            isCorrect: data.isCorrect,
        };
        return await apiService.put<StandaloneOption>(
            API_ENDPOINTS.STANDALONE_OPTION_BY_ID(id),
            payload
        );
    },


    /**
     * Delete option
     */
    async deleteOption(id: string): Promise<ApiResponse<void>> {
        return await apiService.delete<void>(API_ENDPOINTS.STANDALONE_OPTION_BY_ID(id));
    },

    async createOptionForQuestionGroup(data: CreateOptionForQuestionGroupData): Promise<ApiResponse<CreateOptionForQuestionGroupData>> {
        // Convert to match API contract with proper field names
        const payload = {
            QuestionGroupId: data.questionGroupId,
            Text: data.text
        };
        return await apiService.post<CreateOptionForQuestionGroupData>(API_ENDPOINTS.STANDALONE_OPTIONS, payload);
    },

};

export default optionService;
