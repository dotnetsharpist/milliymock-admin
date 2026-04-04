import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { FileText, HelpCircle, Users, Layers } from "lucide-react";
import { 
  mockTests, 
  mockQuestions, 
  mockStandaloneQuestions, 
  mockUsers, 
  mockQuestionGroups 
} from "../data/mockData";

const stats = [
  {
    title: "Total Tests",
    value: mockTests.length,
    description: "Active test suites",
    icon: FileText,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "Standalone Questions",
    value: mockStandaloneQuestions.length,
    description: "Independent questions",
    icon: HelpCircle,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    title: "Question Groups",
    value: mockQuestionGroups.length,
    description: "Groups with shared context",
    icon: Layers,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    title: "Total Users",
    value: mockUsers.length,
    description: "Registered users",
    icon: Users,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
];

export function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-neutral-900">Dashboard</h1>
        <p className="text-neutral-600 mt-1">
          Overview of your test management platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-neutral-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-neutral-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-neutral-900">
                  {stat.value}
                </div>
                <p className="text-sm text-neutral-500 mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Tests</CardTitle>
            <CardDescription>Latest test suites created</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockTests.slice(0, 5).map((test) => (
                <div
                  key={test.id}
                  className="flex items-start justify-between p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900 truncate">
                      {test.title}
                    </p>
                    <p className="text-sm text-neutral-500 truncate">
                      {test.description}
                    </p>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-sm font-medium text-neutral-900">
                      {test.questionCount}
                    </p>
                    <p className="text-xs text-neutral-500">questions</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Question Types Distribution</CardTitle>
            <CardDescription>Breakdown by question type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { type: "Matching", count: 3, color: "bg-blue-500" },
                { type: "Free Answer", count: 2, color: "bg-green-500" },
              ].map((item) => (
                <div key={item.type} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-700">{item.type}</span>
                    <span className="font-medium text-neutral-900">{item.count}</span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ width: `${(item.count / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}