import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Plus, Pencil, Trash2, ImageIcon, Loader2 } from "lucide-react";
import { StandaloneQuestionModal } from "../components/modals/StandaloneQuestionModal";
import { QuestionOptionsModal } from "../components/modals/QuestionOptionsModal";
import { TestFilter } from "../components/TestFilter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { toast } from "sonner";
import { StandaloneQuestion } from "../data/mockData";
import { Question as ApiQuestion } from "../models/questions";
import { questionService } from "../services/questionService";
import { optionService } from "../services/optionService";
import { BASE_URL } from "../config/api";
import { MathText } from "../components/math/MathText";

type QuestionType = "MultipleChoice" | "Matching" | "FreeAnswer";
type QuestionListItem = StandaloneQuestion & {
  correctAnswer?: string | null;
  score?: number | null;
};

interface QuestionOption {
  id: string;
  questionId: string | null;
  questionGroupId: number | null;
  text: string;
  isCorrect: boolean;
}

const normalizeQuestion = (question: ApiQuestion): QuestionListItem => ({
  id: String(question.id),
  testId: String(question.testId),
  text: question.text ?? "",
  imagePath: question.imagePath ?? undefined,
  type:
    question.type === "Matching" ? "MultipleChoice" : question.type,
  order: question.order,
  createdAt: "",
  correctAnswer: question.correctAnswer,
  score: question.score,
});

export function Questions() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<StandaloneQuestion | undefined>();
  const selectedTestId = searchParams.get("testId");

  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [optionsModalQuestion, setOptionsModalQuestion] = useState<{
    id: number;
    text: string;
  } | null>(null);
  const [questionOptions, setQuestionOptions] = useState<QuestionOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch questions on mount and when test filter changes
  useEffect(() => {
    fetchQuestions();
  }, [selectedTestId]);

  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      const response = selectedTestId
        ? await questionService.getQuestionsByTestId(selectedTestId)
        : await questionService.getQuestions();

      if (response.success && response.data) {
        setQuestions(response.data.map(normalizeQuestion));
      } else {
        toast.error("Failed to load questions");
        setQuestions([]);
      }
    } catch (error) {
      toast.error("Error loading questions");
      console.error("Error fetching questions:", error);
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    const nextHref = selectedTestId
      ? `/questions/new?testId=${selectedTestId}`
      : "/questions/new";
    navigate(nextHref);
  };

  const handleEdit = (e: React.MouseEvent, question: StandaloneQuestion) => {
    e.stopPropagation();
    setSelectedQuestion(question);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setQuestionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!questionToDelete) return;

    try {
      setIsDeleting(true);
      const response = await questionService.deleteQuestion(questionToDelete);

      if (response.success) {
        setQuestions(questions.filter((q) => q.id !== questionToDelete));
        toast.success("Question deleted successfully");
      } else {
        toast.error("Failed to delete question");
      }
    } catch (error) {
      toast.error("Error deleting question");
      console.error("Error deleting question:", error);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
    }
  };

  const handleSave = async (question: StandaloneQuestion) => {
    // The StandaloneQuestionModal will handle the API calls
    // After it completes, refresh the list
    await fetchQuestions();
    setIsModalOpen(false);
  };

  const handleTestChange = (testId: string | null) => {
    const nextParams = new URLSearchParams(searchParams);

    if (testId) {
      nextParams.set("testId", testId);
    } else {
      nextParams.delete("testId");
    }

    setSearchParams(nextParams, { replace: true });
  };

  const handleRowClick = async (question: StandaloneQuestion) => {
    if (question.type === "MultipleChoice") {
      try {
        setIsLoadingOptions(true);
        const response = await optionService.getOptionsByQuestionId(question.id);

        if (response.success && response.data) {
          const options = response.data.map((opt) => {
            // Handle both string IDs (e.g., "so-1") and numeric IDs
            const optionId = opt.id;
            const questionIdNum = question.id;

            return {
              id: String(optionId),
              questionId: questionIdNum,
              questionGroupId: null,
              text: opt.text,
              isCorrect: opt.isCorrect,
            };
          });

          setOptionsModalQuestion({
            id: parseInt(question.id),
            text: question.text,
          });
          setQuestionOptions(options);
          setIsOptionsModalOpen(true);
        } else {
          toast.error("Failed to load options");
        }
      } catch (error) {
        toast.error("Error loading options");
        console.error("Error fetching options:", error);
      } finally {
        setIsLoadingOptions(false);
      }
    } else {
      toast.info("Options are only available for Multiple Choice questions", {
        description: "This question type does not support options",
      });
    }
  };

  const getTestName = (testId: string) => {
    // This would ideally come from a tests context or prop
    return "Test";
  };

  const getQuestionOptions = (questionId: string) => {
    // Options are now loaded on demand via handleRowClick
    return [];
  };

  // Helper function to get the full image URL from imagePath
  const getImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return undefined;
    // Remove leading slash if present to avoid double slashes
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `${BASE_URL}${cleanPath}`;
  };

  const getTypeBadge = (type: QuestionType) => {
    const variants = {
      MultipleChoice: "bg-blue-100 text-blue-800",
      Matching: "bg-green-100 text-green-800",
      FreeAnswer: "bg-purple-100 text-purple-800",
    };

    const labels = {
      MultipleChoice: "Multiple Choice",
      Matching: "Matching",
      FreeAnswer: "Free Answer",
    };

    return (
      <Badge className={`${variants[type]} hover:${variants[type]}`}>
        {labels[type]}
      </Badge>
    );
  };

  const filteredQuestions = selectedTestId
    ? questions.filter((q) => String(q.testId) === selectedTestId)
    : questions;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-neutral-900">Questions</h1>
            <p className="text-neutral-600 mt-1">
              Manage standalone questions with their own options
            </p>
          </div>
          <Button disabled>
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
        </div>

        <TestFilter
          selectedTestId={selectedTestId}
          onTestChange={handleTestChange}
        />

        <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
          <div className="p-12 space-y-4">
            <div className="flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
            <p className="text-center text-neutral-500">Loading questions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-900">Questions</h1>
          <p className="text-neutral-600 mt-1">
            Manage standalone questions with their own options
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      </div>

      <TestFilter
        selectedTestId={selectedTestId}
        onTestChange={handleTestChange}
      />

      <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Image
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Text
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Correct Answer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {filteredQuestions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                  No questions found. Get started by creating your first question.
                </td>
              </tr>
            ) : (
              filteredQuestions.map((question) => {
                const isClickable = question.type === "MultipleChoice";

                return (
                  <TooltipProvider key={question.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <tr
                          className={`hover:bg-neutral-50 transition-colors ${
                            isClickable
                              ? "cursor-pointer"
                              : "cursor-not-allowed opacity-75"
                          }`}
                          onClick={() => handleRowClick(question)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className="font-medium text-neutral-900">
                              {question.order}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {question.imagePath ? (
                              <div className="w-12 h-12 rounded-md overflow-hidden border border-neutral-200">
                                <img
                                  src={getImageUrl(question.imagePath)}
                                  alt="Question preview"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-md bg-neutral-100 flex items-center justify-center">
                                <ImageIcon className="w-5 h-5 text-neutral-400" />
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <MathText
                              value={question.text}
                              className="max-w-md truncate text-neutral-900"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {getTypeBadge(question.type as QuestionType)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                            {question.type === "FreeAnswer" &&
                            question.correctAnswer
                              ? question.correctAnswer
                              : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleEdit(e, question)}
                                disabled={isDeleting}
                              >
                                <Pencil className="w-4 h-4 mr-1" />
                                Update
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleDeleteClick(e, question.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={isDeleting}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      </TooltipTrigger>
                      {!isClickable && (
                        <TooltipContent>
                          <p>Options available only for Multiple Choice questions</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <StandaloneQuestionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        question={selectedQuestion}
      />

      {optionsModalQuestion && (
        <QuestionOptionsModal
          isOpen={isOptionsModalOpen}
          onClose={() => setIsOptionsModalOpen(false)}
          questionId={optionsModalQuestion.id}
          questionText={optionsModalQuestion.text}
          options={questionOptions}
          onSave={(updatedOptions) => {
            console.log("Saved options:", updatedOptions);
            setIsOptionsModalOpen(false);
          }}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this question. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
