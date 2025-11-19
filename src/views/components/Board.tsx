import { h } from 'preact';
import { useEffect, useState, useMemo } from 'preact/hooks';
import { Column as ColumnType, ProjectItem } from '../../api/types';
import { ProjectState } from '../../state/project-state';
import { Column } from './Column';
import { EmptyState } from './EmptyState';
import { GlobalFilters, GlobalFilterOptions } from './GlobalFilters';
import { SortOption } from './ColumnFilters';
import { filterCards, sortCards, extractFilterOptions } from '../../utils/card-filters';
import { CardDisplaySettings } from '../../settings';

interface BoardProps {
    state: ProjectState;
    onCardMove: (cardId: string, toColumnId: string) => void;
    onCardClick: (card: ProjectItem) => void;
    cardSettings: CardDisplaySettings;
}

export const Board = ({ state, onCardMove, onCardClick, cardSettings }: BoardProps) => {
    const [columns, setColumns] = useState<ColumnType[]>([]);
    const [loading, setLoading] = useState(true);
    const [globalFilters, setGlobalFilters] = useState<GlobalFilterOptions>({
        search: '',
        labels: [],
        assignees: [],
        authors: [],
        repositories: [],
        states: [],
        types: [],
        milestone: '',
    });
    const [globalSort, setGlobalSort] = useState<SortOption>({
        field: 'updated',
        direction: 'desc',
    });

    useEffect(() => {
        const updateData = () => {
            const cols = state.getColumns();
            setColumns(cols);
            setLoading(false);
        };

        updateData();

        // Subscribe to state changes
        state.on('items-updated', updateData);
        state.on('card-moved', updateData);
        state.on('item-added', updateData);
        state.on('item-removed', updateData);

        return () => {
            state.off('items-updated', updateData);
            state.off('card-moved', updateData);
            state.off('item-added', updateData);
            state.off('item-removed', updateData);
        };
    }, [state]);

    // Extract all available filter options from all cards
    const allCards = useMemo(() => {
        return columns.flatMap(col => col.cards);
    }, [columns]);

    const filterOptions = useMemo(() => extractFilterOptions(allCards), [allCards]);

    // Apply global filters and sort to columns
    const filteredColumns = useMemo(() => {
        return columns.map(column => {
            let cards = filterCards(column.cards, globalFilters);
            cards = sortCards(cards, globalSort);
            return { ...column, cards };
        });
    }, [columns, globalFilters, globalSort]);

    const totalCards = allCards.length;
    const filteredCards = filteredColumns.reduce((sum, col) => sum + col.cards.length, 0);

    if (loading) {
        return <EmptyState message="Loading project..." icon="⏳" />;
    }

    if (columns.length === 0) {
        return <EmptyState message="No columns found" icon="📋" />;
    }

    if (totalCards === 0) {
        return <EmptyState message="No items in this project" icon="✨" />;
    }

    return (
        <div className="board-container">
            <GlobalFilters
                onFilterChange={setGlobalFilters}
                onSortChange={setGlobalSort}
                availableLabels={filterOptions.labels}
                availableAssignees={filterOptions.assignees}
                availableRepositories={filterOptions.repositories}
                totalCards={totalCards}
                filteredCards={filteredCards}
            />
            <div className="project-board">
                {filteredColumns.map(column => (
                    <Column
                        key={column.id}
                        column={column}
                        onCardMove={onCardMove}
                        onCardClick={onCardClick}
                        hideFilters={true}
                        cardSettings={cardSettings}
                    />
                ))}
            </div>
        </div>
    );
};
