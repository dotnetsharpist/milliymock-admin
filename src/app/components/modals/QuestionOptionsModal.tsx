import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { optionService } from "../../services/optionService";

// Local interface for UI state - includes questionId for component logic
// NOTE: API responses don't include questionId, we add it locally for UI management
export interface QuestionOption {
  id: number;
  questionId: number | null;
  questionGroupId: number | null;
  text: string;
  isCorrect: boolean;
}

interface QuestionOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionId: number;
  questionText: string;
  options: QuestionOption[];
  onSave?: (options: QuestionOption[]) => void;
}

export function QuestionOptionsModal({
  isOpen,
  onClose,
  questionId,
  questionText,
  options: initialOptions,
  onSave,
}: QuestionOptionsModalProps) {
  const [options, setOptions] = useState<QuestionOption[]>(initialOptions);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setOptions(initialOptions);
      setHasChanges(false);
    }
  }, [isOpen, initialOptions]);

  const handleAddOption = () => {
    const newOption: QuestionOption = {
      id: Date.now(),
      questionId,
      questionGroupId: null,
      text: "",
      isCorrect: false,
    };
    setOptions([...options, newOption]);
    setHasChanges(true);
  };

  const handleUpdateOption = (id: number, field: "text" | "isCorrect", value: string | boolean) => {
    setOptions(
      options.map((opt) =>
        opt.id === id ? { ...opt, [field]: value } : opt
      )
    );
    setHasChanges(true);
  };

  const handleDeleteOption = (id: number) => {
    setOptions(options.filter((opt) => opt.id !== id));
    setHasChanges(true);
  };

  const handleSave = async () => {
    const emptyOptions = options.filter((opt) => !opt.text.trim());
    if (emptyOptions.length > 0) {
      toast.error("Please fill in all option texts");
      return;
    }

    try {
      setIsSaving(true);

      // Get the question ID as a string for the API call
      const questionIdStr = `sq-${questionId}`;

      // Delete all existing options and create new ones
      const existingOptionsResponse = await optionService.getOptionsByQuestionId(questionIdStr);

      if (existingOptionsResponse.success && existingOptionsResponse.data) {
        await Promise.all(
          existingOptionsResponse.data.map((opt) =>
            optionService.deleteOption(
              typeof opt.id === 'string' ? opt.id : String(opt.id)
            )
          )
        );
      }

      // Create new options
      await Promise.all(
        options.map((opt) =>
          optionService.createOption({
            questionId: questionIdStr,
            text: opt.text,
            isCorrect: opt.isCorrect,
          })
        )
      );

      onSave?.(options);
      toast.success("Options saved successfully");
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving options:", error);
      toast.error("Failed to save options");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Question Options</DialogTitle>
          <DialogDescription>
            Manage options for: <span className="font-medium text-neutral-900">{questionText}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {options.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              No options yet. Click "Add Option" to create one.
            </div>
          ) : (
            <div className="space-y-3">
              {options.map((option, index) => (
                <div
                  key={option.id}
                  className="border border-neutral-200 rounded-lg p-4 space-y-3 bg-neutral-50"
                >
{/*
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-700">
                      Option {index + 1}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteOption(option.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={isSaving}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
*/}

                  <div className="space-y-2">
                    <Label htmlFor={`text-${option.id}`}>Text</Label>
                    <Input
                      id={`text-${option.id}`}
                      value={option.text}
                      placeholder="Enter option text"
                      readOnly={true}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`correct-${option.id}`}>Is Correct?</Label>
                    <Select
                      value={option.isCorrect ? "true" : "false"}
                      readonly={true}
                    >
                      <SelectTrigger id={`correct-${option.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">True</SelectItem>
                        <SelectItem value="false">False</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
