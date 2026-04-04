export interface Test {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  questionCount: number;
}

// Standalone Question - belongs directly to Test, has own Options
// This is the READ model (from GET response)
export interface StandaloneQuestion {
  id: string;
  testId: string;
  imagePath?: string; // Relative path from backend (for display only)
  text: string;
  type: "MultipleChoice" | "FreeAnswer";
  order: number; // Position in test (1st, 2nd, etc.)
  createdAt: string;
}

// Option for Standalone Question
// READ MODEL - matches GET /api/option?questionId={id} response
export interface StandaloneOption {
  id: string;
  text: string;
  isCorrect: boolean;
  // NOTE: questionId is NOT in the response - it's only used as query parameter
}

// QuestionGroup Question - belongs to QuestionGroup, uses shared Options
export interface Question {
  id: string;
  questionGroupId: string;
  text: string;
  type: "Matching" | "FreeAnswer";
  order: number; // Position within the group
  correctOptionId?: string; // Reference to the correct option from the group
  createdAt: string;
}

// Option for QuestionGroup - shared among all questions in the group
export interface Option {
  id: string;
  questionGroupId: string; // Options belong to QuestionGroup, not individual questions
  text: string;
}

// Question Group
// This is the READ model (from GET response)
export interface QuestionGroup {
  id: string;
  testId: string;
  title: string;
  imagePath?: string; // Relative path from backend (for display only)
  createdAt: string;
  questionCount: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export const mockTests: Test[] = [
  {
    id: "1",
    title: "JavaScript Fundamentals",
    description: "Basic JavaScript concepts and syntax",
    createdAt: "2026-03-15",
    questionCount: 15,
  },
  {
    id: "2",
    title: "React Basics",
    description: "Introduction to React components and hooks",
    createdAt: "2026-03-20",
    questionCount: 12,
  },
  {
    id: "3",
    title: "TypeScript Advanced",
    description: "Advanced TypeScript types and generics",
    createdAt: "2026-03-22",
    questionCount: 10,
  },
  {
    id: "4",
    title: "CSS Grid & Flexbox",
    description: "Modern CSS layout techniques",
    createdAt: "2026-03-25",
    questionCount: 8,
  },
  {
    id: "5",
    title: "Node.js Essentials",
    description: "Backend development with Node.js",
    createdAt: "2026-03-27",
    questionCount: 14,
  },
];

// Standalone Questions with their own options
export const mockStandaloneQuestions: StandaloneQuestion[] = [
  {
    id: "sq1",
    testId: "1",
    text: "What is the output of console.log(typeof null)?",
    type: "MultipleChoice",
    order: 1,
    createdAt: "2026-03-15",
  },
  {
    id: "sq2",
    testId: "1",
    text: "Explain the concept of closures in JavaScript.",
    type: "FreeAnswer",
    order: 2,
    createdAt: "2026-03-15",
  },
  {
    id: "sq3",
    testId: "2",
    text: "Which hook is used to manage side effects in React?",
    type: "MultipleChoice",
    order: 1,
    createdAt: "2026-03-20",
  },
  {
    id: "sq4",
    testId: "3",
    text: "What is a union type in TypeScript?",
    type: "MultipleChoice",
    order: 1,
    createdAt: "2026-03-22",
  },
];

// Mock data includes questionId for local filtering/testing purposes only
// IMPORTANT: This is NOT part of the API response structure
export const mockStandaloneOptions: StandaloneOption[] = [
  // Options for sq1
  {
    id: "so1",
    text: "object",
    isCorrect: true,
  },
  {
    id: "so2",
    text: "null",
    isCorrect: false,
  },
  {
    id: "so3",
    text: "undefined",
    isCorrect: false,
  },
  {
    id: "so4",
    text: "number",
    isCorrect: false,
  },
  // Options for sq3
  {
    id: "so5",
    text: "useEffect",
    isCorrect: true,
  },
  {
    id: "so6",
    text: "useState",
    isCorrect: false,
  },
  {
    id: "so7",
    text: "useContext",
    isCorrect: false,
  },
  {
    id: "so8",
    text: "useRef",
    isCorrect: false,
  },
  // Options for sq4
  {
    id: "so9",
    text: "A type that can be one of several types",
    isCorrect: true,
  },
  {
    id: "so10",
    text: "A type that combines multiple types",
    isCorrect: false,
  },
  {
    id: "so11",
    text: "A type for arrays only",
    isCorrect: false,
  },
];

// QuestionGroup Questions - use shared options from the group
export const mockQuestions: Question[] = [
  {
    id: "q1",
    questionGroupId: "g1",
    text: "map() function purpose",
    type: "Matching",
    order: 1,
    correctOptionId: "o1",
    createdAt: "2026-03-15",
  },
  {
    id: "q2",
    questionGroupId: "g1",
    text: "filter() function purpose",
    type: "Matching",
    order: 2,
    correctOptionId: "o2",
    createdAt: "2026-03-15",
  },
  {
    id: "q3",
    questionGroupId: "g1",
    text: "reduce() function purpose",
    type: "Matching",
    order: 3,
    correctOptionId: "o3",
    createdAt: "2026-03-15",
  },
  {
    id: "q4",
    questionGroupId: "g2",
    text: "Explain the React component lifecycle",
    type: "FreeAnswer",
    order: 1,
    createdAt: "2026-03-20",
  },
  {
    id: "q5",
    questionGroupId: "g2",
    text: "useState hook purpose",
    type: "Matching",
    order: 2,
    correctOptionId: "o6",
    createdAt: "2026-03-20",
  },
];

export const mockOptions: Option[] = [
  // Options for QuestionGroup g1 (Array Methods)
  {
    id: "o1",
    questionGroupId: "g1",
    text: "Transforms each element and returns a new array",
  },
  {
    id: "o2",
    questionGroupId: "g1",
    text: "Creates a new array with elements that pass a test",
  },
  {
    id: "o3",
    questionGroupId: "g1",
    text: "Reduces array to a single value",
  },
  {
    id: "o4",
    questionGroupId: "g1",
    text: "Finds and returns the first matching element",
  },
  {
    id: "o5",
    questionGroupId: "g1",
    text: "Executes a function for each array element",
  },
  // Options for QuestionGroup g2 (React Hooks)
  {
    id: "o6",
    questionGroupId: "g2",
    text: "Manages local component state",
  },
  {
    id: "o7",
    questionGroupId: "g2",
    text: "Performs side effects",
  },
  {
    id: "o8",
    questionGroupId: "g2",
    text: "Memoizes expensive calculations",
  },
  {
    id: "o9",
    questionGroupId: "g2",
    text: "Accesses DOM elements directly",
  },
];

export const mockQuestionGroups: QuestionGroup[] = [
  {
    id: "g1",
    testId: "1",
    title: "Array Methods Matching",
    imagePath: "uploads/question-groups/array-methods.jpg",
    createdAt: "2026-03-15",
    questionCount: 5,
  },
  {
    id: "g2",
    testId: "2",
    title: "React Hooks Matching",
    createdAt: "2026-03-20",
    questionCount: 4,
  },
  {
    id: "g3",
    testId: "3",
    title: "TypeScript Types Matching",
    imagePath: "uploads/question-groups/typescript-types.jpg",
    createdAt: "2026-03-22",
    questionCount: 6,
  },
];

export const mockUsers: User[] = [
  {
    id: "u1",
    email: "john.doe@example.com",
    name: "John Doe",
    role: "Student",
    createdAt: "2026-01-15",
  },
  {
    id: "u2",
    email: "jane.smith@example.com",
    name: "Jane Smith",
    role: "Student",
    createdAt: "2026-01-20",
  },
  {
    id: "u3",
    email: "admin@milliymock.com",
    name: "Admin User",
    role: "Administrator",
    createdAt: "2026-01-01",
  },
  {
    id: "u4",
    email: "teacher@milliymock.com",
    name: "Sarah Johnson",
    role: "Teacher",
    createdAt: "2026-01-10",
  },
  {
    id: "u5",
    email: "student1@example.com",
    name: "Michael Brown",
    role: "Student",
    createdAt: "2026-02-01",
  },
];