import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { FileUpload } from "../ui/file-upload";
import { Question, QuestionTypeForQuestion } from "../../models/questions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import { CheckCircle, Loader2, Plus, Trash2 } from "lucide-react";
import { questionService } from "../../services/questionService";
import { optionService } from "../../services/optionService";
import { testService } from "../../services/testService";
import { toast } from "sonner";
import { BASE_URL } from "../../config/api";
import { MathComposer } from "../math/MathComposer";
import { MathText } from "../math/MathText";
import { extractFirstMathExpression, hasInlineMath } from "../../lib/math";
import { QuestionInlineComposer } from "../questions/QuestionInlineComposer";

export interface StandaloneQuestionFormQuestion {
  id: string;
  testId: string;
  textUz: string | null;
  textRu: string | null;
  imagePathUz?: string | null;
  imagePathRu?: string | null;
  type: QuestionTypeForQuestion;
  order: number;
  score?: number | null;
  correctAnswer?: string | null;
}

interface StandaloneQuestionFormState {
    id: string;
    testId: string;
    textUz: string | null;
    textRu: string | null;
    imagePathUz?: string | null;
    imagePathRu?: string | null;
    type: QuestionTypeForQuestion;
    order: number;
    score?: number | null;
    correctAnswer?: string | null;
}

interface NormalizedTestOption {
  id: string;
  title: string;
}

type QuestionEditorVariant = "basic" | "inline";

interface StandaloneQuestionFormProps {
  question?: StandaloneQuestionFormQuestion;
  defaultTestId?: string | null;
  onCancel: () => void;
  onSuccess: (question: Question) => void;
  questionEditorVariant?: QuestionEditorVariant;
}

export function StandaloneQuestionForm({
  question,
  defaultTestId,
  onCancel,
  onSuccess,
  questionEditorVariant = "basic",
}: StandaloneQuestionFormProps) {
  const [formData, setFormData] = useState<StandaloneQuestionFormState>({
    id: "",
    testId: "",
    textUz: "",
    textRu: "",
    imagePathUz: "",
    imagePathRu: "",
    score: 0,
    type: "MultipleChoice",
    order: 1,
  });
  const [tests, setTests] = useState<NormalizedTestOption[]>([]);
  const [isLoadingTests, setIsLoadingTests] = useState(false);
  const [options, setOptions] = useState<
    Array<{ id: string; text: string; isCorrect: boolean }>
  >([]);
  const [imageFileUz, setImageFileUz] = useState<File | null>(null);
  const [imageFileRu, setImageFileRu] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | undefined>();
  const [imagePreviewRu, setImagePreviewRu] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [mathExpressionUz, setMathExpressionUz] = useState("");
  const [mathExpressionRu, setMathExpressionRu] = useState("");
  const questionTextRef = useRef<HTMLTextAreaElement | null>(null);

  const isInlineEditor = questionEditorVariant === "inline";

  const getImageUrl = (imagePath: string | undefined | null) => {
    if (!imagePath) return undefined;
    return `${BASE_URL}${imagePath}`;
  };

  useEffect(() => {
    void fetchTests();
  }, []);

  useEffect(() => {
    if (question) {
      setFormData({
        id: question.id,
        testId: String(question.testId),
        textUz: question.textUz ?? "",
        textRu: question.textRu ?? "",
        imagePathUz: question.imagePathUz ?? "",
        imagePathRu: question.imagePathRu ?? "",
        type: question.type,
        order: question.order,
        correctAnswer: question.correctAnswer ?? "",
        score: question.score ?? 0,
      });

      setMathExpressionUz(extractFirstMathExpression(question.textUz));
      setMathExpressionRu(extractFirstMathExpression(question.textRu));
      setImagePreview(getImageUrl(question.imagePathUz));
      setImagePreview(getImageUrl(question.imagePathRu));
      setImageFileUz(null);
      setImageFileRu(null);

      if (question.type === "MultipleChoice") {
        void loadOptions(question.id);
      } else {
        setOptions([]);
      }
      return;
    }

    setFormData((prev) => ({
      ...prev,
      textUz: "",
      textRu: "",
      imagePathUz: "",
      imagePathRu: "",
        type: "MultipleChoice",
        order: 1,
      correctAnswer: "",
      score: 0,
    }));
    setOptions([]);
    setImagePreview(undefined);
    setImageFileUz(null);
    setImageFileRu(undefined);
    setMathExpressionUz("");
    setMathExpressionRu("");
  }, [question]);

  const fetchTests = async () => {
    try {
      setIsLoadingTests(true);
      const response = await testService.getTests();

      if (response.success && response.data) {
        const normalizedTests = response.data.map((test) => ({
          id: String(test.id),
          title: test.title,
        }));

        setTests(normalizedTests);

        if (!question && normalizedTests.length > 0) {
          const preferredTestId =
            defaultTestId &&
            normalizedTests.some((test) => test.id === defaultTestId)
              ? defaultTestId
              : normalizedTests[0].id;

          setFormData((prev) => ({
            ...prev,
            testId: prev.testId || preferredTestId,
          }));
        }
      } else {
        toast.error("Failed to load tests");
        setTests([]);
      }
    } catch (error) {
      console.error("Error fetching tests:", error);
      toast.error("Error loading tests");
      setTests([]);
    } finally {
      setIsLoadingTests(false);
    }
  };

  const loadOptions = async (questionId: string) => {
    try {
      setIsLoadingOptions(true);
      const response = await optionService.getOptionsByQuestionId(questionId);

      if (response.success && response.data) {
        const existingOptions = response.data.map((option) => ({
          id: typeof option.id === "string" ? option.id : String(option.id),
          text: option.text,
          isCorrect: option.isCorrect,
        }));

        setOptions(existingOptions.length > 0 ? existingOptions : []);
      }
    } catch (error) {
      console.error("Error loading options:", error);
      setOptions([]);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const handleImageChangeUz = (file: File | null) => {
    setImageFileUz(file);
  };
  const handleImageChangeRu = (file: File | null) => {
        setImageFileRu(file);
  };


    const handleImageRemoveUz = () => {
    setImageFileUz(null);
    setImagePreview(undefined);
  };
    const handleImageRemoveRu = () => {
        setImageFileRu(null);
        setImagePreview(undefined);
    };


    const handleAddOption = () => {
    setOptions((prev) => [
      ...prev,
      { id: `temp-${Date.now()}`, text: "", isCorrect: false },
    ]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleOptionChange = (index: number, text: string) => {
    setOptions((prev) =>
      prev.map((option, itemIndex) =>
        itemIndex === index ? { ...option, text } : option
      )
    );
  };

  const handleToggleCorrect = (index: number) => {
    setOptions((prev) =>
      prev.map((option, itemIndex) => ({
        ...option,
        isCorrect: itemIndex === index,
      }))
    );
  };

  const handleInsertMathIntoQuestionUz = () => {
    if (!mathExpressionUz.trim()) {
      toast.error("Please write a math formula first");
      return;
    }

    const mathToken = `\\(${mathExpressionUz.trim()}\\)`;
    const textarea = questionTextRef.current;

    if (!textarea) {
      setFormData((prev) => ({
        ...prev,
        textUz: prev.textUz ? `${prev.textUz} ${mathToken}` : mathToken,
      }));
      return;
    }

    const selectionStart = textarea.selectionStart ?? formData.textUz.length;
    const selectionEnd = textarea.selectionEnd ?? formData.textUz.length;
    const nextText = `${formData.textUz.slice(
      0,
      selectionStart
    )}${mathToken}${formData.textUz.slice(selectionEnd)}`;

    setFormData((prev) => ({
      ...prev,
      textUz: nextText,
    }));

    window.requestAnimationFrame(() => {
      const cursorPosition = selectionStart + mathToken.length;
      textarea.focus();
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    });
  };

    const handleInsertMathIntoQuestionRu = () => {
        if (!mathExpressionRu.trim()) {
            toast.error("Please write a math formula first");
            return;
        }

        const mathToken = `\\(${mathExpressionRu.trim()}\\)`;
        const textarea = questionTextRef.current;

        if (!textarea) {
            setFormData((prev) => ({
                ...prev,
                textRu: prev.textRu ? `${prev.textRu} ${mathToken}` : mathToken,
            }));
            return;
        }

        const selectionStart = textarea.selectionStart ?? formData.textRu.length;
        const selectionEnd = textarea.selectionEnd ?? formData.textRu.length;
        const nextText = `${formData.textRu.slice(
            0,
            selectionStart
        )}${mathToken}${formData.textRu.slice(selectionEnd)}`;

        setFormData((prev) => ({
            ...prev,
            textRu: nextText,
        }));

        window.requestAnimationFrame(() => {
            const cursorPosition = selectionStart + mathToken.length;
            textarea.focus();
            textarea.setSelectionRange(cursorPosition, cursorPosition);
        });
    };


    const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.testId) {
      toast.error("Please select a test");
      return;
    }

    if (formData.order === "" || formData.score === "") {
      toast.error("Please fill in order and score");
      return;
    }

    /*if (!formData.text.trim()) {
      toast.error("Please enter the question text");
      return;
    }*/

    /*if (
      !isInlineEditor &&
      mathExpression.trim() &&
      !hasInlineMath(formData.textUz, mathExpression)
    ) {
      toast.error("Insert the formula into question text before saving");
      return;
    }*/

    if (formData.type === "MultipleChoice") {
      if (options.length === 0) {
        toast.error("Multiple choice questions must have at least one option");
        return;
      }

      if (!options.some((option) => option.isCorrect)) {
        toast.error("Please select one correct answer");
        return;
      }
    }

    try {
      setIsSubmitting(true);

      if (question) {
        const response = await questionService.updateQuestion(question.id, {
          testId: parseInt(question.testId),
          textUz: formData.textUz,
          textRu: formData.textRu,
          type: formData.type,
          order: formData.order,
          score: formData.score,
          correctAnswer: formData.correctAnswer,
          imageUz: imageFileUz || undefined,
          imageRu: imageFileRu || undefined
        });

        if (response.success && response.data) {
          toast.success("Question updated successfully");
          onSuccess(response.data);
        } else {
          toast.error("Failed to update question");
        }
      } else {
        const response = await questionService.createQuestion({
          testId: parseInt(formData.testId),
          textUz: formData.textUz,
          textRu: formData.textRu,
          imageUz: imageFileUz,
          imageRu: imageFileRu,
          type: formData.type,
          score: formData.score,
          order: formData.order,
          correctAnswer: formData.correctAnswer,
          options: options,
        });

        if (response.success && response.data) {
          toast.success("Question created successfully");
          onSuccess(response.data);
        } else {
          toast.error("Failed to create question");
        }
      }
    } catch (error) {
      console.error("Error saving question:", error);
      toast.error("Error saving question");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!question && (
        <div className="space-y-2">
          <Label htmlFor="test">Test</Label>
          <Select
            value={formData.testId}
            onValueChange={(nextValue) =>
              setFormData((prev) => ({ ...prev, testId: nextValue }))
            }
            disabled={isLoadingTests || isSubmitting}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={isLoadingTests ? "Loading tests..." : "Select a test"}
              />
            </SelectTrigger>
            <SelectContent>
              {tests.map((test) => (
                <SelectItem key={test.id} value={test.id}>
                  {test.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
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
                order: nextValue === "" ? "" : parseInt(nextValue),
              }));
            }}
            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="score">Score</Label>
          <Input
            id="score"
            type="number"
            min="0"
            step="0.1"
            value={formData.score}
            onChange={(event) => {
              const nextValue = event.target.value;
              setFormData((prev) => ({
                ...prev,
                score: nextValue === "" ? "" : parseFloat(nextValue),
              }));
            }}
            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Question Type</Label>
          <Select
            value={formData.type}
            onValueChange={(nextValue) =>
              setFormData((prev) => ({
                ...prev,
                type: nextValue as QuestionTypeForQuestion,
              }))
            }
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MultipleChoice">Multiple Choice</SelectItem>
              <SelectItem value="FreeAnswer">Free Answer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Image UZ (optional)</Label>
        <FileUpload
          value={imagePreview}
          onChange={handleImageChangeUz}
          onRemove={handleImageRemoveUz}
          disabled={isSubmitting}
        />
      </div>
        <div className="space-y-2">
            <Label>Image RU (optional)</Label>
            <FileUpload
                value={imagePreview}
                onChange={handleImageChangeRu}
                onRemove={handleImageRemoveRu}
                disabled={isSubmitting}
            />
        </div>


        {isInlineEditor ? (
        <div className="space-y-2">
          <Label htmlFor="question-inline-editor">Question Content UZ</Label>
          <QuestionInlineComposer
            value={formData.textUz}
            onChange={(nextValue) =>
              setFormData((prev) => ({ ...prev, textUz: nextValue }))
            }
            disabled={isSubmitting}
          />
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.95fr)]">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="text">Question Text UZ</Label>
              <Textarea
                id="text"
                ref={questionTextRef}
                value={formData.textUz}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, textUz: event.target.value }))
                }
                placeholder="Enter your question..."
                rows={7}
                required
                disabled={isSubmitting}
              />
              <p className="text-xs leading-5 text-neutral-500">
                Formula `Insert into question` tugmasi orqali shu matn ichiga
                qo‘shiladi.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Question Preview
              </p>
              <MathText
                value={formData.textUz}
                className="mt-3 min-h-12 text-base leading-7 text-neutral-900"
                emptyFallback="Question preview will appear here"
              />
            </div>
          </div>

          <MathComposer
            value={mathExpressionUz}
            onChange={setMathExpressionUz}
            onInsert={handleInsertMathIntoQuestionUz}
            disabled={isSubmitting}
          />

        </div>
      )}

        {isInlineEditor ? (
            <div className="space-y-2">
                <Label htmlFor="question-inline-editor-ru">Question Content (RU)</Label>
                <QuestionInlineComposer
                    value={formData.textRu}
                    onChange={(nextValue) =>
                        setFormData((prev) => ({ ...prev, textRu: nextValue ?? "" }))
                    }
                    disabled={isSubmitting}
                />
            </div>
        ) : (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.95fr)]">
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label htmlFor="text-ru">Question Text (RU)</Label>
                        <Textarea
                            id="text-ru"
                            value={formData.textRu}
                            onChange={(event) =>
                                setFormData((prev) => ({ ...prev, textRu: event.target.value }))
                            }
                            placeholder="Введите вопрос..."
                            rows={7}
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                            Question Preview (RU)
                        </p>
                        <MathText
                            value={formData.textRu}
                            className="mt-3 min-h-12 text-base leading-7 text-neutral-900"
                            emptyFallback="Preview will appear here"
                        />
                    </div>
                </div>

                <MathComposer
                    value={mathExpressionRu}
                    onChange={setMathExpressionRu}
                    onInsert={handleInsertMathIntoQuestionRu}
                    disabled={isSubmitting}
                />
            </div>
        )}

      {formData.type === "MultipleChoice" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Answer Options</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddOption}
              disabled={isSubmitting}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Option
            </Button>
          </div>

          {isLoadingOptions ? (
            <div className="flex items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <p className="text-sm text-neutral-600">Loading options...</p>
            </div>
          ) : options.length === 0 ? (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-center">
              <p className="text-sm text-neutral-600">
                No options yet. Click "Add Option" to create answer choices.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={option.id} className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={option.isCorrect ? "default" : "outline"}
                    size="icon"
                    className="shrink-0"
                    onClick={() => handleToggleCorrect(index)}
                    disabled={isSubmitting}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                  <Input
                    value={option.text}
                    onChange={(event) =>
                      handleOptionChange(index, event.target.value)
                    }
                    placeholder={`Option ${index + 1}`}
                    required
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveOption(index)}
                    disabled={isSubmitting}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <p className="text-sm text-neutral-600">
            Click the check icon to mark the correct answer
          </p>
        </div>
      )}

      {formData.type === "FreeAnswer" && (
        <div className="space-y-2">
          <Label htmlFor="questionAnswer">Question answer</Label>
          <Textarea
            id="questionAnswer"
            value={formData.correctAnswer}
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                correctAnswer: event.target.value,
              }))
            }
            placeholder="Enter answer..."
            rows={3}
            required
            disabled={isSubmitting}
          />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {question ? "Updating..." : "Creating..."}
            </>
          ) : question ? (
            "Update"
          ) : (
            "Create"
          )}
        </Button>
      </div>
    </form>
  );
}
