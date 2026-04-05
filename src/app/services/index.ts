/**
 * Services Index
 * Central export point for all API services
 */

export { default as apiService } from "./apiService";
export type { ApiResponse } from "./apiService";

export { default as authService } from "./authService";
export type { LoginCredentials, RegisterData, AuthResponse } from "./authService";

export { default as testService } from "./testService";
export type { CreateTestData, UpdateTestData } from "./testService";

export { default as standaloneQuestionService } from "./questionService";
export type {
  CreateStandaloneQuestionData,
  UpdateStandaloneQuestionData,
} from "./questionService";

export { default as standaloneOptionService } from "./optionService";
export type {
  CreateStandaloneOptionData,
  UpdateStandaloneOptionData,
} from "./optionService";

export { default as questionGroupService } from "./questionGroupService";
export type {
  CreateQuestionGroupData,
  UpdateQuestionGroupData,
  CreateGroupQuestionData,
  UpdateGroupQuestionData,
  CreateGroupOptionData,
  UpdateGroupOptionData,
} from "./questionGroupService";

export { default as userService } from "./userService";
export type { CreateUserData, UpdateUserData } from "./userService";
