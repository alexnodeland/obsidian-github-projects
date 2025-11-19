import { filterCards, sortCards, extractFilterOptions } from '../utils/card-filters';
import { ProjectItem } from '../api/types';
import { FilterOptions, SortOption } from '../views/components/ColumnFilters';

// Helper function to create a mock card
function createMockCard(overrides: Partial<ProjectItem> = {}): ProjectItem {
    return {
        id: 'card-1',
        type: 'Issue',
        title: 'Test Issue',
        assignees: [],
        fieldValues: new Map(),
        ...overrides
    };
}

describe('filterCards', () => {
    const mockCards: ProjectItem[] = [
        createMockCard({
            id: 'card-1',
            title: 'Bug in login',
            body: 'Users cannot login',
            number: 123,
            labels: [{ id: 'l1', name: 'bug', color: 'red' }],
            assignees: [{ id: 'u1', login: 'alice', avatarUrl: '' }],
            author: { login: 'bob', avatarUrl: '' },
            state: 'OPEN',
            type: 'Issue',
            milestone: { title: 'v1.0' },
            repository: { id: 'r1', owner: 'owner', name: 'repo', nameWithOwner: 'owner/repo' }
        }),
        createMockCard({
            id: 'card-2',
            title: 'Feature request',
            body: 'Add dark mode',
            number: 124,
            labels: [{ id: 'l2', name: 'enhancement', color: 'blue' }],
            assignees: [{ id: 'u2', login: 'charlie', avatarUrl: '' }],
            author: { login: 'alice', avatarUrl: '' },
            state: 'CLOSED',
            type: 'Issue',
            milestone: { title: 'v2.0' },
            repository: { id: 'r2', owner: 'owner', name: 'other', nameWithOwner: 'owner/other' }
        }),
        createMockCard({
            id: 'card-3',
            title: 'Fix typo',
            body: 'Typo in documentation',
            number: 125,
            labels: [{ id: 'l3', name: 'documentation', color: 'green' }],
            assignees: [{ id: 'u1', login: 'alice', avatarUrl: '' }],
            author: { login: 'bob', avatarUrl: '' },
            state: 'OPEN',
            type: 'PullRequest',
            repository: { id: 'r1', owner: 'owner', name: 'repo', nameWithOwner: 'owner/repo' }
        })
    ];

    const emptyFilters: FilterOptions = {
        search: '',
        labels: [],
        assignees: [],
        authors: [],
        states: [],
        types: [],
        milestone: '',
        repositories: []
    };

    it('should return all cards when no filters are applied', () => {
        const result = filterCards(mockCards, emptyFilters);
        expect(result).toHaveLength(3);
        expect(result).toEqual(mockCards);
    });

    it('should filter by search text in title', () => {
        const filters: FilterOptions = { ...emptyFilters, search: 'login' };
        const result = filterCards(mockCards, filters);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('card-1');
    });

    it('should filter by search text in body', () => {
        const filters: FilterOptions = { ...emptyFilters, search: 'dark mode' };
        const result = filterCards(mockCards, filters);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('card-2');
    });

    it('should filter by search text in number', () => {
        const filters: FilterOptions = { ...emptyFilters, search: '125' };
        const result = filterCards(mockCards, filters);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('card-3');
    });

    it('should filter by search text case-insensitively', () => {
        const filters: FilterOptions = { ...emptyFilters, search: 'LOGIN' };
        const result = filterCards(mockCards, filters);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('card-1');
    });

    it('should filter by label', () => {
        const filters: FilterOptions = { ...emptyFilters, labels: ['bug'] };
        const result = filterCards(mockCards, filters);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('card-1');
    });

    it('should filter by multiple labels', () => {
        const filters: FilterOptions = { ...emptyFilters, labels: ['bug', 'enhancement'] };
        const result = filterCards(mockCards, filters);
        expect(result).toHaveLength(2);
        expect(result.map(c => c.id)).toEqual(['card-1', 'card-2']);
    });

    it('should filter by assignee', () => {
        const filters: FilterOptions = { ...emptyFilters, assignees: ['alice'] };
        const result = filterCards(mockCards, filters);
        expect(result).toHaveLength(2);
        expect(result.map(c => c.id)).toEqual(['card-1', 'card-3']);
    });

    it('should filter by multiple assignees', () => {
        const filters: FilterOptions = { ...emptyFilters, assignees: ['alice', 'charlie'] };
        const result = filterCards(mockCards, filters);
        expect(result).toHaveLength(3);
    });

    it('should filter by author', () => {
        const filters: FilterOptions = { ...emptyFilters, authors: ['bob'] };
        const result = filterCards(mockCards, filters);
        expect(result).toHaveLength(2);
        expect(result.map(c => c.id)).toEqual(['card-1', 'card-3']);
    });

    it('should filter by multiple authors', () => {
        const filters: FilterOptions = { ...emptyFilters, authors: ['bob', 'alice'] };
        const result = filterCards(mockCards, filters);
        expect(result).toHaveLength(3);
    });

    it('should filter by state', () => {
        const filters: FilterOptions = { ...emptyFilters, states: ['open'] };
        const result = filterCards(mockCards, filters);
        expect(result).toHaveLength(2);
        expect(result.map(c => c.id)).toEqual(['card-1', 'card-3']);
    });

    it('should filter by multiple states', () => {
        const filters: FilterOptions = { ...emptyFilters, states: ['open', 'closed'] };
        const result = filterCards(mockCards, filters);
        expect(result).toHaveLength(3);
    });

    it('should filter by type', () => {
        const filters: FilterOptions = { ...emptyFilters, types: ['Issue'] };
        const result = filterCards(mockCards, filters);
        expect(result).toHaveLength(2);
        expect(result.map(c => c.id)).toEqual(['card-1', 'card-2']);
    });

    it('should filter by multiple types', () => {
        const filters: FilterOptions = { ...emptyFilters, types: ['Issue', 'PullRequest'] };
        const result = filterCards(mockCards, filters);
        expect(result).toHaveLength(3);
    });

    it('should filter by milestone', () => {
        const filters: FilterOptions = { ...emptyFilters, milestone: 'v1.0' };
        const result = filterCards(mockCards, filters);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('card-1');
    });

    it('should filter by repository', () => {
        const filters: FilterOptions = { ...emptyFilters, repositories: ['owner/repo'] };
        const result = filterCards(mockCards, filters);
        expect(result).toHaveLength(2);
        expect(result.map(c => c.id)).toEqual(['card-1', 'card-3']);
    });

    it('should filter by multiple repositories', () => {
        const filters: FilterOptions = { ...emptyFilters, repositories: ['owner/repo', 'owner/other'] };
        const result = filterCards(mockCards, filters);
        expect(result).toHaveLength(3);
    });

    it('should apply multiple filters together', () => {
        const filters: FilterOptions = {
            ...emptyFilters,
            labels: ['bug'],
            assignees: ['alice'],
            states: ['open']
        };
        const result = filterCards(mockCards, filters);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('card-1');
    });

    it('should handle cards without labels', () => {
        const cardsWithoutLabels = [createMockCard({ id: 'card-4', title: 'No labels' })];
        const filters: FilterOptions = { ...emptyFilters, labels: ['bug'] };
        const result = filterCards(cardsWithoutLabels, filters);
        expect(result).toHaveLength(0);
    });

    it('should handle cards without body', () => {
        const cardsWithoutBody = [createMockCard({ id: 'card-5', title: 'Test', body: undefined })];
        const filters: FilterOptions = { ...emptyFilters, search: 'content' };
        const result = filterCards(cardsWithoutBody, filters);
        expect(result).toHaveLength(0);
    });

    it('should handle cards without number', () => {
        const cardsWithoutNumber = [createMockCard({ id: 'card-6', title: 'No number', number: undefined })];
        const filters: FilterOptions = { ...emptyFilters, search: '123' };
        const result = filterCards(cardsWithoutNumber, filters);
        expect(result).toHaveLength(0);
    });

    it('should handle cards without author', () => {
        const cardsWithoutAuthor = [createMockCard({ id: 'card-7', title: 'No author', author: undefined })];
        const filters: FilterOptions = { ...emptyFilters, authors: ['bob'] };
        const result = filterCards(cardsWithoutAuthor, filters);
        expect(result).toHaveLength(0);
    });

    it('should handle cards without state', () => {
        const cardsWithoutState = [createMockCard({ id: 'card-8', title: 'No state', state: undefined })];
        const filters: FilterOptions = { ...emptyFilters, states: ['open'] };
        const result = filterCards(cardsWithoutState, filters);
        expect(result).toHaveLength(0);
    });

    it('should handle cards without milestone', () => {
        const cardsWithoutMilestone = [createMockCard({ id: 'card-9', title: 'No milestone', milestone: undefined })];
        const filters: FilterOptions = { ...emptyFilters, milestone: 'v1.0' };
        const result = filterCards(cardsWithoutMilestone, filters);
        expect(result).toHaveLength(0);
    });

    it('should handle cards without repository', () => {
        const cardsWithoutRepo = [createMockCard({ id: 'card-10', title: 'No repo', repository: undefined })];
        const filters: FilterOptions = { ...emptyFilters, repositories: ['owner/repo'] };
        const result = filterCards(cardsWithoutRepo, filters);
        expect(result).toHaveLength(0);
    });
});

describe('sortCards', () => {
    const mockCards: ProjectItem[] = [
        createMockCard({
            id: 'card-1',
            title: 'Zebra',
            createdAt: '2023-01-03T00:00:00Z',
            updatedAt: '2023-01-06T00:00:00Z'
        }),
        createMockCard({
            id: 'card-2',
            title: 'Apple',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-04T00:00:00Z'
        }),
        createMockCard({
            id: 'card-3',
            title: 'Mango',
            createdAt: '2023-01-02T00:00:00Z',
            updatedAt: '2023-01-05T00:00:00Z'
        })
    ];

    it('should sort by title ascending', () => {
        const sort: SortOption = { field: 'title', direction: 'asc' };
        const result = sortCards(mockCards, sort);
        expect(result.map(c => c.id)).toEqual(['card-2', 'card-3', 'card-1']);
    });

    it('should sort by title descending', () => {
        const sort: SortOption = { field: 'title', direction: 'desc' };
        const result = sortCards(mockCards, sort);
        expect(result.map(c => c.id)).toEqual(['card-1', 'card-3', 'card-2']);
    });

    it('should sort by created date ascending', () => {
        const sort: SortOption = { field: 'created', direction: 'asc' };
        const result = sortCards(mockCards, sort);
        expect(result.map(c => c.id)).toEqual(['card-2', 'card-3', 'card-1']);
    });

    it('should sort by created date descending', () => {
        const sort: SortOption = { field: 'created', direction: 'desc' };
        const result = sortCards(mockCards, sort);
        expect(result.map(c => c.id)).toEqual(['card-1', 'card-3', 'card-2']);
    });

    it('should sort by updated date ascending', () => {
        const sort: SortOption = { field: 'updated', direction: 'asc' };
        const result = sortCards(mockCards, sort);
        expect(result.map(c => c.id)).toEqual(['card-2', 'card-3', 'card-1']);
    });

    it('should sort by updated date descending', () => {
        const sort: SortOption = { field: 'updated', direction: 'desc' };
        const result = sortCards(mockCards, sort);
        expect(result.map(c => c.id)).toEqual(['card-1', 'card-3', 'card-2']);
    });

    it('should handle cards with undefined dates', () => {
        const cardsWithUndefinedDates: ProjectItem[] = [
            createMockCard({ id: 'card-1', updatedAt: '2023-01-01T00:00:00Z' }),
            createMockCard({ id: 'card-2', updatedAt: undefined }),
            createMockCard({ id: 'card-3', updatedAt: '2023-01-03T00:00:00Z' })
        ];
        const sort: SortOption = { field: 'updated', direction: 'asc' };
        const result = sortCards(cardsWithUndefinedDates, sort);
        expect(result.map(c => c.id)).toEqual(['card-1', 'card-3', 'card-2']);
    });

    it('should handle all cards with undefined dates', () => {
        const cardsWithoutDates: ProjectItem[] = [
            createMockCard({ id: 'card-1', updatedAt: undefined }),
            createMockCard({ id: 'card-2', updatedAt: undefined })
        ];
        const sort: SortOption = { field: 'updated', direction: 'asc' };
        const result = sortCards(cardsWithoutDates, sort);
        expect(result).toHaveLength(2);
    });

    it('should not modify the original array', () => {
        const original = [...mockCards];
        const sort: SortOption = { field: 'title', direction: 'asc' };
        sortCards(mockCards, sort);
        expect(mockCards).toEqual(original);
    });
});

describe('extractFilterOptions', () => {
    it('should extract all unique labels', () => {
        const cards: ProjectItem[] = [
            createMockCard({ labels: [{ id: 'l1', name: 'bug', color: 'red' }] }),
            createMockCard({ labels: [{ id: 'l2', name: 'enhancement', color: 'blue' }] }),
            createMockCard({ labels: [{ id: 'l1', name: 'bug', color: 'red' }] })
        ];
        const result = extractFilterOptions(cards);
        expect(result.labels).toEqual(['bug', 'enhancement']);
    });

    it('should extract all unique assignees', () => {
        const cards: ProjectItem[] = [
            createMockCard({ assignees: [{ id: 'u1', login: 'alice', avatarUrl: '' }] }),
            createMockCard({ assignees: [{ id: 'u2', login: 'bob', avatarUrl: '' }] }),
            createMockCard({ assignees: [{ id: 'u1', login: 'alice', avatarUrl: '' }] })
        ];
        const result = extractFilterOptions(cards);
        expect(result.assignees).toEqual(['alice', 'bob']);
    });

    it('should extract all unique authors', () => {
        const cards: ProjectItem[] = [
            createMockCard({ author: { login: 'alice', avatarUrl: '' } }),
            createMockCard({ author: { login: 'bob', avatarUrl: '' } }),
            createMockCard({ author: { login: 'alice', avatarUrl: '' } })
        ];
        const result = extractFilterOptions(cards);
        expect(result.authors).toEqual(['alice', 'bob']);
    });

    it('should extract all unique milestones', () => {
        const cards: ProjectItem[] = [
            createMockCard({ milestone: { title: 'v1.0' } }),
            createMockCard({ milestone: { title: 'v2.0' } }),
            createMockCard({ milestone: { title: 'v1.0' } })
        ];
        const result = extractFilterOptions(cards);
        expect(result.milestones).toEqual(['v1.0', 'v2.0']);
    });

    it('should extract all unique repositories', () => {
        const cards: ProjectItem[] = [
            createMockCard({ repository: { id: 'r1', owner: 'owner', name: 'repo1', nameWithOwner: 'owner/repo1' } }),
            createMockCard({ repository: { id: 'r2', owner: 'owner', name: 'repo2', nameWithOwner: 'owner/repo2' } }),
            createMockCard({ repository: { id: 'r1', owner: 'owner', name: 'repo1', nameWithOwner: 'owner/repo1' } })
        ];
        const result = extractFilterOptions(cards);
        expect(result.repositories).toEqual(['owner/repo1', 'owner/repo2']);
    });

    it('should handle cards without labels', () => {
        const cards: ProjectItem[] = [
            createMockCard({ labels: undefined }),
            createMockCard({ labels: [] })
        ];
        const result = extractFilterOptions(cards);
        expect(result.labels).toEqual([]);
    });

    it('should handle cards without assignees', () => {
        const cards: ProjectItem[] = [
            createMockCard({ assignees: [] }),
            createMockCard({ assignees: [] })
        ];
        const result = extractFilterOptions(cards);
        expect(result.assignees).toEqual([]);
    });

    it('should handle cards without authors', () => {
        const cards: ProjectItem[] = [
            createMockCard({ author: undefined }),
            createMockCard({ author: undefined })
        ];
        const result = extractFilterOptions(cards);
        expect(result.authors).toEqual([]);
    });

    it('should handle cards without milestones', () => {
        const cards: ProjectItem[] = [
            createMockCard({ milestone: undefined }),
            createMockCard({ milestone: undefined })
        ];
        const result = extractFilterOptions(cards);
        expect(result.milestones).toEqual([]);
    });

    it('should handle cards without repositories', () => {
        const cards: ProjectItem[] = [
            createMockCard({ repository: undefined }),
            createMockCard({ repository: undefined })
        ];
        const result = extractFilterOptions(cards);
        expect(result.repositories).toEqual([]);
    });

    it('should handle empty array', () => {
        const result = extractFilterOptions([]);
        expect(result).toEqual({
            labels: [],
            assignees: [],
            authors: [],
            milestones: [],
            repositories: []
        });
    });

    it('should sort all extracted options', () => {
        const cards: ProjectItem[] = [
            createMockCard({
                labels: [{ id: 'l1', name: 'zebra', color: 'red' }],
                assignees: [{ id: 'u1', login: 'zoe', avatarUrl: '' }],
                author: { login: 'zane', avatarUrl: '' },
                milestone: { title: 'z-release' },
                repository: { id: 'r1', owner: 'z-owner', name: 'z-repo', nameWithOwner: 'z-owner/z-repo' }
            }),
            createMockCard({
                labels: [{ id: 'l2', name: 'alpha', color: 'blue' }],
                assignees: [{ id: 'u2', login: 'anna', avatarUrl: '' }],
                author: { login: 'adam', avatarUrl: '' },
                milestone: { title: 'a-release' },
                repository: { id: 'r2', owner: 'a-owner', name: 'a-repo', nameWithOwner: 'a-owner/a-repo' }
            })
        ];
        const result = extractFilterOptions(cards);
        expect(result.labels).toEqual(['alpha', 'zebra']);
        expect(result.assignees).toEqual(['anna', 'zoe']);
        expect(result.authors).toEqual(['adam', 'zane']);
        expect(result.milestones).toEqual(['a-release', 'z-release']);
        expect(result.repositories).toEqual(['a-owner/a-repo', 'z-owner/z-repo']);
    });
});
