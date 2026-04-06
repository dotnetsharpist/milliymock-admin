import { createBrowserRouter } from "react-router";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Tests } from "./pages/Tests";
import { Questions } from "./pages/Questions";
import { QuestionCreate } from "./pages/QuestionCreate";
import { QuestionGroups } from "./pages/QuestionGroups";
import { QuestionGroupDetail } from "./pages/QuestionGroupDetail";
import { Users } from "./pages/Users";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
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
      { path: "question-groups/:groupId", Component: QuestionGroupDetail },
      { path: "users", Component: Users },
    ],
  },
]);
