import { Events } from 'obsidian';
import { Project, ProjectItem, Column, Field } from '../api/types';

/**
 * Project state management with event emission
 */
export class ProjectState extends Events {
    private project: Project | null = null;
    private items: Map<string, ProjectItem> = new Map();
    private columns: Column[] = [];
    private statusField: Field | null = null;

    /**
     * Set the current project
     */
    setProject(project: Project): void {
        this.project = project;
        this.processFields(project.fields);
        this.trigger('project-updated', project);
    }

    /**
     * Get the current project
     */
    getProject(): Project | null {
        return this.project;
    }

    /**
     * Set project items
     */
    setItems(items: ProjectItem[]): void {
        this.items.clear();
        items.forEach(item => {
            this.items.set(item.id, item);
        });
        this.organizeItemsIntoColumns();
        this.trigger('items-updated', items);
    }

    /**
     * Get all items
     */
    getItems(): ProjectItem[] {
        return Array.from(this.items.values());
    }

    /**
     * Get a specific item
     */
    getItem(itemId: string): ProjectItem | undefined {
        return this.items.get(itemId);
    }

    /**
     * Update a single item
     */
    updateItem(itemId: string, updates: Partial<ProjectItem>): void {
        const item = this.items.get(itemId);
        if (item) {
            Object.assign(item, updates);
            this.items.set(itemId, item);
            this.trigger('item-updated', item);
        }
    }

    /**
     * Add a new item
     */
    addItem(item: ProjectItem): void {
        this.items.set(item.id, item);
        this.organizeItemsIntoColumns();
        this.trigger('item-added', item);
    }

    /**
     * Remove an item
     */
    removeItem(itemId: string): void {
        const item = this.items.get(itemId);
        if (item) {
            this.items.delete(itemId);
            this.organizeItemsIntoColumns();
            this.trigger('item-removed', item);
        }
    }

    /**
     * Move a card to a different column
     */
    moveCard(cardId: string, toColumnId: string): void {
        const card = this.items.get(cardId);
        if (!card) return;

        const column = this.columns.find(c => c.id === toColumnId);
        if (!column) return;

        // Update the card's status field value
        card.fieldValues.set('Status', {
            fieldName: 'Status',
            value: column.name,
            optionId: column.id
        });

        this.items.set(cardId, card);
        this.organizeItemsIntoColumns();
        this.trigger('card-moved', { cardId, toColumnId });
    }

    /**
     * Get columns
     */
    getColumns(): Column[] {
        return this.columns;
    }

    /**
     * Get cards for a specific column
     */
    getColumnCards(columnId: string): ProjectItem[] {
        const column = this.columns.find(c => c.id === columnId);
        return column ? column.cards : [];
    }

    /**
     * Get the status field
     */
    getStatusField(): Field | null {
        return this.statusField;
    }

    /**
     * Clear all state
     */
    clear(): void {
        this.project = null;
        this.items.clear();
        this.columns = [];
        this.statusField = null;
        this.trigger('state-cleared');
    }

    /**
     * Process fields to extract columns from status field
     */
    private processFields(fields: Field[]): void {
        // Find the Status field (single-select type)
        this.statusField = fields.find(
            f => f.name === 'Status' && f.type === 'single-select'
        ) || null;

        if (this.statusField && this.statusField.options) {
            this.columns = this.statusField.options.map(opt => ({
                id: opt.id,
                name: opt.name,
                fieldId: this.statusField!.id,
                cards: []
            }));
        } else {
            // If no Status field, create a default column
            this.columns = [{
                id: 'default',
                name: 'All Items',
                fieldId: '',
                cards: []
            }];
        }

        this.organizeItemsIntoColumns();
    }

    /**
     * Organize items into their respective columns
     */
    private organizeItemsIntoColumns(): void {
        // Clear all column cards
        this.columns.forEach(col => col.cards = []);

        // Distribute items into columns
        this.items.forEach(item => {
            const statusValue = item.fieldValues.get('Status');

            if (statusValue && statusValue.optionId) {
                const column = this.columns.find(c => c.id === statusValue.optionId);
                if (column) {
                    column.cards.push(item);
                }
            } else {
                // Items without status go to first column or default
                if (this.columns.length > 0) {
                    this.columns[0].cards.push(item);
                }
            }
        });
    }
}
