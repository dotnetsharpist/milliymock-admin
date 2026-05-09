/**
 * Question Types
 */

import { Translation} from "./translations";

export type QuestionType = 'MultipleChoice' | 'Matching' | 'FreeAnswer';
export type QuestionTypeForQuestion = 'MultipleChoice' | 'FreeAnswer';

/**
 * Question Interface (READ MODEL - from GET response)
 * This model is returned by the API when fetching questions
 */
export interface Question {
    id: number;
    order: number;
    score: number;
    translations: Translation[];
    type: QuestionType;
    testId: number;
    correctAnswer: string | null;
    correctOptionId?: string | null;
    questionGroupId: number | null;
    explanation?: QuestionExplanationFormData | null;
}

export interface OptionForQuestion{
    text: string;
    isCorrect: boolean;
}

export interface QuestionExplanationFormData {
    textUz?: string | null;
    textRu?: string | null;
    videoLink?: string | null;
    questionId?: number | string | null;
}

/**
 * Question Create/Update Data (WRITE MODEL - for POST/PUT requests)
 * This model is used when creating or updating questions
 */
export interface QuestionFormData {
    textUz?: string | null;
    textRu?: string | null;
    imageUz?: File | null; // File upload (WRITE only)
    imageRu?: File | null; // File upload (WRITE only)
    order: number;
    score: number;
    type: QuestionTypeForQuestion;
    testId: number;
    correctAnswer?: string | null;
    questionGroupId?: number | null;
    options? : OptionForQuestion[] | null;
    explanation?: QuestionExplanationFormData | null;
}
