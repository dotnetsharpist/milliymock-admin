import { request, buildQueryString } from './apiClient';

/**
 * Option Interface
 * READ MODEL - matches actual API response structure
 *
 * IMPORTANT: GET /api/option?questionId={id} response does NOT include questionId
 * Response structure: { id, text, isCorrect }
 * questionId is used ONLY as a query parameter for fetching
 */
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

/**
 * Get options by question ID
 * @param questionId - Question ID (used as query parameter only)
 * @returns Array of options (without questionId in response)
 *
 * Response structure:
 * {
 *   code: number,
 *   message: string,
 *   data: [{ id, text, isCorrect }]
 * }
 */
export const getOptionsByQuestionId = async (questionId: number): Promise<Option[]> => {
  const queryString = buildQueryString({ questionId });
  return request<Option[]>(`/api/option${queryString}`);
};

/**
 * Create a new option
 * @param data - Option data
 * @returns Created option
 */
export const createOption = async (data: CreateOptionData): Promise<Option> => {
  return request<Option>('/api/option', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Update an existing option
 * @param id - Option ID
 * @param data - Updated option data
 * @returns Updated option
 */
export const updateOption = async (id: number, data: UpdateOptionData): Promise<Option> => {
  return request<Option>(`/api/option/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Delete an option
 * @param id - Option ID
 * @returns Success response
 */
export const deleteOption = async (id: number): Promise<void> => {
  return request<void>(`/api/option/${id}`, {
    method: 'DELETE',
  });
};
