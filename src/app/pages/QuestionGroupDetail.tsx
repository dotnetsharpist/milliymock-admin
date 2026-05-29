import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Plus, Edit, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import { DataTable, Column } from "../components/DataTable";
import {
  Option,
} from "../data/mockData";
import {Translation} from "../models/translations";
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
import { optionService } from "../services/optionService";

export interface Question {
    id: string;
    questionGroupId: string;
    textUz: string;
    textRu: string;
    type: "Matching" | "FreeAnswer";
    order: number; // Position within the group
    correctOptionId?: string;
    correctAnswer: "";// Reference to the correct option from the group
}

export interface QuestionData {
    id: string;
    questionGroupId: string;
    translations: Translation[];
    type: "Matching" | "FreeAnswer";
    order: number; // Position within the group
    correctOptionId?: string;
    correctAnswer: ""; // Reference to the correct option from the group
}


import { QuestionGroupDetailModel } from "../models/questionGroups";
import { questionGroupService} from "../services";
import { OptionModal } from "../components/modals/OptionModal";
import { toast } from "sonner";
import { ImageIcon } from "lucide-react";
import { BASE_URL } from "../config/api";
import { MathText } from "../components/math/MathText";

export function QuestionGroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [group, setGroup] = useState<QuestionGroupDetailModel | null>(null);
  const [questions, setQuestions] = useState<Question[]> ([]);
  const [options, setOptions] = useState<Option[]>([]);

  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<Option | undefined>();
  const activeTab = searchParams.get("tab") === "options" ? "options" : "questions";

  const [optionToDelete, setOptionToDelete] = useState<string | null>(null);
  const [isDeletingOption, setIsDeletingOption] = useState(false);

  const normalizeMathPreviewText = (text?: string | null) => {
    if (!text) return "";

    const cleaned = text
      .replace(/\\\\/g, "\\")
      .replace(/\\ /g, " ")
      .trim();

    if (!cleaned) return "";

    if (
      cleaned.includes("\\(") ||
      cleaned.includes("\\[") ||
      cleaned.includes("$$")
    ) {
      return cleaned;
    }

    const rawLatexStart = cleaned.match(/\\[a-zA-Z]+/);
    if (!rawLatexStart || rawLatexStart.index === undefined) {
      return cleaned;
    }

    const prefix = cleaned.slice(0, rawLatexStart.index);
    const mathTail = cleaned.slice(rawLatexStart.index).trim();
    return mathTail ? `${prefix}\\(${mathTail}\\)` : cleaned;
  };

    useEffect(() => {
        if (!groupId) return;

        (async () => {
            try {
                const res = await questionGroupService.getQuestionGroupById(groupId);

                if (!res.success || !res.data) return;

                const data = res.data;
                console.log(data)
                setGroup(data);
                setQuestions(data.questions ?? []);
                setOptions(data.options ?? []);
            } catch (err) {
                console.error(err);
            }
        })();
    }, [groupId]);

    // Helper function to get the full image URL from imagePath
  const getImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return undefined;
    // Remove leading slash if present to avoid double slashes
    const cleanPath = imagePath;
    return `${BASE_URL}${cleanPath}`;
  };

  if (!group) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-600">Question group not found</p>
        <Button onClick={() => navigate("/question-groups")} className="mt-4">
          Back to Question Groups
        </Button>
      </div>
    );
  }

  // Question handlers
  const handleCreateQuestion = () => {
    navigate(`/question-groups/${groupId}/questions/new`);
  };

  const handleEditQuestion = (question: Question) => {
    navigate(`/question-groups/${groupId}/questions/${question.id}/edit`);
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestions(questions.filter((q) => q.id !== questionId));
    toast.success("Question deleted successfully");
  };

  // Option handlers
  const handleCreateOption = () => {
    navigate(`/question-groups/${groupId}/options/new`);
  };

  const handleEditOption = (option: Option) => {
    setEditingOption(option);
    setIsOptionModalOpen(true);
  };

  const handleDeleteOption = (optionId: string) => {
    setOptionToDelete(optionId);
  };

  const handleConfirmDeleteOption = async () => {
    if (!optionToDelete) return;

    try {
      setIsDeletingOption(true);
      const response = await optionService.deleteOption(optionToDelete);

      if (response.success) {
        setOptions((prev) => prev.filter((o) => o.id !== optionToDelete));
        toast.success("Option deleted successfully");
      } else {
        toast.error(response.error ?? "Failed to delete option");
      }
    } catch (error) {
      console.error("Error deleting option:", error);
      toast.error("Error deleting option");
    } finally {
      setIsDeletingOption(false);
      setOptionToDelete(null);
    }
  };

  const handleSaveOption = (option: Option) => {
    if (editingOption) {
      setOptions(options.map((o) => (o.id === option.id ? option : o)));
      toast.success("Option updated successfully");
    } else {
      setOptions([...options, option]);
      toast.success("Option created successfully");
    }
    setIsOptionModalOpen(false);
  };

  const getCorrectOptionText = (correctOptionId?: string) => {
    if (!correctOptionId) return "—";
    const option = options.find((o) => o.id === correctOptionId);
    return option?.text || "—";
  };

  const questionColumns: Column<QuestionData>[] = [
    {
      header: "Order",
      accessor: (q) => (
        <span className="font-medium text-neutral-900">#{q.order}</span>
      ),
    },
    {
      header: "Question Text",
      accessor: (q) => (
        <MathText
          value={normalizeMathPreviewText(q.translations?.[0]?.text)}
          className="max-w-md text-neutral-900"
        />
      )
    },
    {
      header: "Type",
      accessor: (q) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${
          q.type === "Matching"
            ? "bg-blue-100 text-blue-800"
            : "bg-green-100 text-green-800"
        }`}>
          {q.type}
        </span>
      ),
    },
    {
      header: "Correct Answer",
      accessor: (q) => (
        <MathText
          as="span"
          value={normalizeMathPreviewText(
            q.type === "Matching"
              ? getCorrectOptionText(q.correctOptionId)
              : q.correctAnswer
          )}
          className="text-sm text-neutral-600"
        />
      ),
    },
    {
      header: "Actions",
      accessor: (q) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => handleEditQuestion(q)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDeleteQuestion(q.id)}>
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  const optionColumns: Column<Option>[] = [
    {
      header: "Option Text",
      accessor: (option) => (
        <MathText
          as="span"
          value={normalizeMathPreviewText(option.text)}
          className="text-neutral-900"
        />
      ),
    },
    {
      header: "Used By",
      accessor: (o) => {
        const count = questions.filter((q) => q.correctOptionId === o.id).length;
        return (
          <span className="text-sm text-neutral-600">
            {count} {count === 1 ? "question" : "questions"}
          </span>
        );
      },
    },
    {
      header: "Actions",
      accessor: (o) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => handleEditOption(o)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDeleteOption(o.id)}>
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/question-groups")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Question Groups
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <MathText
              value={normalizeMathPreviewText(group.translations?.[0]?.text)}
              className="text-3xl font-semibold text-neutral-900"
            />
            <p className="text-neutral-600 mt-1"> "Unknown" </p>
          </div>
          <div className="ml-6 rounded-lg border border-neutral-200 overflow-hidden bg-neutral-50">
            {group.translations?.[0]?.imagePath ? (
              <img
                src={getImageUrl(group.translations?.[0]?.imagePath)}
                alt={group.translations?.[0]?.text ?? "Question Group Image"}
                className="w-64 h-32 object-cover"
              />
            ) : (
              <div className="w-64 h-32 flex items-center justify-center">
                <div className="text-center">
                  <ImageIcon className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-xs text-neutral-400">No image</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          const nextParams = new URLSearchParams(searchParams);
          nextParams.set("tab", value);
          setSearchParams(nextParams, { replace: true });
        }}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="questions">
            Questions ({questions.length})
          </TabsTrigger>
          <TabsTrigger value="options">
            Options ({options.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleCreateQuestion}>
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </div>
          <DataTable
            data={questions}
            columns={questionColumns}
            searchPlaceholder="Search questions..."
            emptyMessage="No questions yet. Add your first question to get started."
          />
        </TabsContent>

        <TabsContent value="options" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleCreateOption}>
              <Plus className="w-4 h-4 mr-2" />
              Add Option
            </Button>
          </div>
          <DataTable
            data={options}
            columns={optionColumns}
            searchPlaceholder="Search options..."
            emptyMessage="No options yet. Add options that questions can reference as correct answers."
          />
        </TabsContent>
      </Tabs>
      <OptionModal
        isOpen={isOptionModalOpen}
        onClose={() => setIsOptionModalOpen(false)}
        onSave={handleSaveOption}
        option={editingOption}
        groupId={groupId!}
      />

      <AlertDialog
        open={optionToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeletingOption) setOptionToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete option?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the option. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingOption}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteOption}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeletingOption}
            >
              {isDeletingOption ? (
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
