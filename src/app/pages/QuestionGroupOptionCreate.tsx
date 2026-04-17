import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  MathQuillInput,
  MathQuillKeyboard,
  type MathInputHandle,
} from "../components/math/MathQuillField";
import { questionGroupService } from "../services";
import { standaloneOptionService } from "../services";
import type { CreateOptionForQuestionGroupData } from "../models/options";
import type { QuestionGroupDetailModel } from "../models/questionGroups";
import { toast } from "sonner";

export function QuestionGroupOptionCreate() {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const backHref = useMemo(
    () => `/question-groups/${groupId}?tab=options`,
    [groupId]
  );

  const [group, setGroup] = useState<QuestionGroupDetailModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [text, setText] = useState("");
  const mathInputRef = useRef<MathInputHandle>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

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
      } catch (error) {
        console.error("Error loading question group:", error);
        toast.error("Error loading question group");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [groupId, navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!groupId) return;

    if (!text.trim()) {
      toast.error("Please fill in the option text");
      return;
    }

    const payload: CreateOptionForQuestionGroupData = {
      questionGroupId: Number(groupId),
      text,
    };

    try {
      setIsSubmitting(true);
      const response = await standaloneOptionService.createOptionForQuestionGroup(
        payload
      );

      if (response.success && response.data) {
        toast.success("Option created successfully");
        navigate(backHref);
      } else {
        toast.error("Failed to create option");
      }
    } catch (error) {
      console.error("Error creating option:", error);
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
          Back to Group Options
        </Button>

        <h1 className="text-3xl font-semibold text-neutral-900">Add Option</h1>
        <p className="mt-1 text-neutral-600">
          {group?.translations?.[0]?.text ?? "Question group"} uchun option’ni
          alohida page’da yarating. Digital keyboard option text maydonida ham
          ishlaydi.
        </p>
      </div>

      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <form
          onSubmit={handleSubmit}
          className={`space-y-6 ${isKeyboardVisible ? "pb-[300px]" : ""}`}
        >
          <MathQuillInput
            ref={mathInputRef}
            label="Option Text"
            initialValue=""
            onInput={setText}
            onFocus={() => undefined}
            onToggleKeyboard={() => setIsKeyboardVisible((prev) => !prev)}
            disabled={isSubmitting}
          />

          <p className="text-sm text-neutral-600">
            This option will be available for questions in this group to select
            as the correct answer.
          </p>

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
              {isSubmitting ? "Creating..." : "Add Option"}
            </Button>
          </div>

          <MathQuillKeyboard
            mathInputRef={mathInputRef}
            isVisible={isKeyboardVisible && !isSubmitting}
            onClose={() => setIsKeyboardVisible(false)}
          />
        </form>
      </div>
    </div>
  );
}
