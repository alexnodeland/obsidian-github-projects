import { ItemView, WorkspaceLeaf } from 'obsidian';
import { render } from 'preact';
import { h } from 'preact';
import GitHubProjectsPlugin from '../main';
import { Board } from './components/Board';
import { EmptyState } from './components/EmptyState';
import { ProjectSelector } from './components/ProjectSelector';
import { CardDetailModal } from './modals/CardDetailModal';
import { ProjectItem, ProjectSummary } from '../api/types';
import { displayError } from '../utils/error-handling';
import { ToastContainer, useToasts } from './components/Toast';

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
        return 'GitHub project board';
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

        // Check if a default project is configured
        const hasDefaultProject = this.plugin.settings.projectNumber > 0;

        if (!hasDefaultProject) {
            // No default project - show project selector
            let projectsLoaded = false;

            // Fetch available projects and show selector
            const loadProjectSelector = async () => {
                if (!projectsLoaded) {
                    await this.plugin.fetchAllProjects().catch(err => {
                        console.warn('Failed to fetch projects for selector:', err);
                    });
                    projectsLoaded = true;
                }

                const handleProjectSelect = async (project: ProjectSummary) => {
                    // Show loading state
                    if (this.containerElement) {
                        render(
                            <EmptyState
                                message={`Loading ${project.title}...`}
                                icon="⏳"
                            />,
                            this.containerElement
                        );
                    }

                    try {
                        await this.plugin.switchProject(project);
                    } catch (error) {
                        displayError(error as Error);
                        // Re-render selector on error
                        await loadProjectSelector();
                    }
                };

                if (this.containerElement) {
                    render(
                        <ProjectSelector
                            availableProjects={this.plugin.availableProjects || []}
                            isLoading={!projectsLoaded}
                            onSelectProject={handleProjectSelect}
                        />,
                        this.containerElement
                    );
                }
            };

            await loadProjectSelector();
            return;
        }

        try {
            // Fetch all accessible projects first (for project switcher)
            // This is non-blocking - if it fails, the project switcher won't show but the board will still load
            await this.plugin.fetchAllProjects().catch(err => {
                console.warn('Failed to fetch project list for switcher:', err);
                // Don't fail the whole render if project list fails
            });

            // Load project data
            await this.plugin.loadProjectData();

            // Render board with Toast container
            const BoardWithToasts = () => {
                const { toasts, close } = useToasts();
                return (
                    <div style={{ position: 'relative', height: '100%' }}>
                        <Board
                            state={this.plugin.projectState}
                            onCardMove={this.handleCardMove.bind(this)}
                            onCardClick={this.handleCardClick.bind(this)}
                            cardSettings={this.plugin.settings.cardDisplay}
                            availableProjects={this.plugin.availableProjects}
                            currentProject={{
                                owner: this.plugin.settings.owner,
                                number: this.plugin.settings.projectNumber,
                                ownerType: this.plugin.settings.ownerType
                            }}
                            onProjectChange={this.handleProjectChange.bind(this)}
                        />
                        <ToastContainer toasts={toasts} onClose={close} />
                    </div>
                );
            };

            render(<BoardWithToasts />, this.containerElement);
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
            (_updatedCard) => {
                // Refresh the board to show updated card
                this.refresh();
            },
            this.plugin.settings.modalDisplay
        ).open();
    }

    /**
     * Handle project change from dropdown
     */
    private async handleProjectChange(project: ProjectSummary) {
        try {
            // Show loading state immediately
            if (this.containerElement) {
                render(
                    <EmptyState
                        message={`Loading ${project.title}...`}
                        icon="⏳"
                    />,
                    this.containerElement
                );
            }

            // Switch to the new project
            await this.plugin.switchProject(project);
        } catch (error) {
            displayError(error as Error);
            // Re-render board on error to show error state
            await this.renderBoard();
        }
    }

    /**
     * Refresh the view
     */
    async refresh() {
        await this.renderBoard();
    }
}
