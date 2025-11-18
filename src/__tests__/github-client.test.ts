import { GitHubClient } from '../api/github-client';
import { requestUrl } from 'obsidian';

const mockRequestUrl = requestUrl as jest.MockedFunction<typeof requestUrl>;

describe('GitHubClient', () => {
    let client: GitHubClient;
    const testToken = 'ghp_test123456789';

    beforeEach(() => {
        client = new GitHubClient(testToken);
        jest.clearAllMocks();
    });

    describe('testConnection', () => {
        it('should return true for valid connection', async () => {
            mockRequestUrl.mockResolvedValueOnce({
                status: 200,
                json: {
                    data: {
                        viewer: {
                            login: 'testuser'
                        }
                    }
                },
                text: '',
                headers: {},
                arrayBuffer: new ArrayBuffer(0)
            } as any);

            const result = await client.testConnection();
            expect(result).toBe(true);
            expect(mockRequestUrl).toHaveBeenCalledWith(
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': `Bearer ${testToken}`
                    })
                })
            );
        });

        it('should return false for invalid connection', async () => {
            mockRequestUrl.mockResolvedValueOnce({
                status: 401,
                json: {},
                text: 'Unauthorized',
                headers: {},
                arrayBuffer: new ArrayBuffer(0)
            } as any);

            const result = await client.testConnection();
            expect(result).toBe(false);
        });

        it('should return false when GraphQL errors occur', async () => {
            mockRequestUrl.mockResolvedValueOnce({
                status: 200,
                json: {
                    errors: [{ message: 'Authentication required' }]
                },
                text: '',
                headers: {},
                arrayBuffer: new ArrayBuffer(0)
            } as any);

            const result = await client.testConnection();
            expect(result).toBe(false);
        });
    });

    describe('fetchProject', () => {
        it('should fetch and transform project data', async () => {
            const mockProjectData = {
                data: {
                    organization: {
                        projectV2: {
                            id: 'PVT_test123',
                            title: 'Test Project',
                            url: 'https://github.com/orgs/test/projects/1',
                            number: 1,
                            fields: {
                                nodes: [
                                    {
                                        id: 'FIELD_1',
                                        name: 'Status',
                                        options: [
                                            { id: 'OPT_1', name: 'Todo' },
                                            { id: 'OPT_2', name: 'In Progress' },
                                            { id: 'OPT_3', name: 'Done' }
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                }
            };

            mockRequestUrl.mockResolvedValueOnce({
                status: 200,
                json: mockProjectData,
                text: '',
                headers: {},
                arrayBuffer: new ArrayBuffer(0)
            } as any);

            const project = await client.fetchProject('test-org', 1);

            expect(project.id).toBe('PVT_test123');
            expect(project.title).toBe('Test Project');
            expect(project.fields).toHaveLength(1);
            expect(project.fields[0].type).toBe('single-select');
            expect(project.fields[0].options).toHaveLength(3);
        });

        it('should throw error on API failure', async () => {
            mockRequestUrl.mockResolvedValueOnce({
                status: 404,
                json: {},
                text: 'Not Found',
                headers: {},
                arrayBuffer: new ArrayBuffer(0)
            } as any);

            await expect(client.fetchProject('test-org', 1)).rejects.toThrow('GitHub API error');
        });
    });

    describe('fetchProjectItems', () => {
        it('should fetch all items with pagination', async () => {
            // First page
            mockRequestUrl.mockResolvedValueOnce({
                status: 200,
                json: {
                    data: {
                        node: {
                            items: {
                                nodes: [
                                    {
                                        id: 'ITEM_1',
                                        type: 'Issue',
                                        content: {
                                            title: 'Test Issue 1',
                                            number: 1,
                                            url: 'https://github.com/test/repo/issues/1',
                                            state: 'OPEN',
                                            body: 'Test body',
                                            assignees: { nodes: [] }
                                        },
                                        fieldValues: { nodes: [] }
                                    }
                                ],
                                pageInfo: {
                                    hasNextPage: true,
                                    endCursor: 'cursor123'
                                }
                            }
                        }
                    }
                },
                text: '',
                headers: {},
                arrayBuffer: new ArrayBuffer(0)
            } as any);

            // Second page
            mockRequestUrl.mockResolvedValueOnce({
                status: 200,
                json: {
                    data: {
                        node: {
                            items: {
                                nodes: [
                                    {
                                        id: 'ITEM_2',
                                        type: 'Issue',
                                        content: {
                                            title: 'Test Issue 2',
                                            number: 2,
                                            url: 'https://github.com/test/repo/issues/2',
                                            state: 'OPEN',
                                            body: 'Test body 2',
                                            assignees: { nodes: [] }
                                        },
                                        fieldValues: { nodes: [] }
                                    }
                                ],
                                pageInfo: {
                                    hasNextPage: false,
                                    endCursor: null
                                }
                            }
                        }
                    }
                },
                text: '',
                headers: {},
                arrayBuffer: new ArrayBuffer(0)
            } as any);

            const items = await client.fetchProjectItems('PVT_test123');

            expect(items).toHaveLength(2);
            expect(items[0].title).toBe('Test Issue 1');
            expect(items[1].title).toBe('Test Issue 2');
            expect(mockRequestUrl).toHaveBeenCalledTimes(2);
        });
    });

    describe('updateSingleSelectField', () => {
        it('should update field successfully', async () => {
            mockRequestUrl.mockResolvedValueOnce({
                status: 200,
                json: {
                    data: {
                        updateProjectV2ItemFieldValue: {
                            projectV2Item: {
                                id: 'ITEM_1'
                            }
                        }
                    }
                },
                text: '',
                headers: {},
                arrayBuffer: new ArrayBuffer(0)
            } as any);

            await expect(
                client.updateSingleSelectField('PVT_1', 'ITEM_1', 'FIELD_1', 'OPT_1')
            ).resolves.not.toThrow();
        });
    });
});
