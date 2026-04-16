import {useEffect, useState} from "react";
import {useNavigate} from "react-router";
import {Button} from "../components/ui/button";
import {Plus, Edit, Trash2, ChevronRight} from "lucide-react";
import {DataTable, Column} from "../components/DataTable";
import {mockTests} from "../data/mockData";
import {QuestionGroup} from "../models/questionGroups";
import {QuestionGroupModal} from "../components/modals/QuestionGroupModal";
import {TestFilter} from "../components/TestFilter";
import {toast} from "sonner";
import questionGroupService from "../services/questionGroupService";
import {BASE_URL} from "../config/api";

export function QuestionGroups() {
    const navigate = useNavigate();
    const [groups, setGroups] = useState<QuestionGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<QuestionGroup | undefined>();
    const [selectedTestId, setSelectedTestId] = useState<string | null>(null);


    useEffect(() => {
        fetchQuestionGroups();
    }, [selectedTestId]);

    const fetchQuestionGroups = async () => {
        try {
            setIsLoading(true);
            const response = await questionGroupService.getQuestionGroupsByTestId(selectedTestId);

            if (response.success && response.data) {
                setGroups(response.data);
                console.log(response.data)
            } else {
                toast.error("Failed to load questions");
                setGroups([]);
            }
        } catch (error) {
            toast.error("Error loading question groups");
            console.error("Error fetching question groups:", error);
            setGroups([]);
        } finally {
            setIsLoading(false);
        }
    };


    const handleCreate = () => {
        const nextHref = selectedTestId
            ? `/question-groups/new?testId=${selectedTestId}`
            : "/question-groups/new";
        navigate(nextHref);
    };

    const handleEdit = (group: QuestionGroup) => {
        setEditingGroup(group);
        setIsModalOpen(true);
    };

    const handleDelete = async (groupId: string) => {
        const res = await questionGroupService.deleteQuestionGroup(groupId);

        if (res.success) {
            setGroups(groups.filter((g) => g.id !== groupId));
            toast.success("Question group deleted successfully");
        } else {
            toast.error(res.error || "Failed to delete question group");
        }
    };

    const handleSave = (group: QuestionGroup) => {
        if (editingGroup) {
            setGroups(groups.map((g) => (g.id === group.id ? group : g)));
            toast.success("Question group updated successfully");
        } else {
            setGroups([...groups, group]);
            toast.success("Question group created successfully");
        }
        setIsModalOpen(false);
    };

    const handleRowClick = (group: QuestionGroup) => {
        navigate(`/question-groups/${group.id}`);
    };

    const getTestTitle = (testId: string) => {
        const test = mockTests.find((t) => t.id === testId);
        return test?.title || "Unknown Test";
    };

    const getImageUrl = (imagePath: string | undefined) => {
        if (!imagePath) return undefined;
        // Remove leading slash if present to avoid double slashes
        const cleanPath = imagePath;
        return `${BASE_URL}${cleanPath}`;
    };

    const columns: Column<QuestionGroup>[] = [
        {
            header: "Title",
            accessor: (group) => (
                <div className="flex items-center gap-2">
                    <span className="font-medium">{group.translations?.[0]?.text ?? "No translation"}</span>
                    <ChevronRight className="w-4 h-4 text-neutral-400"/>
                </div>
            ),
        },
        {
            header: "Image",
            accessor: (group) => {
                // Check if the first translation and its imagePath exist safely
                const imagePath = group.translations?.[0]?.imagePath;

                return imagePath ? (
                    <img
                        src={getImageUrl(imagePath)}
                        alt="preview"
                        className="w-10 h-10 object-cover rounded-md border"
                    />
                ) : (
                    <div className="w-10 h-10 flex items-center justify-center bg-neutral-100 rounded-md text-xs text-neutral-400">
                        N/A
                    </div>
                );
            },
        },
        {
            header: "Questions",
            accessor: (group) => (
                <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          {group.questionCount}
        </span>
            ),
        },
        {
            header: "Actions",
            accessor: (group) => (
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(group)}
                    >
                        <Edit className="w-4 h-4"/>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(group.id)}
                    >
                        <Trash2 className="w-4 h-4 text-red-600"/>
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-semibold text-neutral-900">Question Groups</h1>
                    <p className="text-neutral-600 mt-1">
                        Manage question groups with shared context and options
                    </p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2"/>
                    Create Group
                </Button>
            </div>

            {/* Test Filter */}
            <TestFilter
                selectedTestId={selectedTestId}
                onTestChange={setSelectedTestId}
            />

            <DataTable
                data={groups}
                columns={columns}
                searchPlaceholder="Search question groups..."
                emptyMessage="No question groups found. Create your first group to get started."
                onRowClick={handleRowClick}
            />

            <QuestionGroupModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                group={editingGroup}
            />
        </div>
    );
}
