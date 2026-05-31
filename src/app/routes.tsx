import { createBrowserRouter } from "react-router";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Tests } from "./pages/Tests";
import { Questions } from "./pages/Questions";
import { QuestionCreate } from "./pages/QuestionCreate";
import { QuestionGroups } from "./pages/QuestionGroups";
import { QuestionGroupCreate } from "./pages/QuestionGroupCreate";
import { QuestionGroupDetail } from "./pages/QuestionGroupDetail";
import { QuestionGroupQuestionCreate } from "./pages/QuestionGroupQuestionCreate";
import { QuestionGroupOptionCreate } from "./pages/QuestionGroupOptionCreate";
import { MathKeyboardTest } from "./pages/MathKeyboardTest";
import { Users } from "./pages/Users";
import { DesmosCalculator } from "./pages/DesmosCalculator";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/desmos-calculator",
    Component: DesmosCalculator,
  },
  {
    path: "/",
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      { index: true, Component: Dashboard },
      { path: "tests", Component: Tests },
      { path: "questions", Component: Questions },
      { path: "questions/new", Component: QuestionCreate },
      { path: "question-groups", Component: QuestionGroups },
      { path: "question-groups/new", Component: QuestionGroupCreate },
      { path: "question-groups/:groupId/edit", Component: QuestionGroupCreate },
      { path: "question-groups/:groupId", Component: QuestionGroupDetail },
      {
        path: "question-groups/:groupId/questions/new",
        Component: QuestionGroupQuestionCreate,
      },
      {
        path: "question-groups/:groupId/questions/:questionId/edit",
        Component: QuestionGroupQuestionCreate,
      },
      {
        path: "question-groups/:groupId/options/new",
        Component: QuestionGroupOptionCreate,
      },
      { path: "users", Component: Users },
      { path: "math-keyboard", Component: MathKeyboardTest },
    ],
  },
]);
