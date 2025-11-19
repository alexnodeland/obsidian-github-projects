import { GitHubClient } from '../api/github-client';
import { requestUrl } from 'obsidian';

const mockRequestUrl = requestUrl as jest.MockedFunction<typeof requestUrl>;

describe('GitHubClient - Project Methods', () => {
    let client: GitHubClient;
    const testToken = 'ghp_test123456789';
    let consoleErrorSpy: jest.SpyInstance;
    let consoleWarnSpy: jest.SpyInstance;
    let consoleLogSpy: jest.SpyInstance;

    beforeEach(() => {
        client = new GitHubClient(testToken);
        jest.clearAllMocks();
        // Silence console during tests
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
        consoleWarnSpy.mockRestore();
        consoleLogSpy.mockRestore();
    });

    describe('fetchUserProjects', () => {
        it('should fetch all user projects with pagination', async () => {
            // First page
            mockRequestUrl.mockResolvedValueOnce({
                status: 200,
                json: {
                    data: {
                        viewer: {
                            login: 'testuser',
                            projectsV2: {
                                nodes: [
                                    {
                                        id: 'PVT_1',
                                        title: 'My Project 1',
                                        url: 'https://github.com/users/testuser/projects/1',
                                        number: 1,
                                        closed: false
                                    }
                                ],
                                pageInfo: {
                                    hasNextPage: true,
                                    endCursor: 'cursor1'
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
                        viewer: {
                            login: 'testuser',
                            projectsV2: {
                                nodes: [
                                    {
                                        id: 'PVT_2',
                                        title: 'My Project 2',
                                        url: 'https://github.com/users/testuser/projects/2',
                                        number: 2,
                                        closed: false
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

            const projects = await client.fetchUserProjects();

            expect(projects).toHaveLength(2);
            expect(projects[0]).toEqual({
                id: 'PVT_1',
                title: 'My Project 1',
                url: 'https://github.com/users/testuser/projects/1',
                number: 1,
                owner: 'testuser',
                ownerType: 'user',
                closed: false
            });
            expect(projects[1].title).toBe('My Project 2');
            expect(mockRequestUrl).toHaveBeenCalledTimes(2);
        });

        it('should handle closed projects', async () => {
            mockRequestUrl.mockResolvedValueOnce({
                status: 200,
                json: {
                    data: {
                        viewer: {
                            login: 'testuser',
                            projectsV2: {
                                nodes: [
                                    {
                                        id: 'PVT_CLOSED',
                                        title: 'Closed Project',
                                        url: 'https://github.com/users/testuser/projects/99',
                                        number: 99,
                                        closed: true
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

            const projects = await client.fetchUserProjects();
            expect(projects).toHaveLength(1);
            expect(projects[0].closed).toBe(true);
        });
    });

    describe('fetchUserOrganizations', () => {
        it('should fetch all user organizations with pagination', async () => {
            // First page
            mockRequestUrl.mockResolvedValueOnce({
                status: 200,
                json: {
                    data: {
                        viewer: {
                            organizations: {
                                nodes: [
                                    {
                                        id: 'ORG_1',
                                        login: 'test-org-1',
                                        name: 'Test Organization 1'
                                    }
                                ],
                                pageInfo: {
                                    hasNextPage: true,
                                    endCursor: 'cursor1'
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
                        viewer: {
                            organizations: {
                                nodes: [
                                    {
                                        id: 'ORG_2',
                                        login: 'test-org-2',
                                        name: 'Test Organization 2'
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

            const orgs = await client.fetchUserOrganizations();

            expect(orgs).toHaveLength(2);
            expect(orgs[0]).toEqual({
                login: 'test-org-1',
                name: 'Test Organization 1'
            });
            expect(orgs[1].login).toBe('test-org-2');
            expect(mockRequestUrl).toHaveBeenCalledTimes(2);
        });

        it('should handle users with no organizations', async () => {
            mockRequestUrl.mockResolvedValueOnce({
                status: 200,
                json: {
                    data: {
                        viewer: {
                            organizations: {
                                nodes: [],
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

            const orgs = await client.fetchUserOrganizations();
            expect(orgs).toHaveLength(0);
        });
    });

    describe('fetchOrganizationProjects', () => {
        it('should fetch all organization projects with pagination', async () => {
            // First page
            mockRequestUrl.mockResolvedValueOnce({
                status: 200,
                json: {
                    data: {
                        organization: {
                            projectsV2: {
                                nodes: [
                                    {
                                        id: 'PVT_ORG_1',
                                        title: 'Org Project 1',
                                        url: 'https://github.com/orgs/test-org/projects/1',
                                        number: 1,
                                        closed: false
                                    }
                                ],
                                pageInfo: {
                                    hasNextPage: true,
                                    endCursor: 'cursor1'
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
                        organization: {
                            projectsV2: {
                                nodes: [
                                    {
                                        id: 'PVT_ORG_2',
                                        title: 'Org Project 2',
                                        url: 'https://github.com/orgs/test-org/projects/2',
                                        number: 2,
                                        closed: false
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

            const projects = await client.fetchOrganizationProjects('test-org');

            expect(projects).toHaveLength(2);
            expect(projects[0]).toEqual({
                id: 'PVT_ORG_1',
                title: 'Org Project 1',
                url: 'https://github.com/orgs/test-org/projects/1',
                number: 1,
                owner: 'test-org',
                ownerType: 'organization',
                closed: false
            });
            expect(projects[1].title).toBe('Org Project 2');
            expect(mockRequestUrl).toHaveBeenCalledTimes(2);
        });
    });

    describe('fetchAllAccessibleProjects', () => {
        it('should fetch and combine user and organization projects', async () => {
            // Mock user projects
            mockRequestUrl.mockResolvedValueOnce({
                status: 200,
                json: {
                    data: {
                        viewer: {
                            login: 'testuser',
                            projectsV2: {
                                nodes: [
                                    {
                                        id: 'PVT_USER',
                                        title: 'User Project',
                                        url: 'https://github.com/users/testuser/projects/1',
                                        number: 1,
                                        closed: false
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

            // Mock organizations
            mockRequestUrl.mockResolvedValueOnce({
                status: 200,
                json: {
                    data: {
                        viewer: {
                            organizations: {
                                nodes: [
                                    {
                                        id: 'ORG_1',
                                        login: 'test-org',
                                        name: 'Test Org'
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

            // Mock org projects
            mockRequestUrl.mockResolvedValueOnce({
                status: 200,
                json: {
                    data: {
                        organization: {
                            projectsV2: {
                                nodes: [
                                    {
                                        id: 'PVT_ORG',
                                        title: 'Org Project',
                                        url: 'https://github.com/orgs/test-org/projects/1',
                                        number: 1,
                                        closed: false
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

            const projects = await client.fetchAllAccessibleProjects();

            expect(projects).toHaveLength(2);
            // User projects should come first
            expect(projects[0].ownerType).toBe('user');
            expect(projects[0].title).toBe('User Project');
            expect(projects[1].ownerType).toBe('organization');
            expect(projects[1].title).toBe('Org Project');
        });

        it('should handle errors when fetching organization projects', async () => {
            // Mock user projects
            mockRequestUrl.mockResolvedValueOnce({
                status: 200,
                json: {
                    data: {
                        viewer: {
                            login: 'testuser',
                            projectsV2: {
                                nodes: [
                                    {
                                        id: 'PVT_USER',
                                        title: 'User Project',
                                        url: 'https://github.com/users/testuser/projects/1',
                                        number: 1,
                                        closed: false
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

            // Mock organizations
            mockRequestUrl.mockResolvedValueOnce({
                status: 200,
                json: {
                    data: {
                        viewer: {
                            organizations: {
                                nodes: [
                                    {
                                        id: 'ORG_1',
                                        login: 'test-org',
                                        name: 'Test Org'
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

            // Mock org projects failure
            mockRequestUrl.mockRejectedValueOnce(new Error('Access denied'));

            const projects = await client.fetchAllAccessibleProjects();

            // Should still return user projects even if org projects fail
            expect(projects).toHaveLength(1);
            expect(projects[0].title).toBe('User Project');
        });

        it('should handle insufficient scopes gracefully', async () => {
            // Mock user projects
            mockRequestUrl.mockResolvedValueOnce({
                status: 200,
                json: {
                    data: {
                        viewer: {
                            login: 'testuser',
                            projectsV2: {
                                nodes: [],
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

            // Mock organizations failure due to scope
            mockRequestUrl.mockRejectedValueOnce(new Error('GraphQL errors: INSUFFICIENT_SCOPES'));

            const projects = await client.fetchAllAccessibleProjects();

            // Should return empty array but not throw
            expect(projects).toEqual([]);
        });
    });

    describe('updatePullRequest', () => {
        it('should update pull request successfully', async () => {
            mockRequestUrl.mockResolvedValueOnce({
                status: 200,
                json: {
                    data: {
                        updatePullRequest: {
                            pullRequest: {
                                id: 'PR_123'
                            }
                        }
                    }
                },
                text: '',
                headers: {},
                arrayBuffer: new ArrayBuffer(0)
            } as any);

            await expect(
                client.updatePullRequest('PR_123', 'New PR title', 'New PR body')
            ).resolves.not.toThrow();
        });

        it('should handle partial updates', async () => {
            mockRequestUrl.mockResolvedValueOnce({
                status: 200,
                json: {
                    data: {
                        updatePullRequest: {
                            pullRequest: {
                                id: 'PR_123'
                            }
                        }
                    }
                },
                text: '',
                headers: {},
                arrayBuffer: new ArrayBuffer(0)
            } as any);

            await expect(
                client.updatePullRequest('PR_123', 'New title only')
            ).resolves.not.toThrow();
        });
    });

    describe('comment methods', () => {
        describe('getComments', () => {
            it('should fetch issue comments', async () => {
                mockRequestUrl.mockResolvedValueOnce({
                    status: 200,
                    json: {
                        data: {
                            repository: {
                                issue: {
                                    comments: {
                                        nodes: [
                                            {
                                                id: 'C1',
                                                body: 'First comment',
                                                createdAt: '2024-01-01',
                                                author: {
                                                    login: 'user1',
                                                    avatarUrl: 'https://avatar.jpg'
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    },
                    text: '',
                    headers: {},
                    arrayBuffer: new ArrayBuffer(0)
                } as any);

                const comments = await client.getComments('owner', 'repo', 1, 'Issue');
                expect(comments).toHaveLength(1);
                expect(comments[0].body).toBe('First comment');
            });

            it('should fetch pull request comments', async () => {
                mockRequestUrl.mockResolvedValueOnce({
                    status: 200,
                    json: {
                        data: {
                            repository: {
                                pullRequest: {
                                    comments: {
                                        nodes: [
                                            {
                                                id: 'C2',
                                                body: 'PR comment',
                                                createdAt: '2024-01-02',
                                                author: {
                                                    login: 'user2',
                                                    avatarUrl: 'https://avatar2.jpg'
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    },
                    text: '',
                    headers: {},
                    arrayBuffer: new ArrayBuffer(0)
                } as any);

                const comments = await client.getComments('owner', 'repo', 2, 'PullRequest');
                expect(comments).toHaveLength(1);
                expect(comments[0].body).toBe('PR comment');
            });
        });

        describe('addComment', () => {
            it('should add comment successfully', async () => {
                mockRequestUrl.mockResolvedValueOnce({
                    status: 200,
                    json: {
                        data: {
                            addComment: {
                                commentEdge: {
                                    node: {
                                        id: 'C3',
                                        body: 'New comment',
                                        createdAt: '2024-01-03',
                                        author: {
                                            login: 'currentuser',
                                            avatarUrl: 'https://avatar3.jpg'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    text: '',
                    headers: {},
                    arrayBuffer: new ArrayBuffer(0)
                } as any);

                const comment = await client.addComment('ISSUE_123', 'New comment');
                expect(comment.body).toBe('New comment');
                expect(comment.author?.login).toBe('currentuser');
            });
        });
    });

    describe('label methods', () => {
        describe('getRepositoryLabels', () => {
            it('should fetch repository labels', async () => {
                mockRequestUrl.mockResolvedValueOnce({
                    status: 200,
                    json: {
                        data: {
                            repository: {
                                labels: {
                                    nodes: [
                                        {
                                            id: 'L1',
                                            name: 'bug',
                                            color: 'd73a4a'
                                        },
                                        {
                                            id: 'L2',
                                            name: 'enhancement',
                                            color: 'a2eeef'
                                        }
                                    ]
                                }
                            }
                        }
                    },
                    text: '',
                    headers: {},
                    arrayBuffer: new ArrayBuffer(0)
                } as any);

                const labels = await client.getRepositoryLabels('owner', 'repo');
                expect(labels).toHaveLength(2);
                expect(labels[0].name).toBe('bug');
                expect(labels[1].name).toBe('enhancement');
            });
        });

        describe('createLabel', () => {
            it('should create label successfully', async () => {
                mockRequestUrl.mockResolvedValueOnce({
                    status: 200,
                    json: {
                        data: {
                            createLabel: {
                                label: {
                                    id: 'L3',
                                    name: 'new-feature',
                                    color: '0366d6'
                                }
                            }
                        }
                    },
                    text: '',
                    headers: {},
                    arrayBuffer: new ArrayBuffer(0)
                } as any);

                const label = await client.createLabel('REPO_123', 'new-feature', '0366d6');
                expect(label.name).toBe('new-feature');
                expect(label.color).toBe('0366d6');
            });
        });

        describe('addLabels', () => {
            it('should add labels successfully', async () => {
                mockRequestUrl.mockResolvedValueOnce({
                    status: 200,
                    json: {
                        data: {
                            addLabelsToLabelable: {
                                labelable: {
                                    id: 'ISSUE_123'
                                }
                            }
                        }
                    },
                    text: '',
                    headers: {},
                    arrayBuffer: new ArrayBuffer(0)
                } as any);

                await expect(
                    client.addLabels('ISSUE_123', ['L1', 'L2'])
                ).resolves.not.toThrow();
            });
        });

        describe('removeLabels', () => {
            it('should remove labels successfully', async () => {
                mockRequestUrl.mockResolvedValueOnce({
                    status: 200,
                    json: {
                        data: {
                            removeLabelsFromLabelable: {
                                labelable: {
                                    id: 'ISSUE_123'
                                }
                            }
                        }
                    },
                    text: '',
                    headers: {},
                    arrayBuffer: new ArrayBuffer(0)
                } as any);

                await expect(
                    client.removeLabels('ISSUE_123', ['L1'])
                ).resolves.not.toThrow();
            });
        });
    });

    describe('assignee methods', () => {
        describe('searchUsers', () => {
            it('should search users successfully', async () => {
                mockRequestUrl.mockResolvedValueOnce({
                    status: 200,
                    json: {
                        data: {
                            search: {
                                nodes: [
                                    {
                                        id: 'U1',
                                        login: 'user1',
                                        name: 'User One',
                                        avatarUrl: 'https://avatar1.jpg'
                                    },
                                    {
                                        id: 'U2',
                                        login: 'user2',
                                        name: 'User Two',
                                        avatarUrl: 'https://avatar2.jpg'
                                    }
                                ]
                            }
                        }
                    },
                    text: '',
                    headers: {},
                    arrayBuffer: new ArrayBuffer(0)
                } as any);

                const users = await client.searchUsers('user');
                expect(users).toHaveLength(2);
                expect(users[0].login).toBe('user1');
                expect(users[1].login).toBe('user2');
            });
        });

        describe('addAssignees', () => {
            it('should add assignees successfully', async () => {
                mockRequestUrl.mockResolvedValueOnce({
                    status: 200,
                    json: {
                        data: {
                            addAssigneesToAssignable: {
                                assignable: {
                                    id: 'ISSUE_123'
                                }
                            }
                        }
                    },
                    text: '',
                    headers: {},
                    arrayBuffer: new ArrayBuffer(0)
                } as any);

                await expect(
                    client.addAssignees('ISSUE_123', ['U1', 'U2'])
                ).resolves.not.toThrow();
            });
        });

        describe('removeAssignees', () => {
            it('should remove assignees successfully', async () => {
                mockRequestUrl.mockResolvedValueOnce({
                    status: 200,
                    json: {
                        data: {
                            removeAssigneesFromAssignable: {
                                assignable: {
                                    id: 'ISSUE_123'
                                }
                            }
                        }
                    },
                    text: '',
                    headers: {},
                    arrayBuffer: new ArrayBuffer(0)
                } as any);

                await expect(
                    client.removeAssignees('ISSUE_123', ['U1'])
                ).resolves.not.toThrow();
            });
        });
    });

    describe('error handling edge cases', () => {
        it('should handle network errors', async () => {
            mockRequestUrl.mockRejectedValueOnce(new Error('Network error'));

            await expect(client.fetchUserProjects()).rejects.toThrow('Network error');
        });

        it('should handle malformed responses', async () => {
            mockRequestUrl.mockResolvedValueOnce({
                status: 200,
                json: { data: null },
                text: '',
                headers: {},
                arrayBuffer: new ArrayBuffer(0)
            } as any);

            await expect(client.fetchUserProjects()).rejects.toThrow();
        });

        it('should handle rate limit errors', async () => {
            mockRequestUrl.mockResolvedValueOnce({
                status: 200,
                json: {
                    errors: [{ message: 'API rate limit exceeded' }]
                },
                text: '',
                headers: {},
                arrayBuffer: new ArrayBuffer(0)
            } as any);

            await expect(client.fetchUserProjects()).rejects.toThrow('GraphQL errors');
        });
    });
});