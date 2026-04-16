import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
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
  MathQuillKeyboard,
  type MathInputHandle,
} from "../components/math/MathQuillField";
import { testService } from "../services/testService";
import { questionGroupService } from "../services";
import type { QuestionGroupFormData } from "../models/questionGroups";
import { toast } from "sonner";

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
  const [searchParams] = useSearchParams();
  const selectedTestId = searchParams.get("testId");

  const backHref = useMemo(() => "/question-groups", []);

  const [formData, setFormData] = useState<QuestionGroupCreateState>({
    testId: "",
    textUz: "",
    textRu: "",
  });
  const [tests, setTests] = useState<NormalizedTestOption[]>([]);
  const [isLoadingTests, setIsLoadingTests] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFileUz, setImageFileUz] = useState<File | null>(null);
  const [imageFileRu, setImageFileRu] = useState<File | null>(null);
  const mathInputUzRef = useRef<MathInputHandle>(null);
  const mathInputRuRef = useRef<MathInputHandle>(null);
  const [activeInputFocus, setActiveInputFocus] = useState<"uz" | "ru">("uz");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const activeMathRef =
    activeInputFocus === "ru" ? mathInputRuRef : mathInputUzRef;

  useEffect(() => {
    void fetchTests();
  }, []);

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

        const preferredTestId =
          selectedTestId &&
          normalizedTests.some((test) => test.id === selectedTestId)
            ? selectedTestId
            : normalizedTests[0]?.id ?? "";

        setFormData((prev) => ({
          ...prev,
          testId: prev.testId || preferredTestId,
        }));
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
      const response = await questionGroupService.createQuestionGroup(payload);

      if (response.success && response.data) {
        toast.success("Question group created successfully");
        navigate(backHref);
      } else {
        toast.error("Failed to create question group");
      }
    } catch (error) {
      console.error("Error creating question group:", error);
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          Create Question Group
        </h1>
        <p className="mt-1 text-neutral-600">
          Group title uchun math input va digital keyboard endi alohida page’da
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
            ref={mathInputUzRef}
            label="Group Title (UZ)"
            initialValue=""
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
            ref={mathInputRuRef}
            label="Group Title (RU)"
            initialValue=""
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
                onChange={setImageFileUz}
                onRemove={() => setImageFileUz(null)}
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
                onChange={setImageFileRu}
                onRemove={() => setImageFileRu(null)}
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
              {isSubmitting ? "Creating..." : "Create"}
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
