import {useEffect, useState} from "react";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "../ui/dialog";
import {Button} from "../ui/button";
import {Input} from "../ui/input";
import {Label} from "../ui/label";
import {Textarea} from "../ui/textarea";
import {Question, Option} from "../../data/mockData";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";

import {QuestionGroupQuestionCreate} from "../../models/questionGroups";
import { questionService } from "../../services/questionService";
import {toast} from "sonner";

interface QuestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (question: QuestionGroupQuestionCreate) => void;
    question?: QuestionGroupQuestionCreate;
    groupId: string;
    availableOptions: Option[];
}

export function QuestionModal({
                                  isOpen,
                                  onClose,
                                  onSave,
                                  question,
                                  groupId,
                                  availableOptions
                              }: QuestionModalProps) {
    const [formData, setFormData] = useState({
        text: "",
        type: "Matching" as Question["type"],
        order: 1,
        score: "",
        correctOptionId: "",
        correctAnswer: ""
    });

    useEffect(() => {
        if (question) {
            setFormData({
                text: question.text,
                type: question.type,
                order: question.order,
                score: question.score,
                correctOptionId: question.correctOptionId || "",
                correctAnswer: question.correctAnswer || ""
            });
        } else {
            setFormData({
                text: "",
                type: "Matching",
                order: 1,
                score: "",
                correctOptionId: "",
                correctAnswer: ""
            });
        }
    }, [question, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newQuestion: QuestionGroupQuestionCreate = {
            questionGroupId: groupId,
            text: formData.text,
            type: formData.type,
            order: formData.order,
            score: formData.score,
            correctOptionId:
                formData.type === "Matching"
                    ? formData.correctOptionId
                    : undefined,
            correctAnswer: formData.correctAnswer
        };

        try {
            const response = await questionService.createQuestionGroupQuestion(newQuestion);

            if (response.success && response.data) {
                toast.success("Question created successfully");

                onSave?.(response.data); // update parent list
                onClose(); // close modal
            } else {
                toast.error("Failed to create question");
            }
        } catch (error) {
            console.error("Error creating question:", error);
            toast.error("Something went wrong");
        } finally {
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>
                        {question ? "Edit Question" : "Add New Question"}
                    </DialogTitle>
                    <DialogDescription>
                        {question ? "Update the question details below." : "Add a new question to this question group."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="order">Order</Label>
                            <Input
                                id="order"
                                type="number"
                                min="1"
                                value={formData.order}
                                onChange={(e) => {
                                    const value = e.target.value;

                                    setFormData({
                                        ...formData,
                                        order: value === "" ? "" : parseInt(value),
                                    });
                                }}
                                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="score">Score</Label>
                            <Input
                                id="score"
                                type="number"
                                min="0"
                                step="0.1"
                                value={formData.score}
                                onChange={(e) => {
                                    const value = e.target.value;

                                    setFormData({
                                        ...formData,
                                        score: value === "" ? "" : parseFloat(value),
                                    });
                                }}
                                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="type">Question Type</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value) => setFormData({
                                    ...formData,
                                    type: value as Question["type"],
                                    correctOptionId: ""
                                })}
                            >
                                <SelectTrigger>
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Matching">Matching</SelectItem>
                                    <SelectItem value="FreeAnswer">Free Answer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="text">Question Text</Label>
                        <Textarea
                            id="text"
                            value={formData.text}
                            onChange={(e) =>
                                setFormData({...formData, text: e.target.value})
                            }
                            placeholder="Enter your question..."
                            rows={3}
                            required
                        />
                    </div>


                    {formData.type === "Matching" && (
                        <div className="space-y-2">
                            <Label htmlFor="correctOption">Correct Answer</Label>
                            <Select
                                value={formData.correctOptionId}
                                onValueChange={(value) => setFormData({...formData, correctOptionId: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select the correct option"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {availableOptions.length === 0 ? (
                                        <div className="px-2 py-6 text-center text-sm text-neutral-600">
                                            No options available. Add options first.
                                        </div>
                                    ) : (
                                        availableOptions.map((option) => (
                                            <SelectItem key={option.id} value={option.id}>
                                                {option.text}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            <p className="text-sm text-neutral-600">
                                Select which option from this group's options is the correct answer
                            </p>
                        </div>
                    )}

                    {formData.type === "FreeAnswer" && (
                        <div className="space-y-2">
                            <Label htmlFor="text">Question Text</Label>
                            <Textarea
                                id="text"
                                value={formData.correctAnswer}
                                onChange={(e) =>
                                    setFormData({...formData, correctAnswer: e.target.value})
                                }
                                placeholder="Enter your answer..."
                                rows={3}
                                required
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {question ? "Update" : "Add"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}