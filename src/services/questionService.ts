import { request, buildQueryString } from './apiClient';

/**
 * Question Types
 */
export type QuestionType = 'MultipleChoice' | 'Matching' | 'FreeAnswer';

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

/**
 * Question Create/Update Data (WRITE MODEL - for POST/PUT requests)
 * This model is used when creating or updating questions
 */
export interface QuestionFormData {
  Text?: string | null;
  Image?: File | null; // File upload (WRITE only)
  Order: number;
  Score: number;
  Type: QuestionType;
  TestId: number;
  CorrectAnswer?: string | null;
  QuestionGroupId?: number | null;
}

/**
 * Get all questions for a specific test
 * @param testId - The test ID
 * @returns Array of questions
 */
export const getQuestions = async (testId: number): Promise<Question[]> => {
  const queryString = buildQueryString({ testId });
  return request<Question[]>(`/api/question${queryString}`);
};

/**
 * Create a new question
 * @param data - Question data
 * @returns Created question
 */
export const createQuestion = async (data: QuestionFormData): Promise<Question> => {
  const formData = new FormData();

  // Append required fields
  formData.append('Order', data.Order.toString());
  formData.append('Score', data.Score.toString());
  formData.append('Type', data.Type);
  formData.append('TestId', data.TestId.toString());

  // Append optional fields only if they exist
  if (data.Text !== undefined && data.Text !== null) {
    formData.append('Text', data.Text);
  }

  if (data.Image) {
    formData.append('Image', data.Image);
  }

  if (data.CorrectAnswer !== undefined && data.CorrectAnswer !== null) {
    formData.append('CorrectAnswer', data.CorrectAnswer);
  }

  if (data.QuestionGroupId !== undefined && data.QuestionGroupId !== null) {
    formData.append('QuestionGroupId', data.QuestionGroupId.toString());
  }

  return request<Question>('/api/question', {
    method: 'POST',
    body: formData,
  });
};

/**
 * Update an existing question
 * @param id - Question ID
 * @param data - Updated question data
 * @returns Updated question
 */
export const updateQuestion = async (id: number, data: QuestionFormData): Promise<Question> => {
  const formData = new FormData();

  // Append required fields
  formData.append('Order', data.Order.toString());
  formData.append('Score', data.Score.toString());
  formData.append('Type', data.Type);
  formData.append('TestId', data.TestId.toString());

  // Append optional fields only if they exist
  if (data.Text !== undefined && data.Text !== null) {
    formData.append('Text', data.Text);
  }

  if (data.Image) {
    formData.append('Image', data.Image);
  }

  if (data.CorrectAnswer !== undefined && data.CorrectAnswer !== null) {
    formData.append('CorrectAnswer', data.CorrectAnswer);
  }

  if (data.QuestionGroupId !== undefined && data.QuestionGroupId !== null) {
    formData.append('QuestionGroupId', data.QuestionGroupId.toString());
  }

  return request<Question>(`/api/question/${id}`, {
    method: 'PUT',
    body: formData,
  });
};

/**
 * Delete a question
 * @param id - Question ID
 * @returns Success response
 */
export const deleteQuestion = async (id: number): Promise<void> => {
  return request<void>(`/api/question/${id}`, {
    method: 'DELETE',
  });
};
