import {apiService, ApiResponse} from "./apiService";
import {API_ENDPOINTS} from "../config/api";
import {StandaloneQuestion} from "../data/mockData";
import {Question, QuestionFormData} from "../models/questions";
import {QuestionGroupQuestionCreate} from "../models/questionGroups";
import {normalizeMathLatexForBackend} from "../lib/math";

const appendExplanationFields = (
    formData: FormData,
    explanation: QuestionFormData["explanation"] | QuestionGroupQuestionCreate["explanation"]
) => {
    if (!explanation) return;

    const hasExplanation =
        Boolean(explanation.textUz?.trim()) ||
        Boolean(explanation.textRu?.trim()) ||
        Boolean(explanation.videoLink?.trim()) ||
        explanation.questionId !== undefined;

    if (!hasExplanation) return;

    formData.append(
        "Explanation.TextUz",
        normalizeMathLatexForBackend(explanation.textUz)
    );
    formData.append(
        "Explanation.TextRu",
        normalizeMathLatexForBackend(explanation.textRu)
    );
    formData.append("Explanation.VideoLink", explanation.videoLink ?? "");
    formData.append(
        "Explanation.QuestionId",
        explanation.questionId?.toString() ?? "0"
    );
};

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
            formData.append("TextUz", normalizeMathLatexForBackend(data.textUz));
        }
        if (data.textRu) {
            formData.append("TextRu", normalizeMathLatexForBackend(data.textRu));
        }

        if (data.imageUz) {
            formData.append("ImageUz", data.imageUz);
        }

        if (data.imageRu) {
            formData.append("ImageRu", data.imageRu);
        }

        if (data.correctAnswer) {
            formData.append(
                "CorrectAnswer",
                normalizeMathLatexForBackend(data.correctAnswer)
            );
        }
        if (data.questionGroupId) {
            formData.append("QuestionGroupId", data.questionGroupId.toString());
        }

        appendExplanationFields(formData, data.explanation);

        if (data.options) {
            data.options.forEach((opt, index) => {
                formData.append(
                    `Options[${index}].Text`,
                    normalizeMathLatexForBackend(opt.text)
                );
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
            formData.append("TextUz", normalizeMathLatexForBackend(data.textUz));
        }
        if (data.textRu !== undefined) {
            formData.append("TextRu", normalizeMathLatexForBackend(data.textRu));
        }

        if (data.correctAnswer !== undefined) {
            formData.append(
                "CorrectAnswer",
                normalizeMathLatexForBackend(data.correctAnswer)
            );
        }

        if (data.imageUz) {
            formData.append("ImageUz", data.imageUz);
        }
        if (data.imageRu) {
            formData.append("ImageRu", data.imageRu);
        }

        appendExplanationFields(formData, data.explanation);

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

        formData.append("TextUz", normalizeMathLatexForBackend(data.textUz));
        formData.append("TextRu", normalizeMathLatexForBackend(data.textRu));

        if (data.correctOptionId) {
            formData.append("CorrectOptionId", data.correctOptionId.toString());
        }
        if (data.correctAnswer) {
            formData.append(
                "CorrectAnswer",
                normalizeMathLatexForBackend(data.correctAnswer)
            );
        }
        if (data.questionGroupId) {
            formData.append("QuestionGroupId", data.questionGroupId.toString());
        }

        appendExplanationFields(formData, data.explanation);

        return await apiService.upload<QuestionGroupQuestionCreate>(API_ENDPOINTS.STANDALONE_QUESTIONS, formData);
    },

    async updateQuestionGroupQuestion(
        id: string,
        data: QuestionGroupQuestionCreate
    ): Promise<ApiResponse<QuestionGroupQuestionCreate>> {
        const formData = new FormData();

        formData.append("Order", data.order.toString());
        formData.append("Score", data.score.toString().replace(",", "."));
        formData.append("Type", data.type.toString());
        formData.append("TextUz", normalizeMathLatexForBackend(data.textUz));
        formData.append("TextRu", normalizeMathLatexForBackend(data.textRu));

        if (data.correctOptionId) {
            formData.append("CorrectOptionId", data.correctOptionId.toString());
        }

        if (data.correctAnswer) {
            formData.append(
                "CorrectAnswer",
                normalizeMathLatexForBackend(data.correctAnswer)
            );
        }

        if (data.questionGroupId) {
            formData.append("QuestionGroupId", data.questionGroupId.toString());
        }

        return await apiService.uploadPut<QuestionGroupQuestionCreate>(
            API_ENDPOINTS.STANDALONE_QUESTION_BY_ID(id),
            formData
        );
    }
};

export default questionService;
