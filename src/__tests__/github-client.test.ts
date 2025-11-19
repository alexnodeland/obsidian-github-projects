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

    describe('updateTextField', () => {
        it('should update text field successfully', async () => {
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
                client.updateTextField('PVT_1', 'ITEM_1', 'FIELD_1', 'New text value')
            ).resolves.not.toThrow();
        });
    });

    describe('addItemToProject', () => {
        it('should add item to project and return item ID', async () => {
            mockRequestUrl.mockResolvedValueOnce({
                status: 200,
                json: {
                    data: {
                        addProjectV2ItemById: {
                            item: {
                                id: 'NEW_ITEM_123'
                            }
                        }
                    }
                },
                text: '',
                headers: {},
                arrayBuffer: new ArrayBuffer(0)
            } as any);

            const itemId = await client.addItemToProject('PVT_1', 'CONTENT_1');
            expect(itemId).toBe('NEW_ITEM_123');
        });
    });

    describe('createDraftIssue', () => {
        it('should create draft issue and return item ID', async () => {
            mockRequestUrl.mockResolvedValueOnce({
                status: 200,
                json: {
                    data: {
                        addProjectV2DraftIssue: {
                            projectItem: {
                                id: 'DRAFT_ITEM_123'
                            }
                        }
                    }
                },
                text: '',
                headers: {},
                arrayBuffer: new ArrayBuffer(0)
            } as any);

            const itemId = await client.createDraftIssue('PVT_1', 'Draft title', 'Draft body');
            expect(itemId).toBe('DRAFT_ITEM_123');
        });
    });

    describe('archiveItem', () => {
        it('should archive item successfully', async () => {
            mockRequestUrl.mockResolvedValueOnce({
                status: 200,
                json: {
                    data: {
                        archiveProjectV2Item: {
                            item: {
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
                client.archiveItem('PVT_1', 'ITEM_1')
            ).resolves.not.toThrow();
        });
    });

    describe('deleteItem', () => {
        it('should delete item successfully', async () => {
            mockRequestUrl.mockResolvedValueOnce({
                status: 200,
                json: {
                    data: {
                        deleteProjectV2Item: {
                            deletedItemId: 'ITEM_1'
                        }
                    }
                },
                text: '',
                headers: {},
                arrayBuffer: new ArrayBuffer(0)
            } as any);

            await expect(
                client.deleteItem('PVT_1', 'ITEM_1')
            ).resolves.not.toThrow();
        });
    });

    describe('updateIssue', () => {
        it('should update issue successfully', async () => {
            mockRequestUrl.mockResolvedValueOnce({
                status: 200,
                json: {
                    data: {
                        updateIssue: {
                            issue: {
                                id: 'ISSUE_1'
                            }
                        }
                    }
                },
                text: '',
                headers: {},
                arrayBuffer: new ArrayBuffer(0)
            } as any);

            await expect(
                client.updateIssue('ISSUE_1', 'New title', 'New body')
            ).resolves.not.toThrow();
        });
    });

    describe('closeIssue', () => {
        it('should close issue successfully', async () => {
            mockRequestUrl.mockResolvedValueOnce({
                status: 200,
                json: {
                    data: {
                        closeIssue: {
                            issue: {
                                id: 'ISSUE_1'
                            }
                        }
                    }
                },
                text: '',
                headers: {},
                arrayBuffer: new ArrayBuffer(0)
            } as any);

            await expect(
                client.closeIssue('ISSUE_1')
            ).resolves.not.toThrow();
        });
    });

    describe('getRateLimit', () => {
        it('should fetch rate limit info', async () => {
            mockRequestUrl.mockResolvedValueOnce({
                status: 200,
                json: {
                    data: {
                        rateLimit: {
                            limit: 5000,
                            remaining: 4999,
                            used: 1,
                            resetAt: '2024-01-01T00:00:00Z',
                            cost: 1
                        }
                    }
                },
                text: '',
                headers: {},
                arrayBuffer: new ArrayBuffer(0)
            } as any);

            const rateLimit = await client.getRateLimit();
            expect(rateLimit.limit).toBe(5000);
            expect(rateLimit.remaining).toBe(4999);
            expect(rateLimit.used).toBe(1);
        });
    });

    describe('getViewer', () => {
        it('should get viewer info', async () => {
            mockRequestUrl.mockResolvedValueOnce({
                status: 200,
                json: {
                    data: {
                        viewer: {
                            login: 'testuser',
                            name: 'Test User',
                            avatarUrl: 'https://example.com/avatar.jpg'
                        }
                    }
                },
                text: '',
                headers: {},
                arrayBuffer: new ArrayBuffer(0)
            } as any);

            const viewer = await client.getViewer();
            expect(viewer.login).toBe('testuser');
            expect(viewer.name).toBe('Test User');
        });
    });

    describe('error handling', () => {
        it('should throw GraphQL errors for methods other than testConnection', async () => {
            mockRequestUrl.mockResolvedValueOnce({
                status: 200,
                json: {
                    errors: [{ message: 'Field not found' }]
                },
                text: '',
                headers: {},
                arrayBuffer: new ArrayBuffer(0)
            } as any);

            await expect(client.fetchProject('test', 1)).rejects.toThrow('GraphQL errors');
        });

        it('should throw on non-200 status codes for regular methods', async () => {
            mockRequestUrl.mockResolvedValueOnce({
                status: 500,
                json: {},
                text: 'Internal Server Error',
                headers: {},
                arrayBuffer: new ArrayBuffer(0)
            } as any);

            await expect(client.fetchProject('test', 1)).rejects.toThrow('GitHub API error: 500');
        });
    });

    describe('transformItem edge cases', () => {
        it('should handle items with full PR data', async () => {
            mockRequestUrl.mockResolvedValueOnce({
                status: 200,
                json: {
                    data: {
                        node: {
                            items: {
                                nodes: [
                                    {
                                        id: 'ITEM_PR',
                                        type: 'PULL_REQUEST',
                                        content: {
                                            id: 'PR_123',
                                            title: 'Test PR',
                                            number: 42,
                                            url: 'https://github.com/test/repo/pull/42',
                                            state: 'OPEN',
                                            body: 'PR description',
                                            assignees: {
                                                nodes: [
                                                    { id: 'U1', login: 'reviewer1', avatarUrl: 'https://avatar1.jpg' }
                                                ]
                                            },
                                            repository: {
                                                id: 'R1',
                                                owner: { login: 'testowner' },
                                                name: 'testrepo',
                                                nameWithOwner: 'testowner/testrepo'
                                            },
                                            author: {
                                                login: 'author1',
                                                avatarUrl: 'https://author.jpg'
                                            },
                                            labels: {
                                                nodes: [
                                                    { id: 'L1', name: 'bug', color: 'red' }
                                                ]
                                            },
                                            milestone: {
                                                title: 'v1.0',
                                                dueOn: '2024-12-31'
                                            },
                                            createdAt: '2024-01-01',
                                            updatedAt: '2024-01-02',
                                            closedAt: null,
                                            comments: { totalCount: 5 },
                                            reactions: { totalCount: 3 },
                                            isDraft: false,
                                            merged: false,
                                            mergedAt: null,
                                            mergeable: 'MERGEABLE',
                                            reviewDecision: 'APPROVED',
                                            additions: 100,
                                            deletions: 50,
                                            reviewRequests: {
                                                nodes: [
                                                    {
                                                        requestedReviewer: {
                                                            login: 'reviewer2',
                                                            avatarUrl: 'https://reviewer.jpg'
                                                        }
                                                    }
                                                ]
                                            },
                                            commits: {
                                                nodes: [
                                                    {
                                                        commit: {
                                                            statusCheckRollup: {
                                                                state: 'SUCCESS'
                                                            }
                                                        }
                                                    }
                                                ]
                                            }
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

            const items = await client.fetchProjectItems('PVT_test');
            expect(items).toHaveLength(1);

            const pr = items[0];
            expect(pr.type).toBe('PullRequest');
            expect(pr.title).toBe('Test PR');
            expect(pr.assignees).toHaveLength(1);
            expect(pr.labels).toHaveLength(1);
            expect(pr.milestone?.title).toBe('v1.0');
            expect(pr.isDraft).toBe(false);
            expect(pr.reviewDecision).toBe('APPROVED');
            expect(pr.additions).toBe(100);
            expect(pr.deletions).toBe(50);
            expect(pr.reviewers).toHaveLength(1);
            expect(pr.ciStatus).toBe('SUCCESS');
        });

        it('should handle items with null content', async () => {
            mockRequestUrl.mockResolvedValueOnce({
                status: 200,
                json: {
                    data: {
                        node: {
                            items: {
                                nodes: [
                                    {
                                        id: 'ITEM_NULL',
                                        type: 'ISSUE',
                                        content: null,
                                        fieldValues: {
                                            nodes: [
                                                {
                                                    field: { name: 'Title' },
                                                    text: 'Item from field'
                                                }
                                            ]
                                        }
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

            const items = await client.fetchProjectItems('PVT_test');
            expect(items).toHaveLength(1);
            expect(items[0].title).toBe('Item from field');
        });

        it('should handle items with missing optional fields', async () => {
            mockRequestUrl.mockResolvedValueOnce({
                status: 200,
                json: {
                    data: {
                        node: {
                            items: {
                                nodes: [
                                    {
                                        id: 'ITEM_MIN',
                                        type: 'ISSUE',
                                        content: {
                                            title: 'Minimal Issue',
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

            const items = await client.fetchProjectItems('PVT_test');
            expect(items).toHaveLength(1);
            expect(items[0].title).toBe('Minimal Issue');
            expect(items[0].body).toBe('');
            expect(items[0].labels).toEqual([]);
            expect(items[0].assignees).toEqual([]);
        });
    });
});
