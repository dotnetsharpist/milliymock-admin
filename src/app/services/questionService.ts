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
        console.log(data);
        const formData = new FormData();

        // Required fields - match API contract with PascalCase
        formData.append("TestId", data.TestId.toString());
        formData.append("Order", data.Order.toString());
        formData.append("Score", data.Score.toString().replace(",", "."));
        formData.append("Type", data.Type.toString());

        // Optional fields
        if (data.Text) {
            formData.append("Text", data.Text);
        }

        if (data.Image) {
            formData.append("Image", data.Image);
        }

        if (data.CorrectAnswer) {
            formData.append("CorrectAnswer", data.CorrectAnswer);
        }
        if (data.QuestionGroupId) {
            formData.append("QuestionGroupId", data.QuestionGroupId.toString());
        }

        if (data.Options) {
            data.Options.forEach((opt, index) => {
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
        formData.append("TestId", data.TestId.toString());
        if (data.Order !== undefined) {
            formData.append("Order", data.Order.toString());
        }

        formData.append("Score", data.Score.toString()); // Default score
        formData.append("Type", data.Type);

        formData.append("TestId", data.TestId.toString());


        // Optional fields
        if (data.Text !== undefined) {
            formData.append("Text", data.Text);
        }

        if (data.Image) {
            formData.append("Image", data.Image);
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

        console.log(data)

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
        console.log(formData)

        return await apiService.upload<QuestionGroupQuestionCreate>(API_ENDPOINTS.STANDALONE_QUESTIONS, formData);
    }
};

export default questionService;
