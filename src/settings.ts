import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import GitHubProjectsPlugin from './main';

export interface CardDisplaySettings {
    // What to show on Kanban cards
    titleLength: number;
    showRepository: boolean;
    showLabels: boolean;
    maxLabels: number;
    showDescription: boolean;
    descriptionLength: number;
    showMilestone: boolean;
    showPRChanges: boolean;
    showAuthor: boolean;
    showAssignees: boolean;
    maxAssignees: number;
    showCommentCount: boolean;
    showReactionCount: boolean;
    showUpdatedTime: boolean;
    showState: boolean;
}

export interface ModalDisplaySettings {
    // What sections to show in detail modal
    showStatusBadges: boolean;
    showRepository: boolean;
    showLabels: boolean;
    showAssignees: boolean;
    showAuthor: boolean;
    showReviewers: boolean;
    showMilestone: boolean;
    showPRChanges: boolean;
    showEngagement: boolean;
    showTimeline: boolean;
    showComments: boolean;
}

export interface GitHubProjectsSettings {
    ownerType: 'user' | 'organization';
    owner: string; // username or organization name
    projectNumber: number;
    refreshInterval: number; // seconds, 0 for manual only
    cardDisplay: CardDisplaySettings;
    modalDisplay: ModalDisplaySettings;
}

export const DEFAULT_CARD_DISPLAY: CardDisplaySettings = {
    titleLength: 80,
    showRepository: true,
    showLabels: true,
    maxLabels: 3,
    showDescription: true,
    descriptionLength: 100,
    showMilestone: true,
    showPRChanges: true,
    showAuthor: true,
    showAssignees: true,
    maxAssignees: 2,
    showCommentCount: true,
    showReactionCount: true,
    showUpdatedTime: true,
    showState: true,
};

export const DEFAULT_MODAL_DISPLAY: ModalDisplaySettings = {
    showStatusBadges: true,
    showRepository: true,
    showLabels: true,
    showAssignees: true,
    showAuthor: true,
    showReviewers: true,
    showMilestone: true,
    showPRChanges: true,
    showEngagement: true,
    showTimeline: true,
    showComments: true,
};

export const DEFAULT_SETTINGS: GitHubProjectsSettings = {
    ownerType: 'user',
    owner: '',
    projectNumber: 1,
    refreshInterval: 300, // 5 minutes
    cardDisplay: DEFAULT_CARD_DISPLAY,
    modalDisplay: DEFAULT_MODAL_DISPLAY,
};

export class GitHubProjectsSettingTab extends PluginSettingTab {
    plugin: GitHubProjectsPlugin;

    constructor(app: App, plugin: GitHubProjectsPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        ;

        // Security notice
        const securityNotice = containerEl.createDiv({ cls: 'setting-item-description' });
        securityNotice.innerHTML = `
            <strong>Security Note:</strong><br>
            Your GitHub token is stored in localStorage (not in vault files).<br>
            It will NOT be synced with your vault or backed up.<br>
            <br>
            <strong>Required Token Permissions:</strong><br>
            • Fine-grained token: "Projects: Read and Write"<br>
            • Classic token: "project" and "repo" scopes<br>
            • For organization projects: Also add "read:org" scope<br>
            <br>
            Create token at: <a href="https://github.com/settings/tokens" target="_blank">github.com/settings/tokens</a>
        `;

        new Setting(containerEl).setName("Authentication").setHeading();

        const token = this.plugin.tokenManager.getToken();

        if (token) {
            // Token is set - show connection status
            new Setting(containerEl)
                .setName('GitHub connection')
                .setDesc('Your GitHub account is connected')
                .addButton(btn => btn
                    .setButtonText('Test connection')
                    .onClick(async () => {
                        btn.setDisabled(true);
                        try {
                            const client = this.plugin.getGitHubClient();
                            if (client) {
                                const valid = await client.testConnection();
                                new Notice(valid ? 'Connection successful! ✓' : 'Connection failed ✗');
                            } else {
                                new Notice('No GitHub client available');
                            }
                        } catch (error) {
                            new Notice('Connection failed: ' + (error as Error).message);
                        } finally {
                            btn.setDisabled(false);
                        }
                    }))
                .addButton(btn => btn
                    .setButtonText('Disconnect')
                    .setWarning()
                    .onClick(() => {
                        this.plugin.tokenManager.clearToken();
                        new Notice('GitHub token removed');
                        this.display();
                    }));
        } else {
            // No token - show input
            new Setting(containerEl)
                .setName('GitHub personal access token')
                .setDesc('Enter your GitHub token to connect')
                .addText(text => {
                    text.setPlaceholder('Ghp_xxxxxxxxxxxxx or GitHub_pat_xxxxxxxxxxxxx')
                        .onChange(async (value) => {
                            if (value.length > 10) { // Basic validation
                                this.plugin.tokenManager.setToken(value);
                                const client = this.plugin.getGitHubClient();
                                if (client) {
                                    const valid = await client.testConnection();
                                    if (valid) {
                                        new Notice('Connected to GitHub! ✓');
                                        this.display();
                                    } else {
                                        new Notice('Invalid token - please check and try again');
                                        this.plugin.tokenManager.clearToken();
                                    }
                                }
                            }
                        });
                    text.inputEl.type = 'password';
                    text.inputEl.setCssProps({ width: '100%' });
                });
        }

        new Setting(containerEl).setName("Default project (optional)").setHeading();

        const defaultProjectInfo = containerEl.createDiv({ cls: 'setting-item-description' });
        defaultProjectInfo.setCssProps({ marginBottom: '12px' });
        defaultProjectInfo.innerHTML = `
            <strong>📌 Set a default project to load on startup</strong><br>
            Leave empty to choose a project each time you open the board.<br>
            You can always switch projects using the dropdown in the board view.
        `;

        new Setting(containerEl)
            .setName('Default project owner type')
            .setDesc('Is the default project a personal or organization project?')
            .addDropdown(dropdown => dropdown
                .addOption('user', 'Personal account')
                .addOption('organization', 'Organization')
                .setValue(this.plugin.settings.ownerType)
                .onChange(async (value: 'user' | 'organization') => {
                    this.plugin.settings.ownerType = value;
                    await this.plugin.saveSettings();
                    this.display(); // Refresh to update description
                }));

        // Only show owner field for organizations
        if (this.plugin.settings.ownerType === 'organization') {
            new Setting(containerEl)
                .setName('Default organization')
                .setDesc('GitHub organization name for the default project (e.g., "octo-org")')
                .addText(text => text
                    .setPlaceholder('Octo-org')
                    .setValue(this.plugin.settings.owner)
                    .onChange(async (value) => {
                        this.plugin.settings.owner = value;
                        await this.plugin.saveSettings();
                    }));
        } else {
            // For personal projects, show info message
            const infoEl = containerEl.createDiv({ cls: 'setting-item-description' });
            infoEl.setCssProps({ marginTop: '12px', marginBottom: '12px' });
            infoEl.innerHTML = `
                <strong>ℹ️ Personal Projects:</strong><br>
                Your personal projects will be loaded based on your token.<br>
                No username configuration needed.
            `;
        }

        const projectUrlExample = this.plugin.settings.ownerType === 'user'
            ? 'github.com/users/octocat/projects/5'
            : 'github.com/orgs/octo-org/projects/5';

        new Setting(containerEl)
            .setName('Default project number')
            .setDesc(`Project number from the URL (e.g., 5 from ${projectUrlExample}) - Leave empty for project selector`)
            .addText(text => text
                .setPlaceholder('5 (leave empty for selector)')
                .setValue(this.plugin.settings.projectNumber > 0 ? String(this.plugin.settings.projectNumber) : '')
                .onChange(async (value) => {
                    if (value === '' || value === '0') {
                        // Clear the default project
                        this.plugin.settings.projectNumber = 0;
                        await this.plugin.saveSettings();
                    } else {
                        const num = parseInt(value);
                        if (!isNaN(num) && num > 0) {
                            this.plugin.settings.projectNumber = num;
                            await this.plugin.saveSettings();
                        }
                    }
                }));

        new Setting(containerEl).setName("Sync").setHeading();

        new Setting(containerEl)
            .setName('Auto-refresh interval')
            .setDesc('How often to refresh project data from GitHub')
            .addDropdown(dropdown => dropdown
                .addOption('0', 'Manual only')
                .addOption('60', '1 minute')
                .addOption('300', '5 minutes')
                .addOption('600', '10 minutes')
                .addOption('1800', '30 minutes')
                .setValue(String(this.plugin.settings.refreshInterval))
                .onChange(async (value) => {
                    this.plugin.settings.refreshInterval = Number(value);
                    await this.plugin.saveSettings();
                    // Restart auto-sync with new interval
                    if (this.plugin.syncManager) {
                        this.plugin.syncManager.startAutoSync(this.plugin.settings.refreshInterval);
                    }
                }));

        // Card Display Settings
        new Setting(containerEl).setName("Card display").setHeading();
        containerEl.createEl('p', {
            text: 'Customize what information appears on cards in the kanban board',
            cls: 'setting-item-description'
        });

        new Setting(containerEl)
            .setName('Card title length')
            .setDesc('Maximum characters to show in card titles')
            .addText(text => text
                .setPlaceholder('80')
                .setValue(String(this.plugin.settings.cardDisplay.titleLength))
                .onChange(async (value) => {
                    const num = parseInt(value);
                    if (!isNaN(num) && num > 0 && num <= 500) {
                        this.plugin.settings.cardDisplay.titleLength = num;
                        await this.plugin.saveSettings();
                        this.plugin.refreshViews();
                    }
                }));

        new Setting(containerEl)
            .setName('Show repository')
            .setDesc('Display repository name on cards')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.cardDisplay.showRepository)
                .onChange(async (value) => {
                    this.plugin.settings.cardDisplay.showRepository = value;
                    await this.plugin.saveSettings();
                    this.plugin.refreshViews();
                }));

        new Setting(containerEl)
            .setName('Show labels')
            .setDesc('Display labels on cards')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.cardDisplay.showLabels)
                .onChange(async (value) => {
                    this.plugin.settings.cardDisplay.showLabels = value;
                    await this.plugin.saveSettings();
                    this.plugin.refreshViews();
                }));

        if (this.plugin.settings.cardDisplay.showLabels) {
            new Setting(containerEl)
                .setName('Maximum labels')
                .setDesc('Maximum number of labels to show on cards (rest will show as +n)')
                .addText(text => text
                    .setPlaceholder('3')
                    .setValue(String(this.plugin.settings.cardDisplay.maxLabels))
                    .onChange(async (value) => {
                        const num = parseInt(value);
                        if (!isNaN(num) && num > 0 && num <= 20) {
                            this.plugin.settings.cardDisplay.maxLabels = num;
                            await this.plugin.saveSettings();
                            this.plugin.refreshViews();
                        }
                    }));
        }

        new Setting(containerEl)
            .setName('Show description')
            .setDesc('Display issue/PR description on cards')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.cardDisplay.showDescription)
                .onChange(async (value) => {
                    this.plugin.settings.cardDisplay.showDescription = value;
                    await this.plugin.saveSettings();
                    this.plugin.refreshViews();
                }));

        if (this.plugin.settings.cardDisplay.showDescription) {
            new Setting(containerEl)
                .setName('Description length')
                .setDesc('Maximum characters to show in card descriptions')
                .addText(text => text
                    .setPlaceholder('100')
                    .setValue(String(this.plugin.settings.cardDisplay.descriptionLength))
                    .onChange(async (value) => {
                        const num = parseInt(value);
                        if (!isNaN(num) && num > 0 && num <= 500) {
                            this.plugin.settings.cardDisplay.descriptionLength = num;
                            await this.plugin.saveSettings();
                            this.plugin.refreshViews();
                        }
                    }));
        }

        new Setting(containerEl)
            .setName('Show milestone')
            .setDesc('Display milestone information on cards')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.cardDisplay.showMilestone)
                .onChange(async (value) => {
                    this.plugin.settings.cardDisplay.showMilestone = value;
                    await this.plugin.saveSettings();
                    this.plugin.refreshViews();
                }));

        new Setting(containerEl)
            .setName('Show PR changes')
            .setDesc('Display additions/deletions count on PR cards')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.cardDisplay.showPRChanges)
                .onChange(async (value) => {
                    this.plugin.settings.cardDisplay.showPRChanges = value;
                    await this.plugin.saveSettings();
                    this.plugin.refreshViews();
                }));

        new Setting(containerEl)
            .setName('Show author')
            .setDesc('Display author avatar on cards')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.cardDisplay.showAuthor)
                .onChange(async (value) => {
                    this.plugin.settings.cardDisplay.showAuthor = value;
                    await this.plugin.saveSettings();
                    this.plugin.refreshViews();
                }));

        new Setting(containerEl)
            .setName('Show assignees')
            .setDesc('Display assignee avatars on cards')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.cardDisplay.showAssignees)
                .onChange(async (value) => {
                    this.plugin.settings.cardDisplay.showAssignees = value;
                    await this.plugin.saveSettings();
                    this.plugin.refreshViews();
                }));

        if (this.plugin.settings.cardDisplay.showAssignees) {
            new Setting(containerEl)
                .setName('Maximum assignees')
                .setDesc('Maximum number of assignees to show on cards (rest will show as +n)')
                .addText(text => text
                    .setPlaceholder('2')
                    .setValue(String(this.plugin.settings.cardDisplay.maxAssignees))
                    .onChange(async (value) => {
                        const num = parseInt(value);
                        if (!isNaN(num) && num > 0 && num <= 20) {
                            this.plugin.settings.cardDisplay.maxAssignees = num;
                            await this.plugin.saveSettings();
                            this.plugin.refreshViews();
                        }
                    }));
        }

        new Setting(containerEl)
            .setName('Show comment count')
            .setDesc('Display number of comments on cards')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.cardDisplay.showCommentCount)
                .onChange(async (value) => {
                    this.plugin.settings.cardDisplay.showCommentCount = value;
                    await this.plugin.saveSettings();
                    this.plugin.refreshViews();
                }));

        new Setting(containerEl)
            .setName('Show reaction count')
            .setDesc('Display number of reactions on cards')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.cardDisplay.showReactionCount)
                .onChange(async (value) => {
                    this.plugin.settings.cardDisplay.showReactionCount = value;
                    await this.plugin.saveSettings();
                    this.plugin.refreshViews();
                }));

        new Setting(containerEl)
            .setName('Show updated time')
            .setDesc('Display last updated time on cards')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.cardDisplay.showUpdatedTime)
                .onChange(async (value) => {
                    this.plugin.settings.cardDisplay.showUpdatedTime = value;
                    await this.plugin.saveSettings();
                    this.plugin.refreshViews();
                }));

        new Setting(containerEl)
            .setName('Show state')
            .setDesc('Display state badge (open/closed) on cards')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.cardDisplay.showState)
                .onChange(async (value) => {
                    this.plugin.settings.cardDisplay.showState = value;
                    await this.plugin.saveSettings();
                    this.plugin.refreshViews();
                }));

        // Modal Display Settings
        new Setting(containerEl).setName("Detail modal").setHeading();
        containerEl.createEl('p', {
            text: 'Customize what sections appear in the card detail modal',
            cls: 'setting-item-description'
        });

        new Setting(containerEl)
            .setName('Show status badges')
            .setDesc('Display status, review decision, and ci badges')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.modalDisplay.showStatusBadges)
                .onChange(async (value) => {
                    this.plugin.settings.modalDisplay.showStatusBadges = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Show repository')
            .setDesc('Display repository section in modal')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.modalDisplay.showRepository)
                .onChange(async (value) => {
                    this.plugin.settings.modalDisplay.showRepository = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Show labels')
            .setDesc('Display labels section in modal (editable)')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.modalDisplay.showLabels)
                .onChange(async (value) => {
                    this.plugin.settings.modalDisplay.showLabels = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Show assignees')
            .setDesc('Display assignees section in modal (editable)')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.modalDisplay.showAssignees)
                .onChange(async (value) => {
                    this.plugin.settings.modalDisplay.showAssignees = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Show author')
            .setDesc('Display author section in modal')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.modalDisplay.showAuthor)
                .onChange(async (value) => {
                    this.plugin.settings.modalDisplay.showAuthor = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Show reviewers')
            .setDesc('Display reviewers section for PRs in modal')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.modalDisplay.showReviewers)
                .onChange(async (value) => {
                    this.plugin.settings.modalDisplay.showReviewers = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Show milestone')
            .setDesc('Display milestone section in modal')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.modalDisplay.showMilestone)
                .onChange(async (value) => {
                    this.plugin.settings.modalDisplay.showMilestone = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Show PR changes')
            .setDesc('Display PR additions/deletions section in modal')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.modalDisplay.showPRChanges)
                .onChange(async (value) => {
                    this.plugin.settings.modalDisplay.showPRChanges = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Show engagement')
            .setDesc('Display comment and reaction counts in modal')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.modalDisplay.showEngagement)
                .onChange(async (value) => {
                    this.plugin.settings.modalDisplay.showEngagement = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Show timeline')
            .setDesc('Display created/updated/closed/merged dates in modal')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.modalDisplay.showTimeline)
                .onChange(async (value) => {
                    this.plugin.settings.modalDisplay.showTimeline = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Show comments')
            .setDesc('Display comments section in modal')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.modalDisplay.showComments)
                .onChange(async (value) => {
                    this.plugin.settings.modalDisplay.showComments = value;
                    await this.plugin.saveSettings();
                }));

        // Manual actions
        new Setting(containerEl).setName("Actions").setHeading();

        new Setting(containerEl)
            .setName('Refresh now')
            .setDesc('Manually refresh project data from GitHub')
            .addButton(btn => btn
                .setButtonText('Refresh')
                .onClick(async () => {
                    btn.setDisabled(true);
                    try {
                        await this.plugin.syncManager?.forceRefresh();
                        // Refresh any open views
                        this.plugin.refreshViews();
                    } catch (error) {
                        new Notice('Refresh failed: ' + (error as Error).message);
                    } finally {
                        btn.setDisabled(false);
                    }
                }));
    }
}
