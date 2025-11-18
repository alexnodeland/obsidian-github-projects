import { Notice } from 'obsidian';
import { GitHubClient } from '../api/github-client';
import { ProjectState } from './project-state';
import { displayError } from '../utils/error-handling';

interface PendingUpdate {
    projectId: string;
    itemId: string;
    fieldId: string;
    optionId: string;
}

/**
 * Manages bidirectional sync between local state and GitHub
 */
export class SyncManager {
    private syncInterval: number | null = null;
    private pendingUpdates: Map<string, PendingUpdate> = new Map();
    private isSyncing = false;

    constructor(
        private client: GitHubClient,
        private state: ProjectState,
        private projectId: string
    ) {}

    /**
     * Start automatic syncing
     */
    startAutoSync(intervalSeconds: number): void {
        if (intervalSeconds <= 0) return;

        this.stopAutoSync();
        this.syncInterval = window.setInterval(() => {
            this.sync().catch(error => {
                console.error('Auto-sync failed:', error);
            });
        }, intervalSeconds * 1000);

        console.log(`Auto-sync started with ${intervalSeconds}s interval`);
    }

    /**
     * Stop automatic syncing
     */
    stopAutoSync(): void {
        if (this.syncInterval !== null) {
            window.clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('Auto-sync stopped');
        }
    }

    /**
     * Perform a full sync
     */
    async sync(): Promise<void> {
        if (this.isSyncing) {
            console.log('Sync already in progress, skipping');
            return;
        }

        this.isSyncing = true;

        try {
            // First, push pending updates
            await this.pushPendingUpdates();

            // Then, fetch latest from GitHub
            const items = await this.client.fetchProjectItems(this.projectId);
            this.state.setItems(items);

            console.log(`Synced ${items.length} items from GitHub`);
        } catch (error) {
            displayError(error as Error);
            throw error;
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Queue an update to be synced
     */
    queueUpdate(itemId: string, update: PendingUpdate): void {
        this.pendingUpdates.set(itemId, update);

        // Try immediate sync
        this.pushPendingUpdates().catch(error => {
            console.error('Failed to push update immediately:', error);
        });
    }

    /**
     * Push all pending updates to GitHub
     */
    private async pushPendingUpdates(): Promise<void> {
        if (this.pendingUpdates.size === 0) return;

        const updates = Array.from(this.pendingUpdates.entries());
        const succeeded: string[] = [];

        for (const [itemId, update] of updates) {
            try {
                await this.client.updateSingleSelectField(
                    update.projectId,
                    update.itemId,
                    update.fieldId,
                    update.optionId
                );
                succeeded.push(itemId);
            } catch (error) {
                console.error(`Failed to sync update for item ${itemId}:`, error);
                // Don't remove from pending - will retry on next sync
            }
        }

        // Remove successfully synced updates
        succeeded.forEach(itemId => this.pendingUpdates.delete(itemId));

        if (succeeded.length > 0) {
            console.log(`Successfully pushed ${succeeded.length} updates to GitHub`);
        }
    }

    /**
     * Force refresh from GitHub (discarding pending updates)
     */
    async forceRefresh(): Promise<void> {
        this.pendingUpdates.clear();
        await this.sync();
        new Notice('Project refreshed from GitHub');
    }

    /**
     * Check if there are pending updates
     */
    hasPendingUpdates(): boolean {
        return this.pendingUpdates.size > 0;
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        this.stopAutoSync();
        this.pendingUpdates.clear();
    }
}
