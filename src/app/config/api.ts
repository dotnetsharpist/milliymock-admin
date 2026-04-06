/**
 * API Configuration
 * Single source of truth for all API-related constants
 */

export const BASE_URL = "https://milliymock.uz/";

// API Endpoints
export const API_ENDPOINTS = {
    // Auth
    LOGIN: "api/auth/login",
    REGISTER: "api/register",
    LOGOUT: "api/logout",

    // Tests
    TESTS: "api/test",
    TEST_BY_ID: (id: string) => `api/test/${id}`,
    GET_TEST_BY_ID: (id: string) => `api/test?testId=${id}`,


    // Questions (using correct API contract)
    STANDALONE_QUESTIONS: "api/question",
    STANDALONE_QUESTION_BY_ID: (id: string) => `api/question/${id}`,
    STANDALONE_QUESTIONS_BY_TEST: (testId: string) => `api/question?testId=${testId}`,

    // Options (using correct API contract)
    STANDALONE_OPTIONS: "api/option",
    STANDALONE_OPTION_BY_ID: (id: string) => `api/option/${id}`,
    STANDALONE_OPTIONS_BY_QUESTION: (questionId: string) => `api/option?questionId=${questionId}`,

    // Question Groups
    QUESTION_GROUPS: "api/question-group",
    QUESTION_GROUP_BY_ID: (id: string) => `api/question-group/${id}`,
    QUESTION_GROUPS_BY_TEST: (testId: string) => `api/question-group?testId=${testId}`,

    // QuestionGroup Questions
    GROUP_QUESTIONS: "api/group-questions",
    GROUP_QUESTION_BY_ID: (id: string) => `api/group-questions/${id}`,
    GROUP_QUESTIONS_BY_GROUP: (groupId: string) => `api/question-group/${groupId}/questions`,

    // QuestionGroup Options (shared)
    GROUP_OPTIONS: "api/group-options",
    GROUP_OPTION_BY_ID: (id: string) => `api/group-options/${id}`,
    GROUP_OPTIONS_BY_GROUP: (groupId: string) => `api/question-groups/${groupId}/options`,

    // Users
    USERS: "api/users",
    USER_BY_ID: (id: string) => `api/users/${id}`,
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
    TOKEN: "token",
    USER: "user",
} as const;
