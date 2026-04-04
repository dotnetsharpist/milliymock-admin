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

export { default as standaloneQuestionService } from "./standaloneQuestionService";
export type {
  CreateStandaloneQuestionData,
  UpdateStandaloneQuestionData,
} from "./standaloneQuestionService";

export { default as standaloneOptionService } from "./standaloneOptionService";
export type {
  CreateStandaloneOptionData,
  UpdateStandaloneOptionData,
} from "./standaloneOptionService";

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
