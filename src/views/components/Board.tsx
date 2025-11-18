import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Column as ColumnType, ProjectItem } from '../../api/types';
import { ProjectState } from '../../state/project-state';
import { Column } from './Column';
import { EmptyState } from './EmptyState';

interface BoardProps {
    state: ProjectState;
    onCardMove: (cardId: string, toColumnId: string) => void;
    onCardClick: (card: ProjectItem) => void;
}

export const Board = ({ state, onCardMove, onCardClick }: BoardProps) => {
    const [columns, setColumns] = useState<ColumnType[]>([]);
    const [loading, setLoading] = useState(true);

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

    if (loading) {
        return <EmptyState message="Loading project..." icon="⏳" />;
    }

    if (columns.length === 0) {
        return <EmptyState message="No columns found" icon="📋" />;
    }

    const totalCards = columns.reduce((sum, col) => sum + col.cards.length, 0);

    if (totalCards === 0) {
        return <EmptyState message="No items in this project" icon="✨" />;
    }

    return (
        <div className="project-board">
            {columns.map(column => (
                <Column
                    key={column.id}
                    column={column}
                    onCardMove={onCardMove}
                    onCardClick={onCardClick}
                />
            ))}
        </div>
    );
};
