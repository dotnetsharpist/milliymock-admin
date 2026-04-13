import { Question } from "./questions";
import { Option} from "./options";
import { Translation} from "./translations";

// This is the READ model (from GET response)
export interface QuestionGroup {
    id: string;
    testId: string;
    translations: Translation[];
    questionCount: number
}

export interface QuestionGroupDetailModel {
    id: string;
    testId: string;
    translations: Translation[];
    questionCount: number
    questions?: Question[] | null;
    options?: Option[] | null;
    // Relative path from backend (for display only)
}


export interface QuestionGroupFormData {
    testId: string;
    textUz: string;
    textRu: string;
    imageUz?: File | null;
    imageRu?: File | null;
}

export interface QuestionGroupQuestionCreate {
    textUz: string;
    textRu: string;
    type: "Matching" | "FreeAnswer";
    order: number; // Position within the group
    score: string;
    questionGroupId: string;
    correctOptionId?: string; // Reference to the correct option from the group
    correctAnswer?: string;
}

