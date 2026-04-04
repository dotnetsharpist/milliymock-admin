import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Test } from "../../data/mockData";
import { testService } from "../../services";
import { toast } from "sonner";

interface TestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (test: Test) => void;
  test?: Test;
}

export function TestModal({ isOpen, onClose, onSave, test }: TestModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (test) {
      setFormData({
        title: test.title,
        description: test.description || "",
      });
    } else {
      setFormData({
        title: "",
        description: "",
      });
    }
  }, [test, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description.trim() || null,
      };

      if (test) {
        // Update existing test
        const response = await testService.updateTest(test.id, payload);
        if (response.success && response.data) {
          toast.success("Test updated successfully");
          onSave(response.data);
        } else {
          toast.error(response.error || "Failed to update test");
        }
      } else {
        // Create new test
        const response = await testService.createTest(payload);
        if (response.success && response.data) {
          toast.success("Test created successfully");
          onSave(response.data);
        } else {
          toast.error(response.error || "Failed to create test");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {test ? "Edit Test" : "Create New Test"}
          </DialogTitle>
          <DialogDescription>
            {test ? "Update the test details below." : "Create a new test by filling in the details below."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., JavaScript Fundamentals"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Brief description of the test..."
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : test ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}