import { ProjectItem } from '../api/types';
import { FilterOptions, SortOption } from '../views/components/ColumnFilters';

/**
 * Filter cards based on filter options
 */
export function filterCards(cards: ProjectItem[], filters: FilterOptions): ProjectItem[] {
    let filtered = [...cards];

    // Text search filter
    if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(card =>
            card.title.toLowerCase().includes(searchLower) ||
            (card.body && card.body.toLowerCase().includes(searchLower)) ||
            (card.number && card.number.toString().includes(searchLower))
        );
    }

    // Label filter
    if (filters.labels.length > 0) {
        filtered = filtered.filter(card =>
            card.labels && card.labels.some(label =>
                filters.labels.includes(label.name)
            )
        );
    }

    // Assignee filter
    if (filters.assignees.length > 0) {
        filtered = filtered.filter(card =>
            card.assignees.some(assignee =>
                filters.assignees.includes(assignee.login)
            )
        );
    }

    // Author filter
    if (filters.authors.length > 0) {
        filtered = filtered.filter(card =>
            card.author && filters.authors.includes(card.author.login)
        );
    }

    // State filter
    if (filters.states.length > 0) {
        filtered = filtered.filter(card =>
            card.state && filters.states.includes(card.state.toLowerCase())
        );
    }

    // Type filter
    if (filters.types.length > 0) {
        filtered = filtered.filter(card =>
            filters.types.includes(card.type)
        );
    }

    // Milestone filter
    if (filters.milestone) {
        filtered = filtered.filter(card =>
            card.milestone && card.milestone.title === filters.milestone
        );
    }

    // Repository filter
    if (filters.repositories.length > 0) {
        filtered = filtered.filter(card =>
            card.repository && filters.repositories.includes(card.repository.nameWithOwner)
        );
    }

    return filtered;
}

/**
 * Sort cards based on sort option
 */
export function sortCards(cards: ProjectItem[], sort: SortOption): ProjectItem[] {
    const sorted = [...cards];

    sorted.sort((a, b) => {
        let comparison = 0;

        switch (sort.field) {
            case 'updated':
                comparison = compareDates(a.updatedAt, b.updatedAt);
                break;
            case 'created':
                comparison = compareDates(a.createdAt, b.createdAt);
                break;
            case 'title':
                comparison = (a.title || '').localeCompare(b.title || '');
                break;
        }

        return sort.direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
}

/**
 * Helper function to compare dates
 */
function compareDates(a: string | undefined, b: string | undefined): number {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    return new Date(a).getTime() - new Date(b).getTime();
}

/**
 * Extract unique values from cards for filter options
 */
export function extractFilterOptions(cards: ProjectItem[]) {
    const labels = new Set<string>();
    const assignees = new Set<string>();
    const authors = new Set<string>();
    const milestones = new Set<string>();
    const repositories = new Set<string>();

    cards.forEach(card => {
        // Extract labels
        if (card.labels) {
            card.labels.forEach(label => labels.add(label.name));
        }

        // Extract assignees
        card.assignees.forEach(assignee => assignees.add(assignee.login));

        // Extract authors
        if (card.author) {
            authors.add(card.author.login);
        }

        // Extract milestones
        if (card.milestone) {
            milestones.add(card.milestone.title);
        }

        // Extract repositories
        if (card.repository) {
            repositories.add(card.repository.nameWithOwner);
        }
    });

    return {
        labels: Array.from(labels).sort(),
        assignees: Array.from(assignees).sort(),
        authors: Array.from(authors).sort(),
        milestones: Array.from(milestones).sort(),
        repositories: Array.from(repositories).sort()
    };
}
