import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Question } from "../../models/questions";
import {
  StandaloneQuestionForm,
  StandaloneQuestionFormQuestion,
} from "../forms/StandaloneQuestionForm";

interface StandaloneQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: Question) => void;
  question?: StandaloneQuestionFormQuestion;
}

export function StandaloneQuestionModal({
  isOpen,
  onClose,
  onSave,
  question,
}: StandaloneQuestionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[860px]">
        <DialogHeader>
          <DialogTitle>{question ? "Edit Question" : "Create New Question"}</DialogTitle>
          <DialogDescription>
            {question
              ? "Update the standalone question details below."
              : "Create a new standalone question with its own options."}
          </DialogDescription>
        </DialogHeader>

        <StandaloneQuestionForm
          question={question}
          onCancel={onClose}
          onSuccess={onSave}
        />
      </DialogContent>
    </Dialog>
  );
}
