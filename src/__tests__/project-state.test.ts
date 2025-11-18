import { ProjectState } from '../state/project-state';
import { Project, ProjectItem, Field } from '../api/types';

describe('ProjectState', () => {
    let state: ProjectState;

    beforeEach(() => {
        state = new ProjectState();
    });

    describe('setProject', () => {
        it('should set project and process fields', () => {
            const mockProject: Project = {
                id: 'PVT_1',
                title: 'Test Project',
                url: 'https://github.com/test',
                number: 1,
                fields: [
                    {
                        id: 'FIELD_1',
                        name: 'Status',
                        type: 'single-select',
                        options: [
                            { id: 'OPT_1', name: 'Todo' },
                            { id: 'OPT_2', name: 'Done' }
                        ]
                    }
                ]
            };

            const eventSpy = jest.fn();
            state.on('project-updated', eventSpy);

            state.setProject(mockProject);

            expect(state.getProject()).toBe(mockProject);
            expect(state.getColumns()).toHaveLength(2);
            expect(state.getColumns()[0].name).toBe('Todo');
            expect(eventSpy).toHaveBeenCalledWith(mockProject);
        });

        it('should create default column when no Status field', () => {
            const mockProject: Project = {
                id: 'PVT_1',
                title: 'Test Project',
                url: 'https://github.com/test',
                number: 1,
                fields: []
            };

            state.setProject(mockProject);

            const columns = state.getColumns();
            expect(columns).toHaveLength(1);
            expect(columns[0].name).toBe('All Items');
        });
    });

    describe('setItems and getItems', () => {
        it('should set and retrieve items', () => {
            const mockItems: ProjectItem[] = [
                {
                    id: 'ITEM_1',
                    type: 'Issue',
                    title: 'Test Issue',
                    assignees: [],
                    fieldValues: new Map()
                }
            ];

            const eventSpy = jest.fn();
            state.on('items-updated', eventSpy);

            state.setItems(mockItems);

            expect(state.getItems()).toEqual(mockItems);
            expect(state.getItem('ITEM_1')).toBe(mockItems[0]);
            expect(eventSpy).toHaveBeenCalledWith(mockItems);
        });
    });

    describe('moveCard', () => {
        beforeEach(() => {
            // Set up project with columns
            const mockProject: Project = {
                id: 'PVT_1',
                title: 'Test Project',
                url: 'https://github.com/test',
                number: 1,
                fields: [
                    {
                        id: 'FIELD_1',
                        name: 'Status',
                        type: 'single-select',
                        options: [
                            { id: 'OPT_1', name: 'Todo' },
                            { id: 'OPT_2', name: 'Done' }
                        ]
                    }
                ]
            };
            state.setProject(mockProject);

            // Add an item
            const mockItems: ProjectItem[] = [
                {
                    id: 'ITEM_1',
                    type: 'Issue',
                    title: 'Test Issue',
                    assignees: [],
                    fieldValues: new Map([
                        ['Status', {
                            fieldName: 'Status',
                            value: 'Todo',
                            optionId: 'OPT_1'
                        }]
                    ])
                }
            ];
            state.setItems(mockItems);
        });

        it('should move card to new column', () => {
            const eventSpy = jest.fn();
            state.on('card-moved', eventSpy);

            state.moveCard('ITEM_1', 'OPT_2');

            const item = state.getItem('ITEM_1');
            expect(item?.fieldValues.get('Status')?.value).toBe('Done');
            expect(item?.fieldValues.get('Status')?.optionId).toBe('OPT_2');
            expect(eventSpy).toHaveBeenCalledWith({ cardId: 'ITEM_1', toColumnId: 'OPT_2' });
        });

        it('should not move card if card does not exist', () => {
            state.moveCard('NONEXISTENT', 'OPT_2');
            // Should not throw error
        });

        it('should not move card if column does not exist', () => {
            const item = state.getItem('ITEM_1');
            const originalValue = item?.fieldValues.get('Status')?.value;

            state.moveCard('ITEM_1', 'NONEXISTENT');

            expect(item?.fieldValues.get('Status')?.value).toBe(originalValue);
        });
    });

    describe('updateItem', () => {
        it('should update item properties', () => {
            const mockItems: ProjectItem[] = [
                {
                    id: 'ITEM_1',
                    type: 'Issue',
                    title: 'Original Title',
                    assignees: [],
                    fieldValues: new Map()
                }
            ];
            state.setItems(mockItems);

            const eventSpy = jest.fn();
            state.on('item-updated', eventSpy);

            state.updateItem('ITEM_1', { title: 'Updated Title' });

            const item = state.getItem('ITEM_1');
            expect(item?.title).toBe('Updated Title');
            expect(eventSpy).toHaveBeenCalled();
        });
    });

    describe('addItem and removeItem', () => {
        it('should add new item', () => {
            const eventSpy = jest.fn();
            state.on('item-added', eventSpy);

            const newItem: ProjectItem = {
                id: 'ITEM_1',
                type: 'Issue',
                title: 'New Issue',
                assignees: [],
                fieldValues: new Map()
            };

            state.addItem(newItem);

            expect(state.getItem('ITEM_1')).toBe(newItem);
            expect(eventSpy).toHaveBeenCalledWith(newItem);
        });

        it('should remove item', () => {
            const mockItems: ProjectItem[] = [
                {
                    id: 'ITEM_1',
                    type: 'Issue',
                    title: 'Test Issue',
                    assignees: [],
                    fieldValues: new Map()
                }
            ];
            state.setItems(mockItems);

            const eventSpy = jest.fn();
            state.on('item-removed', eventSpy);

            state.removeItem('ITEM_1');

            expect(state.getItem('ITEM_1')).toBeUndefined();
            expect(eventSpy).toHaveBeenCalled();
        });
    });

    describe('clear', () => {
        it('should clear all state', () => {
            const mockProject: Project = {
                id: 'PVT_1',
                title: 'Test Project',
                url: 'https://github.com/test',
                number: 1,
                fields: []
            };
            state.setProject(mockProject);
            state.setItems([{
                id: 'ITEM_1',
                type: 'Issue',
                title: 'Test',
                assignees: [],
                fieldValues: new Map()
            }]);

            const eventSpy = jest.fn();
            state.on('state-cleared', eventSpy);

            state.clear();

            expect(state.getProject()).toBeNull();
            expect(state.getItems()).toHaveLength(0);
            expect(state.getColumns()).toHaveLength(0);
            expect(eventSpy).toHaveBeenCalled();
        });
    });
});
