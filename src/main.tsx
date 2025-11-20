import { Plugin, WorkspaceLeaf, Notice } from 'obsidian';
import { GitHubClient } from './api/github-client';
import { ProjectState } from './state/project-state';
import { SyncManager } from './state/sync';
import { APICache } from './state/cache';
import { TokenManager } from './utils/auth';
import { displayError } from './utils/error-handling';
import { ProjectSummary } from './api/types';
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
    public availableProjects: ProjectSummary[] = [];

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
        this.addRibbonIcon('layout-dashboard', 'Open GitHub project', () => {
            this.activateView();
        });

        // Register commands
        this.addCommand({
            id: 'open-project-board',
            name: 'Open project board',
            callback: () => this.activateView()
        });

        this.addCommand({
            id: 'refresh-project',
            name: 'Refresh project data',
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
     * Fetch all accessible projects (user + organizations)
     */
    async fetchAllProjects(): Promise<void> {
        const client = this.getGitHubClient();
        if (!client) {
            console.warn('No GitHub client available for fetching projects');
            return;
        }

        try {
            const cacheKey = 'all-accessible-projects';

            // Force refresh the projects list on first load to ensure we have latest data
            // This helps when switching vaults or after plugin updates
            this.cache.invalidate(cacheKey);

            const projects = await client.fetchAllAccessibleProjects();
            this.availableProjects = projects || [];

            if (this.availableProjects.length > 0) {
                console.log(`Fetched ${this.availableProjects.length} accessible projects for project switcher`);
            }
        } catch (error) {
            console.error('Failed to fetch accessible projects:', error);
            // Don't throw - project switcher is optional
            this.availableProjects = [];
        }
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
            // Create new view in a tab
            leaf = workspace.getLeaf('tab');
            await leaf.setViewState({
                type: VIEW_TYPE_PROJECT_BOARD,
                active: true
            });
        }

        if (leaf) {
            workspace.revealLeaf(leaf);
        }
    }

    /**
     * Switch to a different project
     */
    async switchProject(project: ProjectSummary): Promise<void> {
        // Show loading notice
        new Notice(`Switching to project: ${project.title}...`);

        // Update settings
        this.settings.owner = project.owner;
        this.settings.projectNumber = project.number;
        this.settings.ownerType = project.ownerType;
        await this.saveSettings();

        // Clear cache for old project
        this.cache.invalidate();

        // Stop old sync manager
        if (this.syncManager) {
            this.syncManager.destroy();
            this.syncManager = null;
        }

        // Clear the current project state
        this.projectState = new ProjectState();

        // Load the new project data
        try {
            await this.loadProjectData();
            new Notice(`✓ Switched to project: ${project.title}`);
        } catch (error) {
            console.error('Failed to load new project data:', error);
            new Notice(`Failed to load project: ${project.title}`);
        }

        // Refresh all views to show new data
        this.refreshViews();
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
