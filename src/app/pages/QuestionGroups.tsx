import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Plus, Edit, Trash2, ChevronRight } from "lucide-react";
import { DataTable, Column } from "../components/DataTable";
import { mockQuestionGroups, QuestionGroup, mockTests } from "../data/mockData";
import { QuestionGroupModal } from "../components/modals/QuestionGroupModal";
import { TestFilter } from "../components/TestFilter";
import { toast } from "sonner";

export function QuestionGroups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<QuestionGroup[]>(mockQuestionGroups);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<QuestionGroup | undefined>();
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingGroup(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (group: QuestionGroup) => {
    setEditingGroup(group);
    setIsModalOpen(true);
  };

  const handleDelete = (groupId: string) => {
    setGroups(groups.filter((g) => g.id !== groupId));
    toast.success("Question group deleted successfully");
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

  const columns: Column<QuestionGroup>[] = [
    {
      header: "Title",
      accessor: (group) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{group.title}</span>
          <ChevronRight className="w-4 h-4 text-neutral-400" />
        </div>
      ),
    },
    {
      header: "Test",
      accessor: (group) => (
        <span className="text-neutral-600">{getTestTitle(group.testId)}</span>
      ),
    },
    {
      header: "Questions",
      accessor: (group) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          {group.questionCount}
        </span>
      ),
    },
    {
      header: "Created",
      accessor: (group) => new Date(group.createdAt).toLocaleDateString(),
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
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(group.id)}
          >
            <Trash2 className="w-4 h-4 text-red-600" />
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
          <Plus className="w-4 h-4 mr-2" />
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
