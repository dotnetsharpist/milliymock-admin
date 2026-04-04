import { useState } from "react";
import { DataTable, Column } from "../components/DataTable";
import { mockUsers, User } from "../data/mockData";
import { Badge } from "../components/ui/badge";

const roleColors = {
  Administrator: "bg-red-100 text-red-800",
  Teacher: "bg-blue-100 text-blue-800",
  Student: "bg-green-100 text-green-800",
};

export function Users() {
  const [users] = useState<User[]>(mockUsers);

  const columns: Column<User>[] = [
    { header: "Name", accessor: "name" },
    { header: "Email", accessor: "email" },
    {
      header: "Role",
      accessor: (user) => (
        <Badge className={roleColors[user.role as keyof typeof roleColors]}>
          {user.role}
        </Badge>
      ),
    },
    {
      header: "Joined",
      accessor: (user) => new Date(user.createdAt).toLocaleDateString(),
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
            {users.length}
          </p>
        </div>
        <div className="p-4 bg-white rounded-lg border border-neutral-200">
          <p className="text-sm text-neutral-600">Students</p>
          <p className="text-2xl font-semibold text-neutral-900 mt-1">
            {users.filter((u) => u.role === "Student").length}
          </p>
        </div>
        <div className="p-4 bg-white rounded-lg border border-neutral-200">
          <p className="text-sm text-neutral-600">Teachers</p>
          <p className="text-2xl font-semibold text-neutral-900 mt-1">
            {users.filter((u) => u.role === "Teacher").length}
          </p>
        </div>
      </div>

      <DataTable
        data={users}
        columns={columns}
        searchPlaceholder="Search users..."
        emptyMessage="No users found."
      />
    </div>
  );
}
