export type Status = "Draft" | "Published" | "Archived";

export interface Test {
    id: string;
    title: string;
    description: string | null;
    subject?: string | null;
    isPremium: boolean;
    price: number | null;
    durationMinutes: number;
    status?: Status;
    questionCount: number;
}

export interface CreateTestData {
    title: string;
    description: string | null;
    subject: string;
    isPremium: boolean;
    price: number | null;
    durationMinutes: number;
}

export interface UpdateTestData {
    title: string;
    description: string | null;
    subject: string;
    isPremium: boolean;
    price: number | null;
    durationMinutes: number;
    status: Status;
}