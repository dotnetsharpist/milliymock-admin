import {useEffect, useState} from "react";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "../ui/dialog";
import {Button} from "../ui/button";
import {Input} from "../ui/input";
import {Label} from "../ui/label";
import {FileUpload} from "../ui/file-upload";
import {QuestionGroup, QuestionGroupFormData} from "../../models/questionGroups";
import {Test} from "../../models/tests";
import {testService} from "../../services/testService";
import { questionGroupService} from "../../services";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import {BASE_URL} from "../../config/api";
import {toast} from "sonner";

interface QuestionGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (group: QuestionGroup) => void;
    group?: QuestionGroup;
}

interface NormalizedTestOption {
    id: string;
    title: string;
}

export function QuestionGroupModal({isOpen, onClose, onSave, group}: QuestionGroupModalProps) {
    const [formData, setFormData] = useState({
        title: "",
        testId: "",
    });
    const [tests, setTests] = useState<NormalizedTestOption[]>([]);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | undefined>(undefined);
    const [isLoadingTests, setIsLoadingTests] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
                const normalizedTests = response.data.map((test) => ({
                    id: String(test.id),
                    title: test.title,
                }));

                setTests(normalizedTests);

                // Set default testId if creating new question
                if (!group && normalizedTests.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        testId: prev.testId || normalizedTests[0].id
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
    // Helper function to get the full image URL from imagePath
    const getImageUrl = (imagePath: string | undefined) => {
        if (!imagePath) return undefined;
        // Remove leading slash if present to avoid double slashes
        const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
        return `${BASE_URL}${cleanPath}`;
    };

    useEffect(() => {
        if (group) {
            setFormData({
                title: group.title,
                testId: String(group.testId),
            });
            // Use imagePath from GET response to display the existing image
            setImagePreview(getImageUrl(group.imagePath));
            setImageFile(null);
        } else {
            setFormData({
                title: "",
                testId: "",
            });
            setImagePreview(undefined);
            setImageFile(null);
        }
    }, [group, isOpen]);

    const handleImageChange = (file: File | null) => {
        setImageFile(file);
        // The FileUpload component handles the preview internally
    };

    const handleImageRemove = () => {
        setImageFile(null);
        setImagePreview(undefined);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const newGroup: QuestionGroupFormData = {
            title: formData.title,
            testId: formData.testId,
            image: imageFile
        };

        try {
            const response = await questionGroupService.createQuestionGroup(newGroup);

            if (response.success && response.data) {
                toast.success("Question group created successfully");

                onSave?.(response.data); // if you pass callback
            } else {
                toast.error("Failed to create question group");
            }
        } catch (error) {
            console.error("Error creating group:", error);
            toast.error("Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {group ? "Edit Question Group" : "Create New Question Group"}
                    </DialogTitle>
                    <DialogDescription>
                        {group ? "Update the question group details below." : "Create a new question group within a test."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="test">Test</Label>
                        <Select
                            value={formData.testId}
                            onValueChange={(value) => setFormData({...formData, testId: value})}
                            disabled={isLoadingTests}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={isLoadingTests ? "Loading tests..." : "Select a test"}/>
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

                    <div className="space-y-2">
                        <Label htmlFor="title">Group Title</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) =>
                                setFormData({...formData, title: e.target.value})
                            }
                            placeholder="e.g., Array Methods Group"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Image (optional)</Label>
                        <FileUpload
                            value={imagePreview}
                            onChange={handleImageChange}
                            onRemove={handleImageRemove}
                        />
                        <p className="text-sm text-neutral-600">
                            Add an image for visual context to help students understand the questions
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {group ? "Update" : "Create"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
