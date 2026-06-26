import { useState, useEffect } from "react";
import { DataTable, Column } from "../components/DataTable";
import { User } from "../data/mockData";
import { Badge } from "../components/ui/badge";
import { userService } from "../services";
import { useApi } from "../hooks/useApi";
import { toast } from "sonner";

const roleColors: Record<string, string> = {
  SuperAdmin: "bg-purple-100 text-purple-800",
  Admin: "bg-red-100 text-red-800",
  User: "bg-green-100 text-green-800",
  // Legacy / fallback labels
  Administrator: "bg-red-100 text-red-800",
  Teacher: "bg-blue-100 text-blue-800",
  Student: "bg-green-100 text-green-800",
};

const isAdminRole = (role: string) =>
  role === "Admin" || role === "SuperAdmin" || role === "Administrator";

export function Users() {
  const [users, setUsers] = useState<User[]>([]);

  const { loading, error, execute: fetchUsers } = useApi<User[]>({
    onSuccess: (data) => setUsers(data),
    onError: (err) => toast.error(err),
  });

  useEffect(() => {
    fetchUsers(() => userService.getUsers());
  }, []);

  const adminCount = users.filter((u) => isAdminRole(u.role)).length;
  const memberCount = users.length - adminCount;

  const columns: Column<User>[] = [
    { header: "Name", accessor: "name" },
    { header: "Email", accessor: "email" },
    {
      header: "Role",
      accessor: (user) => (
        <Badge
          className={roleColors[user.role] || "bg-neutral-100 text-neutral-700"}
        >
          {user.role}
        </Badge>
      ),
    },
    {
      header: "Verified",
      accessor: (user) =>
        user.emailConfirmed === undefined ? (
          "-"
        ) : user.emailConfirmed ? (
          <Badge className="bg-green-100 text-green-800">Verified</Badge>
        ) : (
          <Badge className="bg-amber-100 text-amber-800">Pending</Badge>
        ),
    },
    {
      header: "Joined",
      accessor: (user) =>
        user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-900">Users</h1>
          <p className="text-neutral-600 mt-1">
            View all registered users (read-only)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white rounded-lg border border-neutral-200">
          <p className="text-sm text-neutral-600">Total Users</p>
          <p className="text-2xl font-semibold text-neutral-900 mt-1">
            {loading ? "…" : users.length}
          </p>
        </div>
        <div className="p-4 bg-white rounded-lg border border-neutral-200">
          <p className="text-sm text-neutral-600">Members</p>
          <p className="text-2xl font-semibold text-neutral-900 mt-1">
            {loading ? "…" : memberCount}
          </p>
        </div>
        <div className="p-4 bg-white rounded-lg border border-neutral-200">
          <p className="text-sm text-neutral-600">Admins</p>
          <p className="text-2xl font-semibold text-neutral-900 mt-1">
            {loading ? "…" : adminCount}
          </p>
        </div>
      </div>

      {error && !loading && (
        <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
          Failed to load users: {error}
        </div>
      )}

      <DataTable
        data={users}
        columns={columns}
        searchPlaceholder="Search users..."
        emptyMessage="No users found."
        isLoading={loading}
      />
    </div>
  );
}
