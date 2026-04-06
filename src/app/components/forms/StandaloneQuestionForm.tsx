import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { FileUpload } from "../ui/file-upload";
import { Question, QuestionTypeForQuestion } from "../../models/questions";
import { Test } from "../../models/tests";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  CheckCircle,
  Loader2,
  Plus,
  Sigma,
  Trash2,
  Type,
  X,
} from "lucide-react";
import { questionService } from "../../services/questionService";
import { optionService } from "../../services/optionService";
import { testService } from "../../services/testService";
import { toast } from "sonner";
import { BASE_URL } from "../../config/api";
import { MathComposer } from "../math/MathComposer";
import { MathText } from "../math/MathText";
import {
  extractFirstMathExpression,
  hasInlineMath,
  wrapInlineMath,
} from "../../lib/math";

export interface StandaloneQuestionFormQuestion {
  id: string;
  testId: string;
  text: string | null;
  imagePath?: string | null;
  type: QuestionTypeForQuestion;
  order: number;
  score?: number | null;
  correctAnswer?: string | null;
}

interface StandaloneQuestionFormState {
  testId: string;
  text: string;
  imagePath: string;
  correctAnswer: string;
  score: number | "";
  type: QuestionTypeForQuestion;
  order: number | "";
}

interface QuestionContentItem {
  id: string;
  type: "text" | "math";
  value: string;
}

interface NormalizedTestOption {
  id: string;
  title: string;
}

interface StandaloneQuestionFormProps {
  question?: StandaloneQuestionFormQuestion;
  defaultTestId?: string | null;
  onCancel: () => void;
  onSuccess: (question: Question) => void;
  enableContentBuilder?: boolean;
}

const createContentItem = (
  type: QuestionContentItem["type"],
  value = ""
): QuestionContentItem => ({
  id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  type,
  value,
});

const normalizeTextBlock = (value: string) =>
  value.replace(/\s+/g, " ").trim();

const buildQuestionTextFromItems = (items: QuestionContentItem[]) =>
  items
    .map((item) =>
      item.type === "math"
        ? item.value.trim()
          ? wrapInlineMath(item.value)
          : ""
        : normalizeTextBlock(item.value)
    )
    .filter(Boolean)
    .join(" ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();

export function StandaloneQuestionForm({
  question,
  defaultTestId,
  onCancel,
  onSuccess,
  enableContentBuilder = false,
}: StandaloneQuestionFormProps) {
  const [formData, setFormData] = useState<StandaloneQuestionFormState>({
    testId: "",
    text: "",
    imagePath: "",
    correctAnswer: "",
    score: "",
    type: "MultipleChoice",
    order: 1,
  });
  const [tests, setTests] = useState<NormalizedTestOption[]>([]);
  const [isLoadingTests, setIsLoadingTests] = useState(false);
  const [options, setOptions] = useState<
    Array<{ id: string; text: string; isCorrect: boolean }>
  >([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [mathExpression, setMathExpression] = useState("");
  const [contentItems, setContentItems] = useState<QuestionContentItem[]>([]);
  const [editingMathItemId, setEditingMathItemId] = useState<string | null>(
    null
  );
  const questionTextRef = useRef<HTMLTextAreaElement | null>(null);

  const composedQuestionText = useMemo(
    () =>
      enableContentBuilder
        ? buildQuestionTextFromItems(contentItems)
        : formData.text,
    [contentItems, enableContentBuilder, formData.text]
  );

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
        testId: question.testId,
        text: question.text ?? "",
        imagePath: question.imagePath ?? "",
        type: question.type,
        order: question.order,
        correctAnswer: question.correctAnswer ?? "",
        score: question.score ?? "",
      });

      if (enableContentBuilder) {
        setContentItems(
          question.text?.trim()
            ? [createContentItem("text", question.text)]
            : []
        );
        setMathExpression("");
        setEditingMathItemId(null);
      } else {
        setMathExpression(extractFirstMathExpression(question.text));
      }

      setImagePreview(getImageUrl(question.imagePath));
      setImageFile(null);

      if (question.type === "MultipleChoice") {
        void loadOptions(question.id);
      } else {
        setOptions([]);
      }
      return;
    }

    setFormData((prev) => ({
      ...prev,
      text: "",
      imagePath: "",
      type: "MultipleChoice",
      order: 1,
      correctAnswer: "",
      score: "",
    }));
    setOptions([]);
    setImagePreview(undefined);
    setImageFile(null);
    setMathExpression("");
    setEditingMathItemId(null);
    setContentItems([]);
  }, [enableContentBuilder, question]);

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
        const existingOptions = response.data.map((opt) => ({
          id: typeof opt.id === "string" ? opt.id : String(opt.id),
          text: opt.text,
          isCorrect: opt.isCorrect,
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

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setImagePreview(undefined);
  };

  const handleAddOption = () => {
    setOptions([
      ...options,
      { id: `temp-${Date.now()}`, text: "", isCorrect: false },
    ]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, text: string) => {
    const nextOptions = [...options];
    nextOptions[index].text = text;
    setOptions(nextOptions);
  };

  const handleToggleCorrect = (index: number) => {
    setOptions(
      options.map((opt, i) => ({
        ...opt,
        isCorrect: i === index,
      }))
    );
  };

  const updateContentItem = (id: string, value: string) => {
    setContentItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, value } : item))
    );
  };

  const handleAddTextBlock = () => {
    setContentItems((prev) => [...prev, createContentItem("text")]);
  };

  const handleCommitMathBlock = () => {
    if (!mathExpression.trim()) {
      toast.error("Please write a math formula first");
      return;
    }

    if (editingMathItemId) {
      updateContentItem(editingMathItemId, mathExpression);
    } else {
      setContentItems((prev) => [
        ...prev,
        createContentItem("math", mathExpression),
      ]);
    }

    setMathExpression("");
    setEditingMathItemId(null);
  };

  const handleEditMathBlock = (id: string) => {
    const target = contentItems.find((item) => item.id === id);
    if (!target || target.type !== "math") return;

    setEditingMathItemId(id);
    setMathExpression(target.value);
  };

  const handleCancelMathEdit = () => {
    setEditingMathItemId(null);
    setMathExpression("");
  };

  const handleDeleteContentItem = (id: string) => {
    setContentItems((prev) => prev.filter((item) => item.id !== id));
    if (editingMathItemId === id) {
      handleCancelMathEdit();
    }
  };

  const handleInsertMathIntoQuestion = () => {
    if (!mathExpression.trim()) {
      toast.error("Please write a math formula first");
      return;
    }

    const mathToken = wrapInlineMath(mathExpression);
    const textarea = questionTextRef.current;

    if (!textarea) {
      setFormData((prev) => ({
        ...prev,
        text: prev.text ? `${prev.text} ${mathToken}` : mathToken,
      }));
      return;
    }

    const selectionStart = textarea.selectionStart ?? formData.text.length;
    const selectionEnd = textarea.selectionEnd ?? formData.text.length;
    const nextText = `${formData.text.slice(
      0,
      selectionStart
    )}${mathToken}${formData.text.slice(selectionEnd)}`;

    setFormData((prev) => ({
      ...prev,
      text: nextText,
    }));

    window.requestAnimationFrame(() => {
      const cursorPosition = selectionStart + mathToken.length;
      textarea.focus();
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.testId) {
      toast.error("Please select a test");
      return;
    }

    if (formData.order === "" || formData.score === "") {
      toast.error("Please fill in order and score");
      return;
    }

    if (enableContentBuilder) {
      if (contentItems.length === 0) {
        toast.error("Add at least one text or formula block");
        return;
      }

      if (contentItems.some((item) => !item.value.trim())) {
        toast.error("Please fill every content block before saving");
        return;
      }

      if (editingMathItemId) {
        toast.error("Update or cancel the current formula edit before saving");
        return;
      }

      if (mathExpression.trim()) {
        toast.error("Add the formula block to the sequence before saving");
        return;
      }
    } else {
      if (!formData.text.trim()) {
        toast.error("Please enter the question text");
        return;
      }

      if (mathExpression.trim() && !hasInlineMath(formData.text, mathExpression)) {
        toast.error("Insert the formula into question text before saving");
        return;
      }
    }

    if (formData.type === "MultipleChoice") {
      if (options.length === 0) {
        toast.error("Multiple choice questions must have at least one option");
        return;
      }
      if (!options.some((opt) => opt.isCorrect)) {
        toast.error("Please select one correct answer");
        return;
      }
    }

    const questionText = enableContentBuilder ? composedQuestionText : formData.text;

    try {
      setIsSubmitting(true);

      if (question) {
        const response = await questionService.updateQuestion(question.id, {
          TestId: formData.testId,
          Text: questionText,
          Type: formData.type,
          Order: formData.order,
          Score: formData.score,
          CorrectAnswer: formData.correctAnswer,
          Image: imageFile || undefined,
        });

        if (response.success && response.data) {
          toast.success("Question updated successfully");
          onSuccess(response.data);
        } else {
          toast.error("Failed to update question");
        }
      } else {
        const response = await questionService.createQuestion({
          TestId: formData.testId,
          Text: questionText,
          Type: formData.type,
          Score: formData.score,
          Order: formData.order,
          CorrectAnswer: formData.correctAnswer,
          Image: imageFile || undefined,
          Options: options,
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
            onValueChange={(value) => setFormData({ ...formData, testId: value })}
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
            onChange={(e) => {
              const value = e.target.value;
              setFormData({
                ...formData,
                order: value === "" ? "" : parseInt(value),
              });
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
            onChange={(e) => {
              const value = e.target.value;
              setFormData({
                ...formData,
                score: value === "" ? "" : parseFloat(value),
              });
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
            onValueChange={(value) =>
              setFormData({
                ...formData,
                type: value as QuestionTypeForQuestion,
              })
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
        <Label>Image (optional)</Label>
        <FileUpload
          value={imagePreview}
          onChange={handleImageChange}
          onRemove={handleImageRemove}
          disabled={isSubmitting}
        />
      </div>

      {enableContentBuilder ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.95fr)]">
          <div className="space-y-3">
            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Label className="text-sm text-neutral-900">
                    Question Sequence
                  </Label>
                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    Text va formula bloklarini shu yerga yig‘ing. Qaysi blokni
                    avval qo‘shsangiz, backendga ham aynan shu ketma-ketlikda
                    bitta string bo‘lib ketadi.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddTextBlock}
                  disabled={isSubmitting}
                >
                  <Plus className="h-4 w-4" />
                  Add Text Block
                </Button>
              </div>

              {contentItems.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
                  Avval text block qo‘shing yoki o‘ng tomondan formula block yarating.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {contentItems.map((item, index) => (
                    <div
                      key={item.id}
                      className={`rounded-2xl border p-4 transition ${
                        editingMathItemId === item.id
                          ? "border-orange-300 bg-orange-50/70"
                          : "border-neutral-200 bg-neutral-50/70"
                      }`}
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-500">
                            Item {index + 1}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                              item.type === "text"
                                ? "bg-sky-100 text-sky-800"
                                : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {item.type === "text" ? (
                              <Type className="h-3.5 w-3.5" />
                            ) : (
                              <Sigma className="h-3.5 w-3.5" />
                            )}
                            {item.type === "text" ? "Text Block" : "Formula Block"}
                          </span>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteContentItem(item.id)}
                          disabled={isSubmitting}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>

                      {item.type === "text" ? (
                        <Textarea
                          value={item.value}
                          onChange={(e) =>
                            updateContentItem(item.id, e.target.value)
                          }
                          placeholder="Write the text part of the question..."
                          rows={4}
                          disabled={isSubmitting}
                        />
                      ) : (
                        <div className="space-y-3">
                          <div className="rounded-2xl border border-orange-200 bg-white p-3">
                            <MathText
                              value={wrapInlineMath(item.value)}
                              className="min-h-8 text-base text-neutral-900"
                            />
                          </div>
                          <p className="text-sm text-neutral-500">
                            Formula backend uchun avtomatik saqlanadi.
                          </p>
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditMathBlock(item.id)}
                              disabled={isSubmitting}
                            >
                              Edit in Math Panel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Final Preview
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Backendga yuboriladigan yakuniy ko‘rinish.
                  </p>
                </div>
              </div>

              <MathText
                value={composedQuestionText}
                className="mt-3 min-h-12 text-base leading-7 text-neutral-900"
                emptyFallback="Question preview will appear here"
              />
            </div>
          </div>

          <div className="space-y-3">
            <MathComposer
              value={mathExpression}
              onChange={setMathExpression}
              onInsert={handleCommitMathBlock}
              disabled={isSubmitting}
              title="Formula Block"
              description="Math panelda formulani yozing, keyin uni sequence ichiga formula block sifatida qo‘shing."
              actionLabel={
                editingMathItemId ? "Update Formula Block" : "Add Formula Block"
              }
            />

            {editingMathItemId && (
              <div className="flex items-center justify-between rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3">
                <p className="text-sm text-orange-900">
                  Selected formula block is being edited in the math panel.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancelMathEdit}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                  Cancel Edit
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.95fr)]">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="text">Question Text</Label>
              <Textarea
                id="text"
                ref={questionTextRef}
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
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
                value={composedQuestionText}
                className="mt-3 min-h-12 text-base leading-7 text-neutral-900"
                emptyFallback="Question preview will appear here"
              />
            </div>
          </div>

          <MathComposer
            value={mathExpression}
            onChange={setMathExpression}
            onInsert={handleInsertMathIntoQuestion}
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
                <div key={index} className="flex items-center gap-2">
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
                    onChange={(e) => handleOptionChange(index, e.target.value)}
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
            onChange={(e) =>
              setFormData({ ...formData, correctAnswer: e.target.value })
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
