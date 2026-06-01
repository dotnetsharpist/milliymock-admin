import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { FileUpload } from "../components/ui/file-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  MathQuillInput,
  type MathInputHandle,
} from "../components/math/MathQuillField";
import { DesmosMathFieldKeyboard } from "../../desmos-calculator-react";
import { testService } from "../services/testService";
import { questionGroupService } from "../services";
import type { QuestionGroupFormData } from "../models/questionGroups";
import { toast } from "sonner";
import { BASE_URL } from "../config/api";

interface NormalizedTestOption {
  id: string;
  title: string;
}

interface QuestionGroupCreateState {
  testId: string;
  textUz: string;
  textRu: string;
}

export function QuestionGroupCreate() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const [searchParams] = useSearchParams();
  const selectedTestId = searchParams.get("testId");
  const isEditMode = Boolean(groupId);

  const backHref = useMemo(() => "/question-groups", []);

  const [formData, setFormData] = useState<QuestionGroupCreateState>({
    testId: "",
    textUz: "",
    textRu: "",
  });
  const [tests, setTests] = useState<NormalizedTestOption[]>([]);
  const [isLoadingTests, setIsLoadingTests] = useState(false);
  const [isLoadingGroup, setIsLoadingGroup] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFileUz, setImageFileUz] = useState<File | null>(null);
  const [imageFileRu, setImageFileRu] = useState<File | null>(null);
  const [imagePreviewUz, setImagePreviewUz] = useState<string | undefined>();
  const [imagePreviewRu, setImagePreviewRu] = useState<string | undefined>();
  const mathInputUzRef = useRef<MathInputHandle>(null);
  const mathInputRuRef = useRef<MathInputHandle>(null);
  const [activeInputFocus, setActiveInputFocus] = useState<"uz" | "ru">("uz");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const activeMathRef =
    activeInputFocus === "ru" ? mathInputRuRef : mathInputUzRef;

  useEffect(() => {
    void fetchTests();
  }, []);

  useEffect(() => {
    if (!isEditMode || !groupId) {
      setIsLoadingGroup(false);
      return;
    }

    void (async () => {
      try {
        setIsLoadingGroup(true);
        const response = await questionGroupService.getQuestionGroupById(groupId);

        if (!response.success || !response.data) {
          toast.error("Question group not found");
          navigate(backHref);
          return;
        }

        const uzTranslation = response.data.translations?.find(
          (translation) => translation.language === "Uzbek"
        );
        const ruTranslation = response.data.translations?.find(
          (translation) => translation.language === "Russian"
        );

        setFormData({
          testId: String(response.data.testId ?? ""),
          textUz: uzTranslation?.text ?? "",
          textRu: ruTranslation?.text ?? "",
        });
        setImagePreviewUz(
          uzTranslation?.imagePath ? `${BASE_URL}${uzTranslation.imagePath}` : undefined
        );
        setImagePreviewRu(
          ruTranslation?.imagePath ? `${BASE_URL}${ruTranslation.imagePath}` : undefined
        );
        setImageFileUz(null);
        setImageFileRu(null);
      } catch (error) {
        console.error("Error loading question group:", error);
        toast.error("Error loading question group");
        navigate(backHref);
      } finally {
        setIsLoadingGroup(false);
      }
    })();
  }, [backHref, groupId, isEditMode, navigate]);

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

        if (!isEditMode) {
          const preferredTestId =
            selectedTestId &&
            normalizedTests.some((test) => test.id === selectedTestId)
              ? selectedTestId
              : normalizedTests[0]?.id ?? "";

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.testId) {
      toast.error("Please select a test");
      return;
    }

    if (!formData.textUz.trim() || !formData.textRu.trim()) {
      toast.error("Please fill in both question group titles");
      return;
    }

    const payload: QuestionGroupFormData = {
      testId: formData.testId,
      textUz: formData.textUz,
      textRu: formData.textRu,
      imageUz: imageFileUz,
      imageRu: imageFileRu,
    };

    try {
      setIsSubmitting(true);
      const response = isEditMode && groupId
        ? await questionGroupService.updateQuestionGroup(groupId, payload)
        : await questionGroupService.createQuestionGroup(payload);

      if (response.success && response.data) {
        toast.success(
          isEditMode
            ? "Question group updated successfully"
            : "Question group created successfully"
        );
        navigate(backHref);
      } else {
        toast.error(
          isEditMode
            ? "Failed to update question group"
            : "Failed to create question group"
        );
      }
    } catch (error) {
      console.error("Error saving question group:", error);
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
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
    setImagePreviewUz(undefined);
  };

  const handleImageRemoveRu = () => {
    setImageFileRu(null);
    setImagePreviewRu(undefined);
  };

  if (isEditMode && isLoadingGroup) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(backHref)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Question Groups
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
          Back to Question Groups
        </Button>

        <h1 className="text-3xl font-semibold text-neutral-900">
          {isEditMode ? "Edit Question Group" : "Create Question Group"}
        </h1>
        <p className="mt-1 text-neutral-600">
          Group title uchun math input va digital keyboard alohida page’da
          ishlaydi, shuning uchun modal cheklovi yo‘q.
        </p>
      </div>

      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <form
          onSubmit={handleSubmit}
          className={`space-y-6 ${isKeyboardVisible ? "pb-[300px]" : ""}`}
        >
          <div className="space-y-2">
            <Label htmlFor="test">Test</Label>
            <Select
              value={formData.testId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, testId: value }))
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

          <MathQuillInput
            key={`group-title-uz-${groupId ?? "new"}`}
            ref={mathInputUzRef}
            label="Group Title (UZ)"
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
            key={`group-title-ru-${groupId ?? "new"}`}
            ref={mathInputRuRef}
            label="Group Title (RU)"
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

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Image UZ (optional)</Label>
              <FileUpload
                value={imagePreviewUz}
                onChange={handleImageChangeUz}
                onRemove={handleImageRemoveUz}
                disabled={isSubmitting}
              />
              <p className="text-sm text-neutral-600">
                Add an image for visual context to help students understand the
                questions.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Image RU (optional)</Label>
              <FileUpload
                value={imagePreviewRu}
                onChange={handleImageChangeRu}
                onRemove={handleImageRemoveRu}
                disabled={isSubmitting}
              />
              <p className="text-sm text-neutral-600">
                Add an image for visual context to help students understand the
                questions.
              </p>
            </div>
          </div>

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
                ? "Update"
                : "Create"}
            </Button>
          </div>

          <DesmosMathFieldKeyboard
            mathInputRef={activeMathRef}
            isVisible={isKeyboardVisible && !isSubmitting}
            onClose={() => setIsKeyboardVisible(false)}
          />
        </form>
      </div>
    </div>
  );
}
