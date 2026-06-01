import {useEffect, useRef, useState} from "react";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "../ui/dialog";
import {Button} from "../ui/button";
import {Label} from "../ui/label";
import {FileUpload} from "../ui/file-upload";
import {QuestionGroup, QuestionGroupFormData} from "../../models/questionGroups";
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
import {
    MathQuillInput,
    type MathInputHandle,
} from "../math/MathQuillField";
import { DesmosMathFieldKeyboard } from "../../../desmos-calculator-react";

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
    const mathInputUzRef = useRef<MathInputHandle>(null);
    const mathInputRuRef = useRef<MathInputHandle>(null);
    const [activeInputFocus, setActiveInputFocus] = useState<"uz" | "ru">("uz");
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    const activeMathRef =
        activeInputFocus === "ru" ? mathInputRuRef : mathInputUzRef;

    useEffect(() => {
        if (isOpen) {
            fetchTests();
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            setIsKeyboardVisible(false);
            setActiveInputFocus("uz");
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

        if (!formData.testId) {
            toast.error("Please select a test");
            return;
        }

        if (!formData.textUz.trim() || !formData.textRu.trim()) {
            toast.error("Please fill in both question group titles");
            return;
        }

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
                <form onSubmit={handleSubmit} className={`space-y-4 ${isKeyboardVisible ? "pb-[300px]" : ""}`}>
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

                    <MathQuillInput
                        key={`group-title-uz-${group?.id ?? "new"}-${isOpen ? "open" : "closed"}`}
                        ref={mathInputUzRef}
                        label="Group Title (UZ)"
                        initialValue={formData.textUz}
                        onInput={(latex) =>
                            setFormData((prev) => ({...prev, textUz: latex}))
                        }
                        onFocus={() => setActiveInputFocus("uz")}
                        onToggleKeyboard={() => {
                            setActiveInputFocus("uz");
                            setIsKeyboardVisible((prev) => !prev);
                        }}
                        disabled={isSubmitting}
                    />

                    <MathQuillInput
                        key={`group-title-ru-${group?.id ?? "new"}-${isOpen ? "open" : "closed"}`}
                        ref={mathInputRuRef}
                        label="Group Title (RU)"
                        initialValue={formData.textRu}
                        onInput={(latex) =>
                            setFormData((prev) => ({...prev, textRu: latex}))
                        }
                        onFocus={() => setActiveInputFocus("ru")}
                        onToggleKeyboard={() => {
                            setActiveInputFocus("ru");
                            setIsKeyboardVisible((prev) => !prev);
                        }}
                        disabled={isSubmitting}
                    />

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

                    <DesmosMathFieldKeyboard
                        mathInputRef={activeMathRef}
                        isVisible={isKeyboardVisible && !isSubmitting}
                        onClose={() => setIsKeyboardVisible(false)}
                    />
                </form>
            </DialogContent>
        </Dialog>
    );
}
