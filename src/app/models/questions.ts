/**
 * Question Types
 */

export type QuestionType = 'MultipleChoice' | 'Matching' | 'FreeAnswer';
export type QuestionTypeForQuestion = 'MultipleChoice' | 'FreeAnswer';

/**
 * Question Interface (READ MODEL - from GET response)
 * This model is returned by the API when fetching questions
 */
export interface Question {
    id: number;
    text: string | null;
    imagePath: string | null; // Relative path from backend (READ only)
    order: number;
    score: number;
    type: QuestionType;
    testId: number;
    correctAnswer: string | null;
    questionGroupId: number | null;
}

export interface OptionForQuestion{
    text: string;
    isCorrect: boolean;
}
/**
 * Question Create/Update Data (WRITE MODEL - for POST/PUT requests)
 * This model is used when creating or updating questions
 */
export interface QuestionFormData {
    Text?: string | null;
    Image?: File | null; // File upload (WRITE only)
    Order: number;
    Score: number;
    Type: QuestionTypeForQuestion;
    TestId: number;
    CorrectAnswer?: string | null;
    QuestionGroupId?: number | null;
    Options? : OptionForQuestion[] | null;
}
