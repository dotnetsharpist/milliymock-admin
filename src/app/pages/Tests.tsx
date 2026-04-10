import {useState, useEffect} from "react";
import {Button} from "../components/ui/button";
import {Plus, Edit, Trash2} from "lucide-react";
import {DataTable, Column} from "../components/DataTable";
import {Test} from "../data/mockData";
import {TestModal} from "../components/modals/TestModal";
import {toast} from "sonner";
import {testService} from "../services";
import {useApi, useMutation} from "../hooks/useApi";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../components/ui/alert-dialog";

export function Tests() {
    const [tests, setTests] = useState<Test[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTest, setEditingTest] = useState<Test | undefined>();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [testToDelete, setTestToDelete] = useState<Test | null>(null);


    // Fetch tests on mount
    const {loading, error, execute: fetchTests} = useApi<Test[]>({
        onSuccess: (data) => setTests(data),
        onError: (error) => toast.error(error),
    });

    // Delete mutation
    const {mutate: deleteTest, loading: deleting} = useMutation({
        onSuccess: () => {
            toast.success("Test deleted successfully");
            setDeleteDialogOpen(false);
            setTestToDelete(null);
            fetchTests(() => testService.getTests());
        },
        onError: (error) => toast.error(error),
    });

    useEffect(() => {
        fetchTests(() => testService.getTests());
        }, []);

    const handleCreate = () => {
        setEditingTest(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (test: Test) => {
        setEditingTest(test);
        setIsModalOpen(true);
    };

    const handleDelete = async (test: Test) => {
        setTestToDelete(test);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (testToDelete) {
            await deleteTest(() => testService.deleteTest(testToDelete.id));
        }
    };

    const handleSave = async (test: Test) => {
        // Refresh the list after save
        await fetchTests(() => testService.getTests());
        setIsModalOpen(false);
    };

    const columns: Column<Test>[] = [
        {header: "Title", accessor: "title"},
        {
            header: "Description",
            accessor: (test) => test.description || "-"
        },
        {
            header: "Question Count",
            accessor: (test) => (
                <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {test.questionCount}
        </span>
            ),
        },
        {
            header: "Actions",
            accessor: (test) => (
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(test)}
                        disabled={loading || deleting}
                    >
                        <Edit className="w-4 h-4"/>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(test)}
                        disabled={loading || deleting}
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
                    <h1 className="text-3xl font-semibold text-neutral-900">Tests</h1>
                    <p className="text-neutral-600 mt-1">
                        Manage your test suites and assessments
                    </p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2"/>
                    Create Test
                </Button>
            </div>

            <DataTable
                data={tests}
                columns={columns}
                searchPlaceholder="Search tests..."
                emptyMessage="No tests found. Create your first test to get started."
                isLoading={loading}
            />

            <TestModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                test={editingTest}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the test "{testToDelete?.title}". This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}