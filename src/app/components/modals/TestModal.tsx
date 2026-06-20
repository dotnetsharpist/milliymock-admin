import { useEffect, useState } from "react";
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
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { Test, Status } from "../../models/tests";
import { testService } from "../../services";
import { toast } from "sonner";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";

interface TestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (test: Test) => void;
    test?: Test;
}

export function TestModal({
    isOpen,
    onClose,
    onSave,
    test,
}: TestModalProps) {
    const [formData, setFormData] = useState<{
        title: string;
        description: string;
        subject: string;
        isPremium: boolean;
        price: string;
        durationMinutes: string;
        status: Status | "";
    }>({
        title: "",
        description: "",
        subject: "",
        isPremium: false,
        price: "",
        durationMinutes: "",
        status: "",
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (test) {
            setFormData({
                title: test.title,
                description: test.description || "",
                subject: test.subject || "",
                isPremium: test.isPremium ?? false,
                price: test.price != null ? String(test.price) : "",
                durationMinutes:
                    test.durationMinutes != null
                        ? String(test.durationMinutes)
                        : "",
                status: test.status || "",
            });
        } else {
            setFormData({
                title: "",
                description: "",
                subject: "",
                isPremium: false,
                price: "",
                durationMinutes: "",
                status: "",
            });
        }
    }, [test, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!formData.subject.trim()) {
                toast.error("Please select a subject");
                return;
            }

            const durationMinutes = Number(formData.durationMinutes);

            if (
                !formData.durationMinutes.trim() ||
                !Number.isInteger(durationMinutes) ||
                durationMinutes <= 0
            ) {
                toast.error("Please enter a valid duration in minutes");
                return;
            }

            let price: number | null = null;

            if (formData.isPremium) {
                price = Number(formData.price);

                if (
                    !formData.price.trim() ||
                    !Number.isInteger(price) ||
                    price <= 0
                ) {
                    toast.error("Please enter a valid whole-number price for the premium test");
                    return;
                }
            }

            const payload = {
                title: formData.title.trim(),
                description: formData.description.trim() || null,
                subject: formData.subject.trim(),
                isPremium: formData.isPremium,
                price,
                durationMinutes,
                ...(test && { status: formData.status }),
            };

            if (test) {
                if (!formData.status) {
                    toast.error("Please select a status");
                    return;
                }

                const response = await testService.updateTest(
                    test.id,
                    payload
                );

                if (response.success && response.data) {
                    toast.success("Test updated successfully");
                    onSave(response.data);
                } else {
                    toast.error(
                        response.error || "Failed to update test"
                    );
                }
            } else {
                const response = await testService.createTest(payload);

                if (response.success && response.data) {
                    toast.success("Test created successfully");
                    onSave(response.data);
                } else {
                    toast.error(
                        response.error || "Failed to create test"
                    );
                }
            }
        } catch (error) {
            toast.error("Something went wrong");
            console.error(error);
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
                        {test
                            ? "Update the test details below."
                            : "Create a new test by filling in the details below."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>

                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    title: e.target.value,
                                }))
                            }
                            placeholder="e.g. JavaScript Fundamentals"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">
                            Description (optional)
                        </Label>

                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                }))
                            }
                            placeholder="Brief description of the test..."
                            rows={4}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>

                        <Select
                            value={formData.subject}
                            onValueChange={(value) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    subject: value,
                                }))
                            }
                            disabled={loading}
                        >
                            <SelectTrigger id="subject">
                                <SelectValue placeholder="Select subject" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="Math">Math</SelectItem>

                                <SelectItem value="Biology">
                                    Biology
                                </SelectItem>

                                <SelectItem value="History">
                                    History
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="durationMinutes">
                            Duration (minutes)
                        </Label>

                        <Input
                            id="durationMinutes"
                            type="number"
                            min="1"
                            step="1"
                            value={formData.durationMinutes}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    durationMinutes: e.target.value.replace(
                                        /[^0-9]/g,
                                        ""
                                    ),
                                }))
                            }
                            placeholder="e.g. 60"
                            required
                        />
                    </div>

                    <div className="flex items-center justify-between rounded-md border border-neutral-200 p-3">
                        <div className="space-y-0.5">
                            <Label htmlFor="isPremium">Premium test</Label>

                            <p className="text-sm text-neutral-500">
                                Require payment to access this test.
                            </p>
                        </div>

                        <Switch
                            id="isPremium"
                            checked={formData.isPremium}
                            onCheckedChange={(checked) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    isPremium: checked,
                                    price: checked ? prev.price : "",
                                }))
                            }
                            disabled={loading}
                        />
                    </div>

                    {formData.isPremium && (
                        <div className="space-y-2">
                            <Label htmlFor="price">Price</Label>

                            <Input
                                id="price"
                                type="number"
                                min="1"
                                step="1"
                                value={formData.price}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        price: e.target.value.replace(
                                            /[^0-9]/g,
                                            ""
                                        ),
                                    }))
                                }
                                placeholder="e.g. 10"
                                required
                            />
                        </div>
                    )}

                    {test && (
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>

                            <Select
                                value={formData.status}
                                onValueChange={(value) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        status: value as Status,
                                    }))
                                }
                                disabled={loading}
                            >
                                <SelectTrigger id="status">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="Draft">
                                        Draft
                                    </SelectItem>

                                    <SelectItem value="Published">
                                        Published
                                    </SelectItem>

                                    <SelectItem value="Archived">
                                        Archived
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            disabled={loading}
                        >
                            {loading
                                ? "Saving..."
                                : test
                                ? "Update"
                                : "Create"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}