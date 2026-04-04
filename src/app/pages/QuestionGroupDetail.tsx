import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import { DataTable, Column } from "../components/DataTable";
import {
  mockQuestionGroups,
  mockQuestions,
  mockOptions,
  mockTests,
  Question,
  Option,
} from "../data/mockData";
import { QuestionModal } from "../components/modals/QuestionModal";
import { OptionModal } from "../components/modals/OptionModal";
import { toast } from "sonner";
import { ImageIcon } from "lucide-react";
import { BASE_URL } from "../config/api";

export function QuestionGroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const group = mockQuestionGroups.find((g) => g.id === groupId);
  const test = mockTests.find((t) => t.id === group?.testId);

  const [questions, setQuestions] = useState<Question[]>(
    mockQuestions.filter((q) => q.questionGroupId === groupId)
  );
  const [options, setOptions] = useState<Option[]>(
    mockOptions.filter((o) => o.questionGroupId === groupId)
  );

  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | undefined>();
  const [editingOption, setEditingOption] = useState<Option | undefined>();

  // Helper function to get the full image URL from imagePath
  const getImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return undefined;
    // Remove leading slash if present to avoid double slashes
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
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
    setEditingQuestion(undefined);
    setIsQuestionModalOpen(true);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setIsQuestionModalOpen(true);
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestions(questions.filter((q) => q.id !== questionId));
    toast.success("Question deleted successfully");
  };

  const handleSaveQuestion = (question: Question) => {
    if (editingQuestion) {
      setQuestions(questions.map((q) => (q.id === question.id ? question : q)));
      toast.success("Question updated successfully");
    } else {
      setQuestions([...questions, question]);
      toast.success("Question created successfully");
    }
    setIsQuestionModalOpen(false);
  };

  // Option handlers
  const handleCreateOption = () => {
    setEditingOption(undefined);
    setIsOptionModalOpen(true);
  };

  const handleEditOption = (option: Option) => {
    setEditingOption(option);
    setIsOptionModalOpen(true);
  };

  const handleDeleteOption = (optionId: string) => {
    setOptions(options.filter((o) => o.id !== optionId));
    toast.success("Option deleted successfully");
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

  const questionColumns: Column<Question>[] = [
    {
      header: "Order",
      accessor: (q) => (
        <span className="font-medium text-neutral-900">#{q.order}</span>
      ),
    },
    {
      header: "Question Text",
      accessor: (q) => (
        <span className="block max-w-md truncate">{q.text}</span>
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
        <span className="text-sm text-neutral-600">
          {q.type === "Matching" ? getCorrectOptionText(q.correctOptionId) : "—"}
        </span>
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
      accessor: "text",
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
            <h1 className="text-3xl font-semibold text-neutral-900">{group.title}</h1>
            <p className="text-neutral-600 mt-1">Test: {test?.title || "Unknown"}</p>
          </div>
          <div className="ml-6 rounded-lg border border-neutral-200 overflow-hidden bg-neutral-50">
            {group.imagePath ? (
              <img
                src={getImageUrl(group.imagePath)}
                alt={group.title}
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

      <Tabs defaultValue="questions" className="space-y-6">
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

      <QuestionModal
        isOpen={isQuestionModalOpen}
        onClose={() => setIsQuestionModalOpen(false)}
        onSave={handleSaveQuestion}
        question={editingQuestion}
        groupId={groupId!}
        availableOptions={options}
      />

      <OptionModal
        isOpen={isOptionModalOpen}
        onClose={() => setIsOptionModalOpen(false)}
        onSave={handleSaveOption}
        option={editingOption}
        groupId={groupId!}
      />
    </div>
  );
}