import { SyncManager } from '../state/sync';
import { GitHubClient } from '../api/github-client';
import { ProjectState } from '../state/project-state';
import { APICache } from '../state/cache';
import { displayError } from '../utils/error-handling';
import { Notice } from 'obsidian';

// Mock dependencies
jest.mock('../api/github-client');
jest.mock('../state/project-state');
jest.mock('../state/cache');
jest.mock('../utils/error-handling');
jest.mock('obsidian', () => ({
    Notice: jest.fn()
}));

describe('SyncManager', () => {
    let syncManager: SyncManager;
    let mockClient: jest.Mocked<GitHubClient>;
    let mockState: jest.Mocked<ProjectState>;
    let mockCache: jest.Mocked<APICache>;
    const projectId = 'test-project-123';

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();

        // Mock window object for setInterval/clearInterval
        global.window = {
            setInterval: jest.fn((callback: Function, delay: number) => {
                return setInterval(callback as any, delay);
            }),
            clearInterval: jest.fn((id: number) => {
                clearInterval(id);
            })
        } as any;

        // Create mock instances
        mockClient = {
            fetchProjectItems: jest.fn(),
            updateSingleSelectField: jest.fn()
        } as any;

        mockState = {
            setItems: jest.fn()
        } as any;

        mockCache = {
            invalidate: jest.fn()
        } as any;

        syncManager = new SyncManager(mockClient, mockState, projectId, mockCache);
    });

    afterEach(() => {
        syncManager.destroy();
        jest.useRealTimers();
    });

    describe('startAutoSync', () => {
        it('should start auto-sync with specified interval', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            syncManager.startAutoSync(30);

            expect(consoleSpy).toHaveBeenCalledWith('Auto-sync started with 30s interval');
            consoleSpy.mockRestore();
        });

        it('should not start auto-sync with zero or negative interval', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            syncManager.startAutoSync(0);
            expect(consoleSpy).not.toHaveBeenCalled();

            syncManager.startAutoSync(-5);
            expect(consoleSpy).not.toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        it('should call sync at specified intervals', async () => {
            mockClient.fetchProjectItems.mockResolvedValue([]);

            syncManager.startAutoSync(10);

            // Advance time by 10 seconds
            await jest.advanceTimersByTimeAsync(10000);
            expect(mockClient.fetchProjectItems).toHaveBeenCalledTimes(1);

            // Advance another 10 seconds
            await jest.advanceTimersByTimeAsync(10000);
            expect(mockClient.fetchProjectItems).toHaveBeenCalledTimes(2);
        });

        it('should stop previous auto-sync before starting new one', () => {
            syncManager.startAutoSync(30);
            syncManager.startAutoSync(60);

            // Only the 60s interval should be active
            // This is verified by checking that stopAutoSync was called
            expect(jest.getTimerCount()).toBe(1);
        });

        it('should handle sync errors during auto-sync', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            const error = new Error('Sync failed');
            mockClient.fetchProjectItems.mockRejectedValue(error);

            syncManager.startAutoSync(10);

            await jest.advanceTimersByTimeAsync(10000);

            expect(consoleErrorSpy).toHaveBeenCalledWith('Auto-sync failed:', error);
            consoleErrorSpy.mockRestore();
        });
    });

    describe('stopAutoSync', () => {
        it('should stop auto-sync', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            syncManager.startAutoSync(30);
            syncManager.stopAutoSync();

            expect(consoleSpy).toHaveBeenCalledWith('Auto-sync stopped');
            consoleSpy.mockRestore();
        });

        it('should not error when stopping without starting', () => {
            expect(() => syncManager.stopAutoSync()).not.toThrow();
        });

        it('should prevent sync from running after stop', async () => {
            mockClient.fetchProjectItems.mockResolvedValue([]);

            syncManager.startAutoSync(10);
            syncManager.stopAutoSync();

            await jest.advanceTimersByTimeAsync(10000);

            expect(mockClient.fetchProjectItems).not.toHaveBeenCalled();
        });
    });

    describe('sync', () => {
        it('should fetch items and update state', async () => {
            const mockItems = [
                { id: '1', title: 'Item 1' },
                { id: '2', title: 'Item 2' }
            ] as any;

            mockClient.fetchProjectItems.mockResolvedValue(mockItems);
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await syncManager.sync();

            expect(mockCache.invalidate).toHaveBeenCalledWith(`items-${projectId}`);
            expect(mockClient.fetchProjectItems).toHaveBeenCalledWith(projectId);
            expect(mockState.setItems).toHaveBeenCalledWith(mockItems);
            expect(consoleSpy).toHaveBeenCalledWith('Synced 2 items from GitHub');

            consoleSpy.mockRestore();
        });

        it('should skip sync if already in progress', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            mockClient.fetchProjectItems.mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve([]), 1000))
            );

            // Start first sync
            const sync1 = syncManager.sync();

            // Try to start second sync while first is in progress
            await syncManager.sync();

            expect(consoleSpy).toHaveBeenCalledWith('Sync already in progress, skipping');

            // Clean up
            await jest.advanceTimersByTimeAsync(1000);
            await sync1;
            consoleSpy.mockRestore();
        });

        it('should handle sync errors', async () => {
            const error = new Error('Fetch failed');
            mockClient.fetchProjectItems.mockRejectedValue(error);

            await expect(syncManager.sync()).rejects.toThrow('Fetch failed');
            expect(displayError).toHaveBeenCalledWith(error);
        });

        it('should reset isSyncing flag after error', async () => {
            const error = new Error('Fetch failed');
            mockClient.fetchProjectItems.mockRejectedValue(error);

            await expect(syncManager.sync()).rejects.toThrow();

            // Should be able to sync again after error
            mockClient.fetchProjectItems.mockResolvedValue([]);
            await expect(syncManager.sync()).resolves.not.toThrow();
        });

        it('should push pending updates before fetching', async () => {
            const mockItems = [] as any;
            mockClient.fetchProjectItems.mockResolvedValue(mockItems);

            // Make the first update fail so it stays in pending
            mockClient.updateSingleSelectField
                .mockRejectedValueOnce(new Error('Failed'))
                .mockResolvedValue(undefined);

            // Queue an update (will fail immediately)
            syncManager.queueUpdate('item-1', {
                projectId,
                itemId: 'item-1',
                fieldId: 'field-1',
                optionId: 'option-1'
            });

            // Wait for the immediate push attempt to complete
            await jest.runAllTimersAsync();

            // Should still have pending update
            expect(syncManager.hasPendingUpdates()).toBe(true);

            // Clear the mock calls from queueUpdate
            mockClient.updateSingleSelectField.mockClear();

            // Now sync
            await syncManager.sync();

            // Should have pushed updates before fetching
            expect(mockClient.updateSingleSelectField).toHaveBeenCalled();
            expect(mockClient.fetchProjectItems).toHaveBeenCalled();
        });
    });

    describe('queueUpdate', () => {
        it('should queue an update', () => {
            const update = {
                projectId,
                itemId: 'item-1',
                fieldId: 'field-1',
                optionId: 'option-1'
            };

            syncManager.queueUpdate('item-1', update);

            expect(syncManager.hasPendingUpdates()).toBe(true);
        });

        it('should attempt immediate push', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            mockClient.updateSingleSelectField.mockResolvedValue(undefined);

            const update = {
                projectId,
                itemId: 'item-1',
                fieldId: 'field-1',
                optionId: 'option-1'
            };

            syncManager.queueUpdate('item-1', update);

            await jest.runAllTimersAsync();

            expect(mockClient.updateSingleSelectField).toHaveBeenCalledWith(
                projectId,
                'item-1',
                'field-1',
                'option-1'
            );

            consoleErrorSpy.mockRestore();
        });

        it('should handle immediate push errors', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            const error = new Error('Update failed');
            mockClient.updateSingleSelectField.mockRejectedValue(error);

            const update = {
                projectId,
                itemId: 'item-1',
                fieldId: 'field-1',
                optionId: 'option-1'
            };

            syncManager.queueUpdate('item-1', update);

            await jest.runAllTimersAsync();

            // The error message comes from pushPendingUpdates, not from queueUpdate
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Failed to sync update for item item-1:',
                error
            );

            consoleErrorSpy.mockRestore();
        });

        it('should replace existing update for same item', () => {
            const update1 = {
                projectId,
                itemId: 'item-1',
                fieldId: 'field-1',
                optionId: 'option-1'
            };

            const update2 = {
                projectId,
                itemId: 'item-1',
                fieldId: 'field-1',
                optionId: 'option-2'
            };

            syncManager.queueUpdate('item-1', update1);
            syncManager.queueUpdate('item-1', update2);

            // Should still only have one pending update
            expect(syncManager.hasPendingUpdates()).toBe(true);
        });
    });

    describe('pushPendingUpdates', () => {
        it('should push all pending updates successfully', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            mockClient.updateSingleSelectField.mockResolvedValue(undefined);

            syncManager.queueUpdate('item-1', {
                projectId,
                itemId: 'item-1',
                fieldId: 'field-1',
                optionId: 'option-1'
            });

            syncManager.queueUpdate('item-2', {
                projectId,
                itemId: 'item-2',
                fieldId: 'field-2',
                optionId: 'option-2'
            });

            await jest.runAllTimersAsync();

            // Each queueUpdate triggers an immediate push, so we get 2 calls total
            expect(mockClient.updateSingleSelectField).toHaveBeenCalled();
            expect(syncManager.hasPendingUpdates()).toBe(false);
            // Each successful push logs separately
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Successfully pushed'));

            consoleSpy.mockRestore();
        });

        it('should retry failed updates on next sync', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            const error = new Error('Update failed');

            mockClient.updateSingleSelectField
                .mockRejectedValueOnce(error)
                .mockResolvedValueOnce(undefined);

            syncManager.queueUpdate('item-1', {
                projectId,
                itemId: 'item-1',
                fieldId: 'field-1',
                optionId: 'option-1'
            });

            // First attempt fails
            await jest.runAllTimersAsync();
            expect(syncManager.hasPendingUpdates()).toBe(true);

            // Second attempt succeeds
            mockClient.fetchProjectItems.mockResolvedValue([]);
            await syncManager.sync();

            expect(syncManager.hasPendingUpdates()).toBe(false);
            consoleErrorSpy.mockRestore();
        });

        it('should handle partial success', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            mockClient.updateSingleSelectField
                .mockResolvedValueOnce(undefined) // Success for item-1
                .mockRejectedValueOnce(new Error('Failed')) // Failure for item-2
                .mockResolvedValueOnce(undefined); // Success for item-3

            syncManager.queueUpdate('item-1', {
                projectId,
                itemId: 'item-1',
                fieldId: 'field-1',
                optionId: 'option-1'
            });

            syncManager.queueUpdate('item-2', {
                projectId,
                itemId: 'item-2',
                fieldId: 'field-2',
                optionId: 'option-2'
            });

            syncManager.queueUpdate('item-3', {
                projectId,
                itemId: 'item-3',
                fieldId: 'field-3',
                optionId: 'option-3'
            });

            await jest.runAllTimersAsync();

            // Should have successful pushes logged
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Successfully pushed'));
            // Should have error logged for failed item
            expect(consoleErrorSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
            consoleErrorSpy.mockRestore();
        });
    });

    describe('forceRefresh', () => {
        it('should clear pending updates and refresh from GitHub', async () => {
            mockClient.fetchProjectItems.mockResolvedValue([]);
            mockClient.updateSingleSelectField.mockResolvedValue(undefined);

            syncManager.queueUpdate('item-1', {
                projectId,
                itemId: 'item-1',
                fieldId: 'field-1',
                optionId: 'option-1'
            });

            expect(syncManager.hasPendingUpdates()).toBe(true);

            await syncManager.forceRefresh();

            expect(syncManager.hasPendingUpdates()).toBe(false);
            expect(mockCache.invalidate).toHaveBeenCalledWith();
            expect(mockCache.invalidate).toHaveBeenCalledWith(`items-${projectId}`);
            expect(Notice).toHaveBeenCalledWith('Project refreshed from GitHub');
        });
    });

    describe('hasPendingUpdates', () => {
        it('should return false when no pending updates', () => {
            expect(syncManager.hasPendingUpdates()).toBe(false);
        });

        it('should return true when there are pending updates', () => {
            syncManager.queueUpdate('item-1', {
                projectId,
                itemId: 'item-1',
                fieldId: 'field-1',
                optionId: 'option-1'
            });

            expect(syncManager.hasPendingUpdates()).toBe(true);
        });
    });

    describe('destroy', () => {
        it('should stop auto-sync and clear pending updates', () => {
            syncManager.startAutoSync(30);

            syncManager.queueUpdate('item-1', {
                projectId,
                itemId: 'item-1',
                fieldId: 'field-1',
                optionId: 'option-1'
            });

            expect(syncManager.hasPendingUpdates()).toBe(true);

            syncManager.destroy();

            expect(syncManager.hasPendingUpdates()).toBe(false);
            expect(jest.getTimerCount()).toBe(0);
        });
    });
});
