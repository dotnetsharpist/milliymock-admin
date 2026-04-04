import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { FileUpload } from "../ui/file-upload";
import { StandaloneQuestion, StandaloneOption, Test } from "../../data/mockData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Plus, Trash2, CheckCircle, Loader2 } from "lucide-react";
import { standaloneQuestionService } from "../../services/standaloneQuestionService";
import { standaloneOptionService } from "../../services/standaloneOptionService";
import { testService } from "../../services/testService";
import { toast } from "sonner";
import { BASE_URL } from "../../config/api";

interface StandaloneQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: StandaloneQuestion) => void;
  question?: StandaloneQuestion;
}

export function StandaloneQuestionModal({ isOpen, onClose, onSave, question }: StandaloneQuestionModalProps) {
  const [formData, setFormData] = useState({
    testId: "",
    text: "",
    type: "MultipleChoice" as StandaloneQuestion["type"],
    order: 1,
  });

  const [tests, setTests] = useState<Test[]>([]);
  const [isLoadingTests, setIsLoadingTests] = useState(false);
  const [options, setOptions] = useState<Array<{ id: string; text: string; isCorrect: boolean }>>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  // Helper function to get the full image URL from imagePath
  const getImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return undefined;
    // Remove leading slash if present to avoid double slashes
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `${BASE_URL}${cleanPath}`;
  };

  // Fetch tests on modal open
  useEffect(() => {
    if (isOpen) {
      fetchTests();
    }
  }, [isOpen]);

  const fetchTests = async () => {
    try {
      setIsLoadingTests(true);
      const response = await testService.getTests();

      if (response.success && response.data) {
        setTests(response.data);

        // Set default testId if creating new question
        if (!question && response.data.length > 0) {
          setFormData(prev => ({
            ...prev,
            testId: response.data[0].id
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

  useEffect(() => {
    if (question) {
      setFormData({
        testId: question.testId,
        text: question.text,
        type: question.type,
        order: question.order,
      });
      // Use imagePath from GET response to display the existing image
      setImagePreview(getImageUrl(question.imagePath));
      setImageFile(null);

      // Load existing options for this question from API
      if (question.type === "MultipleChoice") {
        loadOptions(question.id);
      } else {
        setOptions([]);
      }
    } else {
      // Reset form when creating new question
      setFormData({
        testId: tests.length > 0 ? tests[0].id : "",
        text: "",
        type: "MultipleChoice",
        order: 1,
      });
      setOptions([]);
      setImagePreview(undefined);
      setImageFile(null);
    }
  }, [question, isOpen, tests]);

  const loadOptions = async (questionId: string) => {
    try {
      setIsLoadingOptions(true);
      const response = await standaloneOptionService.getOptionsByQuestionId(questionId);

      if (response.success && response.data) {
        const existingOptions = response.data.map((opt) => ({
          id: typeof opt.id === 'string' ? opt.id : String(opt.id),
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
    // The FileUpload component handles the preview internally
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setImagePreview(undefined);
  };

  const handleAddOption = () => {
    setOptions([...options, { id: `temp-${Date.now()}`, text: "", isCorrect: false }]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, text: string) => {
    const newOptions = [...options];
    newOptions[index].text = text;
    setOptions(newOptions);
  };

  const handleToggleCorrect = (index: number) => {
    const newOptions = options.map((opt, i) => ({
      ...opt,
      isCorrect: i === index,
    }));
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate testId
    if (!formData.testId) {
      toast.error("Please select a test");
      return;
    }

    // Validate that MultipleChoice questions have options
    if (formData.type === "MultipleChoice") {
      if (options.length === 0) {
        toast.error("Multiple choice questions must have at least one option");
        return;
      }
      if (!options.some(opt => opt.isCorrect)) {
        toast.error("Please select one correct answer");
        return;
      }
    }

    try {
      setIsSubmitting(true);

      if (question) {
        // Update existing question
        const response = await standaloneQuestionService.updateQuestion(question.id, {
          testId: formData.testId,
          text: formData.text,
          type: formData.type,
          order: formData.order,
          image: imageFile || undefined,
        });

        if (response.success && response.data) {
          // Update options for MultipleChoice questions
          if (formData.type === "MultipleChoice") {
            await saveOptions(response.data.id);
          }
          toast.success("Question updated successfully");
          onSave(response.data);
        } else {
          toast.error("Failed to update question");
        }
      } else {
        // Create new question
        const response = await standaloneQuestionService.createQuestion({
          testId: formData.testId,
          text: formData.text,
          type: formData.type,
          order: formData.order,
          image: imageFile || undefined,
        });

        if (response.success && response.data) {
          // Create options for MultipleChoice questions
          if (formData.type === "MultipleChoice") {
            await saveOptions(response.data.id);
          }
          toast.success("Question created successfully");
          onSave(response.data);
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

  const saveOptions = async (questionId: string) => {
    try {
      // Delete all existing options and create new ones
      // This is a simplified approach - in production, you'd want to do a proper diff
      const existingOptionsResponse = await standaloneOptionService.getOptionsByQuestionId(questionId);

      if (existingOptionsResponse.success && existingOptionsResponse.data) {
        // Delete existing options
        await Promise.all(
          existingOptionsResponse.data.map((opt) =>
            standaloneOptionService.deleteOption(
              typeof opt.id === 'string' ? opt.id : String(opt.id)
            )
          )
        );
      }

      // Create new options
      await Promise.all(
        options.map((opt) =>
          standaloneOptionService.createOption({
            questionId,
            text: opt.text,
            isCorrect: opt.isCorrect,
          })
        )
      );
    } catch (error) {
      console.error("Error saving options:", error);
      toast.error("Error saving options");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {question ? "Edit Question" : "Create New Question"}
          </DialogTitle>
          <DialogDescription>
            {question ? "Update the standalone question details below." : "Create a new standalone question with its own options."}
          </DialogDescription>
        </DialogHeader>
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
                            <SelectValue placeholder={isLoadingTests ? "Loading tests..." : "Select a test"} />
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
                onChange={(e) =>
                  setFormData({ ...formData, order: parseInt(e.target.value) || 1 })
                }
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Question Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as StandaloneQuestion["type"] })}
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

          <div className="space-y-2">
            <Label htmlFor="text">Question Text</Label>
            <Textarea
              id="text"
              value={formData.text}
              onChange={(e) =>
                setFormData({ ...formData, text: e.target.value })
              }
              placeholder="Enter your question..."
              rows={3}
              required
              disabled={isSubmitting}
            />
          </div>

          {formData.type === "MultipleChoice" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Answer Options</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddOption} disabled={isSubmitting}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Option
                </Button>
              </div>

              {isLoadingOptions ? (
                <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <p className="text-sm text-neutral-600">Loading options...</p>
                </div>
              ) : options.length === 0 ? (
                <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 text-center">
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
                        <CheckCircle className="w-4 h-4" />
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
                        <Trash2 className="w-4 h-4 text-red-600" />
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
            <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <p className="text-sm text-neutral-600">
                Free answer questions allow students to provide written responses.
                No answer options needed.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {question ? "Updating..." : "Creating..."}
                </>
              ) : (
                question ? "Update" : "Create"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}