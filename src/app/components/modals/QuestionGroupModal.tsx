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
import {Question} from "../../models/questions";
import {Option} from "../../models/options";
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

    interface QuestionGroupFormState {
        id: string;
        testId: string;
        textUz: string;
        textRu: string;
        ImagePathUz: string;
        ImagePathRu: string;
    }

    const [formData, setFormData] = useState<QuestionGroupFormState>({
        id: "",
        testId: "",
        textUz: "",
        textRu: "",
        ImagePathUz: "",
        ImagePathRu: "",
    });

    const [tests, setTests] = useState<NormalizedTestOption[]>([]);
    const [imageFileUz, setImageFileUz] = useState<File | null>(null);
    const [imageFileRu, setImageFileRu] = useState<File | null>(null);
    const [imagePreviewUz, setImagePreviewUz] = useState<string | undefined>(undefined);
    const [imagePreviewRu, setImagePreviewRu] = useState<string | undefined>(undefined);
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
        return `${BASE_URL}${imagePath}`;
    };

    useEffect(() => {
        if (group) {
            const uz = group.translations.find((t) => t.language === "Uzbek");
            const ru = group.translations.find((t) => t.language === "Russian");

            setFormData({
                id: group.id ?? "",
                testId: String(group.testId ?? ""),
                textUz: uz?.text ?? "",
                textRu: ru?.text ?? "",
                ImagePathUz: uz?.imagePath ?? "",
                ImagePathRu: ru?.imagePath ?? "",
            });

            // previews (for UI)
            setImagePreviewUz(getImageUrl(uz?.imagePath ?? ""));
            setImagePreviewRu(getImageUrl(ru?.imagePath ?? ""));

            // reset uploaded files
            setImageFileUz(null);
            setImageFileRu(null);

        } else {
            setFormData({
                id: "",
                testId: "",
                textUz: "",
                textRu: "",
                ImagePathUz: "",
                ImagePathRu: "",
            });

            setImagePreviewUz(undefined);
            setImagePreviewRu(undefined);

            setImageFileUz(null);
            setImageFileRu(null);
        }
    }, [group, isOpen]);

    const handleImageChangeUz = (file: File | null) => {
        setImageFileUz(file);
        // The FileUpload component handles the preview internally
    };

    const handleImageChangeRu = (file: File | null) => {
        setImageFileRu(file);
        // The FileUpload component handles the preview internally
    };


    const handleImageRemoveUz = () => {
        setImageFileUz(null);
        setImagePreviewUz(undefined);
    };

    const handleImageRemoveRu = () => {
        setImageFileRu(null);
        setImagePreviewRu(undefined);
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const newGroup: QuestionGroupFormData = {
            testId: formData.testId,
            textUz: formData.textUz,
            textRu: formData.textRu,
            imageUz: imageFileUz,
            imageRu: imageFileRu,
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
                        <Label htmlFor="title">Group Title (UZ)</Label>
                        <Input
                            id="title"
                            value={formData.textUz}
                            onChange={(e) =>
                                setFormData({...formData, textUz: e.target.value})
                            }
                            placeholder="e.g., Array Methods Group"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title">Group Title (RU)</Label>
                        <Input
                            id="title"
                            value={formData.textRu}
                            onChange={(e) =>
                                setFormData({...formData, textRu: e.target.value})
                            }
                            placeholder="e.g., Array Methods Group"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Image UZ (optional)</Label>
                        <FileUpload
                            value={imagePreviewUz}
                            onChange={handleImageChangeUz}
                            onRemove={handleImageRemoveUz}
                        />
                        <p className="text-sm text-neutral-600">
                            Add an image for visual context to help students understand the questions
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Image RU (optional)</Label>
                        <FileUpload
                            value={imagePreviewRu}
                            onChange={handleImageChangeRu}
                            onRemove={handleImageRemoveRu}
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
