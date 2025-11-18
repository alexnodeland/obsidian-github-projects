import { h } from 'preact';
import { useState } from 'preact/hooks';
import { SortOption } from './ColumnFilters';

export interface GlobalFilterOptions {
    search: string;
    labels: string[];
    assignees: string[];
    authors: string[];
    repositories: string[];
    states: string[];
    types: string[];
    milestone: string;
}

interface GlobalFiltersProps {
    onFilterChange: (filters: GlobalFilterOptions) => void;
    onSortChange: (sort: SortOption) => void;
    availableLabels: string[];
    availableAssignees: string[];
    availableRepositories: string[];
    totalCards: number;
    filteredCards: number;
}

export const GlobalFilters = ({
    onFilterChange,
    onSortChange,
    availableLabels,
    availableAssignees,
    availableRepositories,
    totalCards,
    filteredCards,
}: GlobalFiltersProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedRepositories, setSelectedRepositories] = useState<string[]>([]);
    const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
    const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
    const [sortField, setSortField] = useState<SortOption['field']>('updated');
    const [sortDirection, setSortDirection] = useState<SortOption['direction']>('desc');

    const updateFilters = (updates: Partial<GlobalFilterOptions>) => {
        onFilterChange({
            search,
            labels: selectedLabels,
            assignees: selectedAssignees,
            authors: [],
            repositories: selectedRepositories,
            states: [],
            types: [],
            milestone: '',
            ...updates,
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

    const clearAllFilters = () => {
        setSearch('');
        setSelectedRepositories([]);
        setSelectedLabels([]);
        setSelectedAssignees([]);
        updateFilters({ search: '', repositories: [], labels: [], assignees: [], authors: [], milestone: '' });
    };

    const hasActiveFilters = search !== '' || selectedRepositories.length > 0 ||
        selectedLabels.length > 0 || selectedAssignees.length > 0;

    return (
        <div className="global-filters">
            <div className="global-filters-header">
                <input
                    type="text"
                    className="global-search-input"
                    placeholder="Search all cards..."
                    value={search}
                    onInput={handleSearchChange}
                />
                <div className="global-filters-summary">
                    <span className="filtered-count">
                        Showing {filteredCards} of {totalCards} cards
                    </span>
                    <button
                        className="global-filters-toggle"
                        onClick={() => setIsExpanded(!isExpanded)}
                        title="Toggle filters"
                    >
                        {isExpanded ? '▼' : '▶'} Filters & Sort
                    </button>
                    {hasActiveFilters && (
                        <button
                            className="clear-filters-button"
                            onClick={clearAllFilters}
                            title="Clear all filters"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="global-filters-panel">
                    {/* Sort Options */}
                    <div className="global-filter-section">
                        <label className="global-filter-label">Sort by:</label>
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

                    {/* Repository Filter */}
                    {availableRepositories.length > 1 && (
                        <div className="global-filter-section">
                            <label className="global-filter-label">
                                Repositories ({selectedRepositories.length} selected):
                            </label>
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

                    {/* Labels Filter */}
                    {availableLabels.length > 0 && (
                        <div className="global-filter-section">
                            <label className="global-filter-label">
                                Labels ({selectedLabels.length} selected):
                            </label>
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

                    {/* Assignees Filter */}
                    {availableAssignees.length > 0 && (
                        <div className="global-filter-section">
                            <label className="global-filter-label">
                                Assignees ({selectedAssignees.length} selected):
                            </label>
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
                </div>
            )}
        </div>
    );
};
