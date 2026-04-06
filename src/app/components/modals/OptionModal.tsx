import {useEffect, useState} from "react";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "../ui/dialog";
import {Button} from "../ui/button";
import {Input} from "../ui/input";
import {Label} from "../ui/label";
import {Option} from "../../data/mockData";
import { standaloneOptionService } from "../../services";
import {CreateOptionForQuestionGroupData} from "../../models/options"
import {toast} from "sonner";

interface OptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (option: CreateOptionForQuestionGroupData) => void;
    option?: Option;
    groupId: string;
}

export function OptionModal({isOpen, onClose, onSave, option, groupId}: OptionModalProps) {
    const [text, setText] = useState("");

    useEffect(() => {
        if (option) {
            setText(option.text);
        } else {
            setText("");
        }
    }, [option, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newOption: CreateOptionForQuestionGroupData = {
            questionGroupId: Number(groupId),
            text: text
        };

        try {
            const response = await standaloneOptionService.createOptionForQuestionGroup(newOption);

            if (response.success && response.data) {
                toast.success("Option created successfully");

                onSave?.(response.data); // update parent
                onClose(); // close modal
            } else {
                toast.error("Failed to create option");
            }
        } catch (error) {
            console.error("Error creating option:", error);
            toast.error("Something went wrong");
        } finally {
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {option ? "Edit Option" : "Add New Option"}
                    </DialogTitle>
                    <DialogDescription>
                        {option ? "Update the option text below." : "Add a new option that can be used as an answer choice."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="text">Option Text</Label>
                        <Input
                            id="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Enter the option text"
                            required
                        />
                        <p className="text-sm text-neutral-600">
                            This option will be available for questions in this group to select as the correct answer
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {option ? "Update" : "Add"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}