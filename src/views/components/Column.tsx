import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import Sortable, { SortableEvent } from 'sortablejs';
import { Column as ColumnType, ProjectItem } from '../../api/types';
import { Card } from './Card';

interface ColumnProps {
    column: ColumnType;
    onCardMove: (cardId: string, toColumnId: string) => void;
    onCardClick: (card: ProjectItem) => void;
}

export const Column = ({ column, onCardMove, onCardClick }: ColumnProps) => {
    const columnRef = useRef<HTMLDivElement>(null);
    const sortableRef = useRef<Sortable | null>(null);

    useEffect(() => {
        if (!columnRef.current) return;

        // Initialize SortableJS
        sortableRef.current = new Sortable(columnRef.current, {
            group: 'kanban-cards',
            animation: 150,
            ghostClass: 'card-ghost',
            dragClass: 'card-dragging',
            handle: '.card-drag-handle',
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
                <span className="column-count">{column.cards.length}</span>
            </div>

            <div
                className="column-cards"
                ref={columnRef}
                data-column-id={column.id}
            >
                {column.cards.map(card => (
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
