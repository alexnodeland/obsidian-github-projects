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
}

export interface SortOption {
    field: 'updated' | 'created' | 'title' | 'comments' | 'reactions';
    direction: 'asc' | 'desc';
}

interface ColumnFiltersProps {
    onFilterChange: (filters: FilterOptions) => void;
    onSortChange: (sort: SortOption) => void;
    availableLabels: string[];
    availableAssignees: string[];
    availableAuthors: string[];
    availableMilestones: string[];
}

export const ColumnFilters = ({
    onFilterChange,
    onSortChange,
    availableLabels,
    availableAssignees,
    availableAuthors,
    availableMilestones
}: ColumnFiltersProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [search, setSearch] = useState('');
    const [sortField, setSortField] = useState<SortOption['field']>('updated');
    const [sortDirection, setSortDirection] = useState<SortOption['direction']>('desc');

    const handleSearchChange = (e: Event) => {
        const value = (e.target as HTMLInputElement).value;
        setSearch(value);
        onFilterChange({
            search: value,
            labels: [],
            assignees: [],
            authors: [],
            states: [],
            types: [],
            milestone: ''
        });
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
                            <button
                                className={`sort-option ${sortField === 'comments' ? 'active' : ''}`}
                                onClick={() => handleSortChange('comments')}
                            >
                                Comments {sortField === 'comments' && (sortDirection === 'desc' ? '↓' : '↑')}
                            </button>
                            <button
                                className={`sort-option ${sortField === 'reactions' ? 'active' : ''}`}
                                onClick={() => handleSortChange('reactions')}
                            >
                                Reactions {sortField === 'reactions' && (sortDirection === 'desc' ? '↓' : '↑')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
