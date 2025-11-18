import { ItemView, WorkspaceLeaf } from 'obsidian';
import { render } from 'preact';
import { h } from 'preact';
import GitHubProjectsPlugin from '../main';
import { Board } from './components/Board';
import { EmptyState } from './components/EmptyState';
import { CardDetailModal } from './modals/CardDetailModal';
import { ProjectItem } from '../api/types';
import { displayError } from '../utils/error-handling';

export const VIEW_TYPE_PROJECT_BOARD = 'github-project-board';

export class ProjectBoardView extends ItemView {
    plugin: GitHubProjectsPlugin;
    private containerElement: HTMLElement | null = null;

    constructor(leaf: WorkspaceLeaf, plugin: GitHubProjectsPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return VIEW_TYPE_PROJECT_BOARD;
    }

    getDisplayText(): string {
        return 'GitHub Project Board';
    }

    getIcon(): string {
        return 'layout-dashboard';
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('github-project-container');

        this.containerElement = container as HTMLElement;

        await this.renderBoard();
    }

    async onClose() {
        // Cleanup
        if (this.containerElement) {
            this.containerElement.empty();
        }
    }

    /**
     * Render the project board
     */
    async renderBoard() {
        if (!this.containerElement) return;

        const token = this.plugin.tokenManager.getToken();

        if (!token) {
            render(
                <EmptyState
                    message="Please configure your GitHub token in settings"
                    icon="🔐"
                    action={{
                        text: 'Open Settings',
                        onClick: () => {
                            // @ts-ignore
                            this.app.setting.open();
                            // @ts-ignore
                            this.app.setting.openTabById('github-projects');
                        }
                    }}
                />,
                this.containerElement
            );
            return;
        }

        const needsConfig = this.plugin.settings.ownerType === 'organization'
            ? !this.plugin.settings.owner || !this.plugin.settings.projectNumber
            : !this.plugin.settings.projectNumber;

        if (needsConfig) {
            const message = this.plugin.settings.ownerType === 'organization'
                ? 'Please configure organization and project number in settings'
                : 'Please configure project number in settings';

            render(
                <EmptyState
                    message={message}
                    icon="⚙️"
                    action={{
                        text: 'Open Settings',
                        onClick: () => {
                            // @ts-ignore
                            this.app.setting.open();
                            // @ts-ignore
                            this.app.setting.openTabById('github-projects');
                        }
                    }}
                />,
                this.containerElement
            );
            return;
        }

        try {
            // Load project data
            await this.plugin.loadProjectData();

            // Render board
            render(
                <Board
                    state={this.plugin.projectState}
                    onCardMove={this.handleCardMove.bind(this)}
                    onCardClick={this.handleCardClick.bind(this)}
                />,
                this.containerElement
            );
        } catch (error) {
            displayError(error as Error);
            render(
                <EmptyState
                    message="Failed to load project. Check console for details."
                    icon="❌"
                    action={{
                        text: 'Retry',
                        onClick: () => this.renderBoard()
                    }}
                />,
                this.containerElement
            );
        }
    }

    /**
     * Handle card movement between columns
     */
    private handleCardMove(cardId: string, toColumnId: string) {
        try {
            // Update local state optimistically
            this.plugin.projectState.moveCard(cardId, toColumnId);

            // Queue update to GitHub
            const statusField = this.plugin.projectState.getStatusField();
            const project = this.plugin.projectState.getProject();

            if (statusField && project) {
                this.plugin.syncManager?.queueUpdate(cardId, {
                    projectId: project.id,
                    itemId: cardId,
                    fieldId: statusField.id,
                    optionId: toColumnId
                });
            }
        } catch (error) {
            displayError(error as Error);
        }
    }

    /**
     * Handle card click to show details
     */
    private handleCardClick(card: ProjectItem) {
        const githubClient = this.plugin.getGitHubClient();
        if (!githubClient) {
            console.error('GitHub client not available');
            return;
        }

        new CardDetailModal(
            this.app,
            card,
            githubClient,
            (updatedCard) => {
                // Refresh the board to show updated card
                this.refresh();
            }
        ).open();
    }

    /**
     * Refresh the view
     */
    async refresh() {
        await this.renderBoard();
    }
}
