import { h } from 'preact';
import { useState } from 'preact/hooks';

export interface FilterOptions {
    search: string;
    labels: string[];
    assignees: string[];
    authors: string[];
    states: string[];
    types: string[];
    milestone: string;
    repositories: string[];
}

export interface SortOption {
    field: 'updated' | 'created' | 'title';
    direction: 'asc' | 'desc';
}

interface ColumnFiltersProps {
    onFilterChange: (filters: FilterOptions) => void;
    onSortChange: (sort: SortOption) => void;
    availableLabels: string[];
    availableAssignees: string[];
    availableAuthors: string[];
    availableMilestones: string[];
    availableRepositories: string[];
}

export const ColumnFilters = ({
    onFilterChange,
    onSortChange,
    availableLabels,
    availableAssignees,
    availableAuthors: _availableAuthors, // Reserved for future use
    availableMilestones: _availableMilestones, // Reserved for future use
    availableRepositories
}: ColumnFiltersProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedRepositories, setSelectedRepositories] = useState<string[]>([]);
    const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
    const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
    const [sortField, setSortField] = useState<SortOption['field']>('updated');
    const [sortDirection, setSortDirection] = useState<SortOption['direction']>('desc');

    const updateFilters = (updates: Partial<FilterOptions>) => {
        onFilterChange({
            search,
            labels: selectedLabels,
            assignees: selectedAssignees,
            authors: [],
            states: [],
            types: [],
            milestone: '',
            repositories: selectedRepositories,
            ...updates
        });
    };

    const handleSearchChange = (e: Event) => {
        const value = (e.target as HTMLInputElement).value;
        setSearch(value);
        updateFilters({ search: value });
    };

    const handleRepositoryToggle = (repo: string) => {
        const newRepos = selectedRepositories.includes(repo)
            ? selectedRepositories.filter(r => r !== repo)
            : [...selectedRepositories, repo];
        setSelectedRepositories(newRepos);
        updateFilters({ repositories: newRepos });
    };

    const handleLabelToggle = (label: string) => {
        const newLabels = selectedLabels.includes(label)
            ? selectedLabels.filter(l => l !== label)
            : [...selectedLabels, label];
        setSelectedLabels(newLabels);
        updateFilters({ labels: newLabels });
    };

    const handleAssigneeToggle = (assignee: string) => {
        const newAssignees = selectedAssignees.includes(assignee)
            ? selectedAssignees.filter(a => a !== assignee)
            : [...selectedAssignees, assignee];
        setSelectedAssignees(newAssignees);
        updateFilters({ assignees: newAssignees });
    };

    const handleSortChange = (field: SortOption['field']) => {
        const newDirection = field === sortField && sortDirection === 'desc' ? 'asc' : 'desc';
        setSortField(field);
        setSortDirection(newDirection);
        onSortChange({ field, direction: newDirection });
    };

    return (
        <div className="column-filters">
            <div className="column-filters-bar">
                <input
                    type="text"
                    className="column-search-input"
                    placeholder="Search cards..."
                    value={search}
                    onInput={handleSearchChange}
                />

                <button
                    className="column-sort-button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    title="Sort and filter options"
                >
                    {isExpanded ? '▼' : '▶'} Sort
                </button>
            </div>

            {isExpanded && (
                <div className="column-filters-panel">
                    <div className="filter-section">
                        <label className="filter-label">Sort by:</label>
                        <div className="sort-options">
                            <button
                                className={`sort-option ${sortField === 'updated' ? 'active' : ''}`}
                                onClick={() => handleSortChange('updated')}
                            >
                                Updated {sortField === 'updated' && (sortDirection === 'desc' ? '↓' : '↑')}
                            </button>
                            <button
                                className={`sort-option ${sortField === 'created' ? 'active' : ''}`}
                                onClick={() => handleSortChange('created')}
                            >
                                Created {sortField === 'created' && (sortDirection === 'desc' ? '↓' : '↑')}
                            </button>
                            <button
                                className={`sort-option ${sortField === 'title' ? 'active' : ''}`}
                                onClick={() => handleSortChange('title')}
                            >
                                Title {sortField === 'title' && (sortDirection === 'desc' ? '↓' : '↑')}
                            </button>
                        </div>
                    </div>

                    {availableLabels.length > 0 && (
                        <div className="filter-section">
                            <label className="filter-label">Filter by label:</label>
                            <div className="filter-chips">
                                {availableLabels.map(label => (
                                    <button
                                        key={label}
                                        className={`filter-chip ${selectedLabels.includes(label) ? 'active' : ''}`}
                                        onClick={() => handleLabelToggle(label)}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {availableAssignees.length > 0 && (
                        <div className="filter-section">
                            <label className="filter-label">Filter by assignee:</label>
                            <div className="filter-chips">
                                {availableAssignees.map(assignee => (
                                    <button
                                        key={assignee}
                                        className={`filter-chip ${selectedAssignees.includes(assignee) ? 'active' : ''}`}
                                        onClick={() => handleAssigneeToggle(assignee)}
                                    >
                                        {assignee}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {availableRepositories.length > 1 && (
                        <div className="filter-section">
                            <label className="filter-label">Filter by repository:</label>
                            <div className="filter-chips">
                                {availableRepositories.map(repo => (
                                    <button
                                        key={repo}
                                        className={`filter-chip ${selectedRepositories.includes(repo) ? 'active' : ''}`}
                                        onClick={() => handleRepositoryToggle(repo)}
                                    >
                                        {repo}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
