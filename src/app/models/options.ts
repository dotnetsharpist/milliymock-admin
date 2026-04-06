export interface Option {
    id: number;
    text: string;
    isCorrect: boolean;
}

/**
 * Option Create Data
 */
export interface CreateOptionData {
    questionId: number | null;
    questionGroupId: number | null;
    text: string;
    isCorrect: boolean;
}

/**
 * Option Update Data
 */
export interface UpdateOptionData {
    text: string;
    isCorrect: boolean;
}

export interface CreateOptionForQuestionGroupData {
    questionGroupId: number | null;
    text: string;
}

