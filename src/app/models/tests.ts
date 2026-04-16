export type Status = 'Draft' | 'Published' | 'Archived';

export interface Test {
    id: string;
    title: string;
    description: string | null;
    status?: Status;
    questionCount: number;
}

export interface CreateTestData {
    title: string;
    description: string | null;
}

export interface UpdateTestData {
    title: string;
    description: string | null;
    status: Status;
}
