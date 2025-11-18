import { requestUrl } from 'obsidian';
import { QUERIES } from './queries';
import { MUTATIONS } from './mutations';
import {
    Project,
    ProjectItem,
    Field,
    GraphQLResponse,
    RateLimit,
    Assignee,
    FieldValue
} from './types';

export class GitHubClient {
    private readonly GRAPHQL_ENDPOINT = 'https://api.github.com/graphql';

    constructor(private token: string) {}

    /**
     * Execute a GraphQL query
     */
    private async query<T>(query: string, variables: any = {}): Promise<T> {
        const response = await requestUrl({
            url: this.GRAPHQL_ENDPOINT,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github+json'
            },
            body: JSON.stringify({ query, variables }),
            throw: false
        });

        if (response.status !== 200) {
            throw new Error(`GitHub API error: ${response.status} - ${response.text}`);
        }

        const result: GraphQLResponse<T> = response.json;

        if (result.errors && result.errors.length > 0) {
            throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
        }

        if (!result.data) {
            throw new Error('No data returned from GraphQL query');
        }

        return result.data;
    }

    /**
     * Test connection and get current user
     */
    async testConnection(): Promise<boolean> {
        try {
            const data: any = await this.query(QUERIES.GET_VIEWER);
            return !!data.viewer?.login;
        } catch (error) {
            console.error('GitHub connection test failed:', error);
            return false;
        }
    }

    /**
     * Get current user info
     */
    async getViewer(): Promise<any> {
        const data: any = await this.query(QUERIES.GET_VIEWER);
        return data.viewer;
    }

    /**
     * Fetch a project by owner (user or organization) and number
     */
    async fetchProject(owner: string, number: number, ownerType: 'user' | 'organization' = 'organization'): Promise<Project> {
        if (ownerType === 'user') {
            const data: any = await this.query(QUERIES.GET_USER_PROJECT, { user: owner, number });
            return this.transformProject(data.user.projectV2);
        } else {
            const data: any = await this.query(QUERIES.GET_PROJECT, { org: owner, number });
            return this.transformProject(data.organization.projectV2);
        }
    }

    /**
     * Fetch all items from a project with pagination
     */
    async fetchProjectItems(projectId: string): Promise<ProjectItem[]> {
        const items: ProjectItem[] = [];
        let cursor: string | null = null;
        let hasNextPage = true;

        while (hasNextPage) {
            const data: any = await this.query(QUERIES.GET_PROJECT_ITEMS, {
                projectId,
                cursor
            });

            const result = data.node.items;
            items.push(...result.nodes.map((node: any) => this.transformItem(node)));

            hasNextPage = result.pageInfo.hasNextPage;
            cursor = result.pageInfo.endCursor;
        }

        return items;
    }

    /**
     * Update a single-select field (e.g., status column)
     */
    async updateSingleSelectField(
        projectId: string,
        itemId: string,
        fieldId: string,
        optionId: string
    ): Promise<void> {
        await this.query(MUTATIONS.UPDATE_SINGLE_SELECT_FIELD, {
            projectId,
            itemId,
            fieldId,
            optionId
        });
    }

    /**
     * Update a text field
     */
    async updateTextField(
        projectId: string,
        itemId: string,
        fieldId: string,
        text: string
    ): Promise<void> {
        await this.query(MUTATIONS.UPDATE_TEXT_FIELD, {
            projectId,
            itemId,
            fieldId,
            text
        });
    }

    /**
     * Add an existing issue/PR to a project
     */
    async addItemToProject(projectId: string, contentId: string): Promise<string> {
        const data: any = await this.query(MUTATIONS.ADD_ITEM_BY_ID, {
            projectId,
            contentId
        });
        return data.addProjectV2ItemById.item.id;
    }

    /**
     * Create a draft issue in the project
     */
    async createDraftIssue(projectId: string, title: string, body?: string): Promise<string> {
        const data: any = await this.query(MUTATIONS.ADD_DRAFT_ISSUE, {
            projectId,
            title,
            body
        });
        return data.addProjectV2DraftIssue.projectItem.id;
    }

    /**
     * Archive an item
     */
    async archiveItem(projectId: string, itemId: string): Promise<void> {
        await this.query(MUTATIONS.ARCHIVE_ITEM, {
            projectId,
            itemId
        });
    }

    /**
     * Delete an item
     */
    async deleteItem(projectId: string, itemId: string): Promise<void> {
        await this.query(MUTATIONS.DELETE_ITEM, {
            projectId,
            itemId
        });
    }

    /**
     * Get rate limit status
     */
    async getRateLimit(): Promise<RateLimit> {
        const data: any = await this.query(QUERIES.GET_RATE_LIMIT);
        return data.rateLimit;
    }

    /**
     * Transform raw project data to our Project type
     */
    private transformProject(raw: any): Project {
        return {
            id: raw.id,
            title: raw.title,
            url: raw.url,
            number: raw.number,
            fields: raw.fields.nodes.map((node: any) => this.transformField(node))
        };
    }

    /**
     * Transform raw field data
     */
    private transformField(raw: any): Field {
        const field: Field = {
            id: raw.id,
            name: raw.name,
            type: 'text' // default
        };

        // Determine field type from GraphQL typename
        if (raw.options) {
            field.type = 'single-select';
            field.options = raw.options.map((opt: any) => ({
                id: opt.id,
                name: opt.name
            }));
        } else if (raw.configuration?.iterations) {
            field.type = 'iteration';
        }

        return field;
    }

    /**
     * Transform raw item data
     */
    private transformItem(raw: any): ProjectItem {
        const content = raw.content;
        const item: ProjectItem = {
            id: raw.id,
            type: raw.type || 'DraftIssue',
            title: content?.title || 'Untitled',
            url: content?.url,
            number: content?.number,
            state: content?.state,
            body: content?.body || '',
            assignees: this.transformAssignees(content?.assignees?.nodes || []),
            fieldValues: this.transformFieldValues(raw.fieldValues?.nodes || [])
        };

        return item;
    }

    /**
     * Transform assignees
     */
    private transformAssignees(raw: any[]): Assignee[] {
        return raw.map(assignee => ({
            login: assignee.login,
            avatarUrl: assignee.avatarUrl
        }));
    }

    /**
     * Transform field values
     */
    private transformFieldValues(raw: any[]): Map<string, FieldValue> {
        const values = new Map<string, FieldValue>();

        raw.forEach((fv: any) => {
            if (!fv.field) return;

            const fieldName = fv.field.name;
            let value: string | number | Date | null = null;
            let optionId: string | undefined;

            if (fv.text !== undefined) {
                value = fv.text;
            } else if (fv.number !== undefined) {
                value = fv.number;
            } else if (fv.date !== undefined) {
                value = new Date(fv.date);
            } else if (fv.name !== undefined) {
                value = fv.name;
                optionId = fv.optionId;
            }

            values.set(fieldName, {
                fieldName,
                value,
                optionId
            });
        });

        return values;
    }
}
