import { Question } from "./questions";
import { Option} from "./options";

// This is the READ model (from GET response)
export interface QuestionGroup {
    id: string;
    testId: string;
    title: string;
    questionCount: number
    imagePath?: string; // Relative path from backend (for display only)
}

export interface QuestionGroupDetailModel {
    id: string;
    testId: string;
    title: string;
    questionCount: number
    imagePath?: string;
    questions?: Question[] | null;
    options?: Option[] | null;
    // Relative path from backend (for display only)
}


export interface QuestionGroupFormData {
    testId: string;
    title: string;
    image?: File | null;
}

export interface QuestionGroupQuestionCreate {
    text: string;
    type: "Matching" | "FreeAnswer";
    order: number; // Position within the group
    score: string;
    questionGroupId: string;
    correctOptionId?: string; // Reference to the correct option from the group
    correctAnswer?: string;
}

