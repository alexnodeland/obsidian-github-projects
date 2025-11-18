import { h } from 'preact';
import { useEffect, useRef, useState, useMemo } from 'preact/hooks';
import Sortable, { SortableEvent } from 'sortablejs';
import { Column as ColumnType, ProjectItem } from '../../api/types';
import { Card } from './Card';
import { ColumnFilters, FilterOptions, SortOption } from './ColumnFilters';
import { filterCards, sortCards, extractFilterOptions } from '../../utils/card-filters';

interface ColumnProps {
    column: ColumnType;
    onCardMove: (cardId: string, toColumnId: string) => void;
    onCardClick: (card: ProjectItem) => void;
}

export const Column = ({ column, onCardMove, onCardClick }: ColumnProps) => {
    const columnRef = useRef<HTMLDivElement>(null);
    const sortableRef = useRef<Sortable | null>(null);
    const [filters, setFilters] = useState<FilterOptions>({
        search: '',
        labels: [],
        assignees: [],
        authors: [],
        states: [],
        types: [],
        milestone: ''
    });
    const [sort, setSort] = useState<SortOption>({
        field: 'updated',
        direction: 'desc'
    });

    // Extract filter options from all cards in this column
    const filterOptions = useMemo(() => extractFilterOptions(column.cards), [column.cards]);

    // Apply filters and sorting
    const displayedCards = useMemo(() => {
        let processed = filterCards(column.cards, filters);
        processed = sortCards(processed, sort);
        return processed;
    }, [column.cards, filters, sort]);

    useEffect(() => {
        if (!columnRef.current) return;

        // Initialize SortableJS
        sortableRef.current = new Sortable(columnRef.current, {
            group: 'kanban-cards',
            animation: 150,
            ghostClass: 'card-ghost',
            dragClass: 'card-dragging',
            onEnd: (evt: SortableEvent) => {
                const cardId = evt.item.dataset.cardId;
                const toColumnId = evt.to.dataset.columnId;

                if (cardId && toColumnId) {
                    onCardMove(cardId, toColumnId);
                }
            }
        });

        return () => {
            if (sortableRef.current) {
                sortableRef.current.destroy();
            }
        };
    }, [onCardMove]);

    return (
        <div className="kanban-column">
            <div className="column-header">
                <span className="column-name">{column.name}</span>
                <span className="column-count">{displayedCards.length} / {column.cards.length}</span>
            </div>

            <ColumnFilters
                onFilterChange={setFilters}
                onSortChange={setSort}
                availableLabels={filterOptions.labels}
                availableAssignees={filterOptions.assignees}
                availableAuthors={filterOptions.authors}
                availableMilestones={filterOptions.milestones}
            />

            <div
                className="column-cards"
                ref={columnRef}
                data-column-id={column.id}
            >
                {displayedCards.map(card => (
                    <Card
                        key={card.id}
                        card={card}
                        onClick={onCardClick}
                    />
                ))}
            </div>
        </div>
    );
};
