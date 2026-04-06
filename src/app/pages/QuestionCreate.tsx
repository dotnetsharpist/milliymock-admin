import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { StandaloneQuestionForm } from "../components/forms/StandaloneQuestionForm";

export function QuestionCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedTestId = searchParams.get("testId");

  const backHref = useMemo(
    () => (selectedTestId ? `/questions?testId=${selectedTestId}` : "/questions"),
    [selectedTestId]
  );

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
          Back to Questions
        </Button>

        <h1 className="text-3xl font-semibold text-neutral-900">Create Question</h1>
        <p className="mt-1 text-neutral-600">
          Build the question on its own page so the math keyboard can work without
          fighting the modal layer.
        </p>
      </div>

      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <StandaloneQuestionForm
          defaultTestId={selectedTestId}
          onCancel={() => navigate(backHref)}
          onSuccess={() => navigate(backHref)}
          enableContentBuilder
        />
      </div>
    </div>
  );
}
