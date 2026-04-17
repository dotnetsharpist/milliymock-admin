import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  MathQuillInput,
  MathQuillKeyboard,
  type MathInputHandle,
} from "../components/math/MathQuillField";
import { questionGroupService } from "../services";
import { questionService } from "../services/questionService";
import type { QuestionGroupQuestionCreate } from "../models/questionGroups";
import { toast } from "sonner";
import type { Option } from "../data/mockData";
import type { QuestionGroupDetailModel } from "../models/questionGroups";

type QuestionType = "Matching" | "FreeAnswer";

interface QuestionFormState {
  textUz: string;
  textRu: string;
  type: QuestionType;
  order: number | "";
  score: string | number;
  correctOptionId: string;
  correctAnswer: string;
}

export function QuestionGroupQuestionCreate() {
  const { groupId, questionId } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(questionId);

  const backHref = useMemo(
    () => `/question-groups/${groupId}?tab=questions`,
    [groupId]
  );

  const [group, setGroup] = useState<QuestionGroupDetailModel | null>(null);
  const [availableOptions, setAvailableOptions] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<QuestionFormState>({
    textUz: "",
    textRu: "",
    type: "Matching",
    order: 1,
    score: "",
    correctOptionId: "",
    correctAnswer: "",
  });
  const mathInputUzRef = useRef<MathInputHandle>(null);
  const mathInputRuRef = useRef<MathInputHandle>(null);
  const mathInputAnswerRef = useRef<MathInputHandle>(null);
  const [activeInputFocus, setActiveInputFocus] = useState<"uz" | "ru" | "answer">(
    "uz"
  );
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const activeMathRef =
    activeInputFocus === "ru"
      ? mathInputRuRef
      : activeInputFocus === "answer"
      ? mathInputAnswerRef
      : mathInputUzRef;

  useEffect(() => {
    if (!groupId) return;

    void (async () => {
      try {
        setIsLoading(true);
        const response = await questionGroupService.getQuestionGroupById(groupId);

        if (!response.success || !response.data) {
          toast.error("Question group not found");
          navigate("/question-groups");
          return;
        }

        setGroup(response.data);
        setAvailableOptions((response.data.options as Option[] | null) ?? []);

        if (isEditMode && questionId) {
          const currentQuestion = response.data.questions?.find(
            (question) => String(question.id) === String(questionId)
          );

          if (!currentQuestion) {
            toast.error("Question not found");
            navigate(backHref);
            return;
          }

          const uzTranslation = currentQuestion.translations?.find(
            (translation) => translation.language === "Uzbek"
          );
          const ruTranslation = currentQuestion.translations?.find(
            (translation) => translation.language === "Russian"
          );

          setFormData({
            textUz: uzTranslation?.text ?? "",
            textRu: ruTranslation?.text ?? "",
            type: currentQuestion.type as QuestionType,
            order: currentQuestion.order ?? 1,
            score:
              currentQuestion.score === null || currentQuestion.score === undefined
                ? ""
                : String(currentQuestion.score),
            correctOptionId: currentQuestion.correctOptionId
              ? String(currentQuestion.correctOptionId)
              : "",
            correctAnswer: currentQuestion.correctAnswer ?? "",
          });
        } else {
          setFormData((prev) => ({
            ...prev,
            order: (response.data.questions?.length ?? 0) + 1,
          }));
        }
      } catch (error) {
        console.error("Error loading question group:", error);
        toast.error("Error loading question group");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [backHref, groupId, isEditMode, navigate, questionId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!groupId) return;

    if (!formData.textUz.trim() || !formData.textRu.trim()) {
      toast.error("Please fill in both question texts");
      return;
    }

    if (formData.order === "") {
      toast.error("Please enter question order");
      return;
    }

    if (formData.score === "") {
      toast.error("Please enter question score");
      return;
    }

    if (formData.type === "Matching" && !formData.correctOptionId) {
      toast.error("Please select the correct option");
      return;
    }

    if (formData.type === "FreeAnswer" && !formData.correctAnswer.trim()) {
      toast.error("Please fill in the question answer");
      return;
    }

    const payload: QuestionGroupQuestionCreate = {
      questionGroupId: groupId,
      textUz: formData.textUz,
      textRu: formData.textRu,
      type: formData.type,
      order: Number(formData.order),
      score: String(formData.score),
      correctOptionId:
        formData.type === "Matching" ? formData.correctOptionId : undefined,
      correctAnswer:
        formData.type === "FreeAnswer" ? formData.correctAnswer : undefined,
    };

    try {
      setIsSubmitting(true);
      const response =
        isEditMode && questionId
          ? await questionService.updateQuestionGroupQuestion(questionId, payload)
          : await questionService.createQuestionGroupQuestion(payload);

      if (response.success && response.data) {
        toast.success(
          isEditMode
            ? "Question updated successfully"
            : "Question created successfully"
        );
        navigate(backHref);
      } else {
        toast.error(
          isEditMode ? "Failed to update question" : "Failed to create question"
        );
      }
    } catch (error) {
      console.error("Error saving question:", error);
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(backHref)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Group
        </Button>
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-neutral-600">Loading question group...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(backHref)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Group Questions
        </Button>

        <h1 className="text-3xl font-semibold text-neutral-900">
          {isEditMode ? "Edit Question" : "Add Question"}
        </h1>
        <p className="mt-1 text-neutral-600">
          {group?.translations?.[0]?.text ?? "Question group"} uchun savolni
          alohida page’da boshqaring. Digital keyboard question text va answer
          maydonlarida ishlaydi.
        </p>
      </div>

      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <form
          onSubmit={handleSubmit}
          className={`space-y-6 ${isKeyboardVisible ? "pb-[300px]" : ""}`}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="order">Order</Label>
              <Input
                id="order"
                type="number"
                min="1"
                value={formData.order}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    order: nextValue === "" ? "" : parseInt(nextValue, 10),
                  }));
                }}
                className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                required
                disabled={isSubmitting}
              />
            </div>

              <div className="space-y-2">
                  <Label htmlFor="score">Score</Label>

                  <Select
                      value={formData.score?.toString() ?? ""}
                      onValueChange={(nextValue) =>
                          setFormData((prev) => ({
                              ...prev,
                              score: parseFloat(nextValue),
                          }))
                      }
                      disabled={isSubmitting}
                  >
                      <SelectTrigger>
                          <SelectValue placeholder="Select score" />
                      </SelectTrigger>

                      <SelectContent>
                          <SelectItem value="1.3">1.3</SelectItem>
                          <SelectItem value="1.5">1.5</SelectItem>
                          <SelectItem value="1.7">1.7</SelectItem>
                          <SelectItem value="2.2">2.2</SelectItem>
                      </SelectContent>
                  </Select>
              </div>

            <div className="space-y-2">
              <Label htmlFor="type">Question Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: value as QuestionType,
                    correctOptionId: "",
                    correctAnswer: "",
                  }))
                }
                disabled={isSubmitting}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Matching">Matching</SelectItem>
                  <SelectItem value="FreeAnswer">Free Answer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <MathQuillInput
            key={`group-question-uz-${questionId ?? "new"}`}
            ref={mathInputUzRef}
            label="Question Text (UZ)"
            initialValue={formData.textUz}
            onInput={(latex) =>
              setFormData((prev) => ({ ...prev, textUz: latex }))
            }
            onFocus={() => setActiveInputFocus("uz")}
            onToggleKeyboard={() => {
              setActiveInputFocus("uz");
              setIsKeyboardVisible((prev) => !prev);
            }}
            disabled={isSubmitting}
          />

          <MathQuillInput
            key={`group-question-ru-${questionId ?? "new"}`}
            ref={mathInputRuRef}
            label="Question Text (RU)"
            initialValue={formData.textRu}
            onInput={(latex) =>
              setFormData((prev) => ({ ...prev, textRu: latex }))
            }
            onFocus={() => setActiveInputFocus("ru")}
            onToggleKeyboard={() => {
              setActiveInputFocus("ru");
              setIsKeyboardVisible((prev) => !prev);
            }}
            disabled={isSubmitting}
          />

          {formData.type === "Matching" ? (
            <div className="space-y-2">
              <Label htmlFor="correctOption">Correct Answer</Label>
              <Select
                value={formData.correctOptionId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, correctOptionId: value }))
                }
                disabled={isSubmitting}
              >
                <SelectTrigger id="correctOption">
                  <SelectValue placeholder="Select the correct option" />
                </SelectTrigger>
                <SelectContent>
                  {availableOptions.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-neutral-600">
                      No options available. Add options first.
                    </div>
                  ) : (
                    availableOptions.map((option) => (
                      <SelectItem key={option.id} value={String(option.id)}>
                        {option.text}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-sm text-neutral-600">
                This question type uses one of the group options as the correct
                answer.
              </p>
            </div>
          ) : (
            <MathQuillInput
              key={`group-question-answer-${questionId ?? "new"}`}
              ref={mathInputAnswerRef}
              label="Question Answer"
              initialValue={formData.correctAnswer}
              onInput={(latex) =>
                setFormData((prev) => ({ ...prev, correctAnswer: latex }))
              }
              onFocus={() => setActiveInputFocus("answer")}
              onToggleKeyboard={() => {
                setActiveInputFocus("answer");
                setIsKeyboardVisible((prev) => !prev);
              }}
              disabled={isSubmitting}
            />
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(backHref)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? isEditMode
                  ? "Updating..."
                  : "Creating..."
                : isEditMode
                ? "Update Question"
                : "Add Question"}
            </Button>
          </div>

          <MathQuillKeyboard
            mathInputRef={activeMathRef}
            isVisible={isKeyboardVisible && !isSubmitting}
            onClose={() => setIsKeyboardVisible(false)}
          />
        </form>
      </div>
    </div>
  );
}
