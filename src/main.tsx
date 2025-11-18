import { Plugin, WorkspaceLeaf, Notice } from 'obsidian';
import { GitHubClient } from './api/github-client';
import { ProjectState } from './state/project-state';
import { SyncManager } from './state/sync';
import { APICache } from './state/cache';
import { TokenManager } from './utils/auth';
import { displayError } from './utils/error-handling';
import {
    GitHubProjectsSettings,
    GitHubProjectsSettingTab,
    DEFAULT_SETTINGS
} from './settings';
import {
    ProjectBoardView,
    VIEW_TYPE_PROJECT_BOARD
} from './views/ProjectBoardView';

export default class GitHubProjectsPlugin extends Plugin {
    settings: GitHubProjectsSettings;
    tokenManager: TokenManager;
    projectState: ProjectState;
    syncManager: SyncManager | null = null;
    private cache: APICache;
    private githubClient: GitHubClient | null = null;

    async onload() {
        console.log('Loading GitHub Projects plugin');

        await this.loadSettings();

        // Initialize managers
        this.tokenManager = new TokenManager();
        this.projectState = new ProjectState();
        this.cache = new APICache();

        // Register custom view
        this.registerView(
            VIEW_TYPE_PROJECT_BOARD,
            (leaf) => new ProjectBoardView(leaf, this)
        );

        // Add ribbon icon
        this.addRibbonIcon('layout-dashboard', 'Open GitHub Project', () => {
            this.activateView();
        });

        // Register commands
        this.addCommand({
            id: 'open-project-board',
            name: 'Open Project Board',
            callback: () => this.activateView()
        });

        this.addCommand({
            id: 'refresh-project',
            name: 'Refresh Project Data',
            callback: async () => {
                try {
                    await this.syncManager?.forceRefresh();
                    this.refreshViews();
                    new Notice('Project refreshed');
                } catch (error) {
                    displayError(error as Error);
                }
            }
        });

        // Add settings tab
        this.addSettingTab(new GitHubProjectsSettingTab(this.app, this));

        // Initialize GitHub client if token exists
        const token = this.tokenManager.getToken();
        if (token) {
            this.initializeGitHubClient(token);
        }
    }

    async onunload() {
        console.log('Unloading GitHub Projects plugin');

        // Stop auto-sync
        this.syncManager?.destroy();

        // Detach all views
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_PROJECT_BOARD);
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    /**
     * Initialize GitHub client with token
     */
    initializeGitHubClient(token: string) {
        this.githubClient = new GitHubClient(token);
    }

    /**
     * Get GitHub client instance
     */
    getGitHubClient(): GitHubClient | null {
        const token = this.tokenManager.getToken();
        if (!token) return null;

        if (!this.githubClient) {
            this.initializeGitHubClient(token);
        }

        return this.githubClient;
    }

    /**
     * Load project data from GitHub
     */
    async loadProjectData(): Promise<void> {
        const client = this.getGitHubClient();
        if (!client) {
            throw new Error('No GitHub client available. Please configure your token.');
        }

        if (!this.settings.projectNumber) {
            throw new Error('Please configure project number in settings.');
        }

        if (this.settings.ownerType === 'organization' && !this.settings.owner) {
            throw new Error('Please configure organization name in settings.');
        }

        try {
            // Fetch project
            const cacheKey = this.settings.ownerType === 'user'
                ? `project-user-${this.settings.projectNumber}`
                : `project-${this.settings.ownerType}-${this.settings.owner}-${this.settings.projectNumber}`;

            const project = await this.cache.fetchWithCache(
                cacheKey,
                () => client.fetchProject(this.settings.owner, this.settings.projectNumber, this.settings.ownerType)
            );

            this.projectState.setProject(project);

            // Fetch items
            const items = await this.cache.fetchWithCache(
                `items-${project.id}`,
                () => client.fetchProjectItems(project.id)
            );

            this.projectState.setItems(items);

            // Initialize sync manager
            if (!this.syncManager) {
                this.syncManager = new SyncManager(client, this.projectState, project.id, this.cache);

                // Start auto-sync if enabled
                if (this.settings.refreshInterval > 0) {
                    this.syncManager.startAutoSync(this.settings.refreshInterval);
                }
            }

            console.log(`Loaded project: ${project.title} with ${items.length} items`);
        } catch (error) {
            console.error('Failed to load project data:', error);
            throw error;
        }
    }

    /**
     * Activate the project board view
     */
    async activateView() {
        const { workspace } = this.app;

        let leaf: WorkspaceLeaf | null = null;
        const leaves = workspace.getLeavesOfType(VIEW_TYPE_PROJECT_BOARD);

        if (leaves.length > 0) {
            // View already exists, reveal it
            leaf = leaves[0];
        } else {
            // Create new view in right sidebar
            const rightLeaf = workspace.getRightLeaf(false);
            if (rightLeaf) {
                leaf = rightLeaf;
                await leaf.setViewState({
                    type: VIEW_TYPE_PROJECT_BOARD,
                    active: true
                });
            }
        }

        if (leaf) {
            workspace.revealLeaf(leaf);
        }
    }

    /**
     * Refresh all open views
     */
    refreshViews() {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_PROJECT_BOARD);
        leaves.forEach(leaf => {
            const view = leaf.view as ProjectBoardView;
            if (view && view.refresh) {
                view.refresh();
            }
        });
    }
}
