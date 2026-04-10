import {apiService, ApiResponse} from "./apiService";
import {API_ENDPOINTS} from "../config/api";
import {StandaloneQuestion} from "../data/mockData";
import {Question, QuestionFormData} from "../models/questions";
import {QuestionGroupQuestionCreate} from "../models/questionGroups";


export const questionService = {
    /**
     * Get all standalone questions
     */
    async getQuestions(): Promise<ApiResponse<Question[]>> {
        return await apiService.get<Question[]>(API_ENDPOINTS.STANDALONE_QUESTIONS);
    },

    /**
     * Get standalone questions by test ID
     */
    async getQuestionsByTestId(testId: string): Promise<ApiResponse<Question[]>> {
        return await apiService.get<Question[]>(
            API_ENDPOINTS.STANDALONE_QUESTIONS_BY_TEST(testId)
        );
    },

    /**
     * Create standalone question (with optional image upload)
     */
    async createQuestion(data: QuestionFormData): Promise<ApiResponse<Question>> {
        const formData = new FormData();

        // Required fields - match API contract with PascalCase
        formData.append("TestId", data.testId.toString());
        formData.append("Order", data.order.toString());
        formData.append("Score", data.score.toString().replace(",", "."));
        formData.append("Type", data.type.toString());

        // Optional fields
        if (data.textUz) {
            formData.append("TextUz", data.textUz);
        }
        if (data.textRu) {
            formData.append("TextRu", data.textRu);
        }

        if (data.imageUz) {
            formData.append("ImageUz", data.imageUz);
        }

        if (data.imageRu) {
            formData.append("ImageRu", data.imageRu);
        }

        if (data.correctAnswer) {
            formData.append("CorrectAnswer", data.correctAnswer);
        }
        if (data.questionGroupId) {
            formData.append("QuestionGroupId", data.questionGroupId.toString());
        }

        if (data.options) {
            data.options.forEach((opt, index) => {
                formData.append(`Options[${index}].Text`, opt.text);
                formData.append(`Options[${index}].IsCorrect`, opt.isCorrect.toString());
            });
        }

        // Always use FormData for consistency with API contract
        return await apiService.upload<Question>(
            API_ENDPOINTS.STANDALONE_QUESTIONS,
            formData
        );
    },

    /**
     * Update standalone question
     */
    async updateQuestion(
        id: string,
        data: QuestionFormData
    ): Promise<ApiResponse<Question>> {
        const formData = new FormData();

        // Required fields with PascalCase to match API contract// formData.append("TestId", data.testId);
        formData.append("TestId", data.testId.toString());
        if (data.order !== undefined) {
            formData.append("Order", data.order.toString());
        }

        formData.append("Score", data.score.toString()); // Default score
        formData.append("Type", data.type);

        formData.append("TestId", data.testId.toString());


        // Optional fields
        if (data.textUz !== undefined) {
            formData.append("TextUz", data.textUz);
        }
        if (data.textRu !== undefined) {
            formData.append("TextRu", data.textRu);
        }

        if (data.imageUz) {
            formData.append("ImageUz", data.imageUz);
        }
        if (data.imageRu) {
            formData.append("ImageRu", data.imageRu);
        }

        // Use uploadPut for PUT request (multipart/form-data)
        return await apiService.uploadPut<Question>(
            API_ENDPOINTS.STANDALONE_QUESTION_BY_ID(id),
            formData
        );
    },

    async deleteQuestion(id: string): Promise<ApiResponse<void>> {
        return await apiService.delete<void>(API_ENDPOINTS.STANDALONE_QUESTION_BY_ID(id));
    },

    async createQuestionGroupQuestion(data: QuestionGroupQuestionCreate): Promise<ApiResponse<QuestionGroupQuestionCreate>> {
        const formData = new FormData();


        formData.append("Order", data.order.toString());
        formData.append("Score", data.score.toString().replace(",", "."));
        formData.append("Type", data.type.toString());

        formData.append("Text", data.text);

        if (data.correctAnswer) {
            formData.append("CorrectAnswer", data.correctAnswer);
        }
        if (data.questionGroupId) {
            formData.append("QuestionGroupId", data.questionGroupId.toString());
        }

        return await apiService.upload<QuestionGroupQuestionCreate>(API_ENDPOINTS.STANDALONE_QUESTIONS, formData);
    }
};

export default questionService;
