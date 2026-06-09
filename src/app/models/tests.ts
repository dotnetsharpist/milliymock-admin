export type Status = "Draft" | "Published" | "Archived";

export interface Test {
    id: string;
    title: string;
    description: string | null;
    subject?: string | null;
    status?: Status;
    questionCount: number;
}

export interface CreateTestData {
    title: string;
    description: string | null;
    subject: string;
}

export interface UpdateTestData {
    title: string;
    description: string | null;
    subject: string;
    status: Status;
}