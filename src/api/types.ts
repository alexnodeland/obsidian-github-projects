// TypeScript types for GitHub Projects V2 GraphQL API

export interface Project {
    id: string;
    title: string;
    url: string;
    number: number;
    fields: Field[];
}

export interface Field {
    id: string;
    name: string;
    type: FieldType;
    options?: FieldOption[];
}

export type FieldType = 'text' | 'number' | 'date' | 'single-select' | 'iteration';

export interface FieldOption {
    id: string;
    name: string;
}

export interface ProjectItem {
    id: string;
    type: 'Issue' | 'PullRequest' | 'DraftIssue';
    title: string;
    url?: string;
    number?: number;
    state?: string;
    body?: string;
    assignees: Assignee[];
    fieldValues: Map<string, FieldValue>;
}

export interface Assignee {
    login: string;
    avatarUrl: string;
}

export interface FieldValue {
    fieldName: string;
    value: string | number | Date | null;
    optionId?: string;
}

export interface Column {
    id: string;
    name: string;
    fieldId: string;
    cards: ProjectItem[];
}

export interface GraphQLResponse<T> {
    data?: T;
    errors?: Array<{
        message: string;
        locations?: Array<{ line: number; column: number }>;
        path?: string[];
    }>;
}

export interface RateLimit {
    limit: number;
    remaining: number;
    used: number;
    resetAt: string;
    cost: number;
}
