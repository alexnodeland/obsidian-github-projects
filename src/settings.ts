import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import GitHubProjectsPlugin from './main';

export interface GitHubProjectsSettings {
    ownerType: 'user' | 'organization';
    owner: string; // username or organization name
    projectNumber: number;
    refreshInterval: number; // seconds, 0 for manual only
}

export const DEFAULT_SETTINGS: GitHubProjectsSettings = {
    ownerType: 'user',
    owner: '',
    projectNumber: 1,
    refreshInterval: 300 // 5 minutes
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

        containerEl.createEl('h2', { text: 'GitHub Projects Settings' });

        // Security notice
        const securityNotice = containerEl.createDiv({ cls: 'setting-item-description' });
        securityNotice.innerHTML = `
            <strong>Security Note:</strong><br>
            Your GitHub token is stored in localStorage (not in vault files).<br>
            It will NOT be synced with your vault or backed up.<br>
            <br>
            <strong>Required Token Permissions:</strong><br>
            • Fine-grained token: "Projects: Read and Write"<br>
            • Classic token: "project" scope<br>
            <br>
            Create token at: <a href="https://github.com/settings/tokens" target="_blank">github.com/settings/tokens</a>
        `;

        containerEl.createEl('h3', { text: 'Authentication' });

        const token = this.plugin.tokenManager.getToken();

        if (token) {
            // Token is set - show connection status
            new Setting(containerEl)
                .setName('GitHub Connection')
                .setDesc('Your GitHub account is connected')
                .addButton(btn => btn
                    .setButtonText('Test Connection')
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
                .setName('GitHub Personal Access Token')
                .setDesc('Enter your GitHub token to connect')
                .addText(text => {
                    text.setPlaceholder('ghp_xxxxxxxxxxxxx or github_pat_xxxxxxxxxxxxx')
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
                    text.inputEl.style.width = '100%';
                });
        }

        containerEl.createEl('h3', { text: 'Project Configuration' });

        new Setting(containerEl)
            .setName('Project Owner Type')
            .setDesc('Is this a personal or organization project?')
            .addDropdown(dropdown => dropdown
                .addOption('user', 'Personal Account')
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
                .setName('Organization')
                .setDesc('GitHub organization name (e.g., "octo-org")')
                .addText(text => text
                    .setPlaceholder('octo-org')
                    .setValue(this.plugin.settings.owner)
                    .onChange(async (value) => {
                        this.plugin.settings.owner = value;
                        await this.plugin.saveSettings();
                    }));
        } else {
            // For personal projects, show info message
            const infoEl = containerEl.createDiv({ cls: 'setting-item-description' });
            infoEl.style.marginTop = '12px';
            infoEl.style.marginBottom = '12px';
            infoEl.innerHTML = `
                <strong>ℹ️ Personal Projects:</strong><br>
                Personal projects are accessed using your authenticated token.<br>
                No username configuration needed.
            `;
        }

        const projectUrlExample = this.plugin.settings.ownerType === 'user'
            ? 'github.com/users/octocat/projects/5'
            : 'github.com/orgs/octo-org/projects/5';

        new Setting(containerEl)
            .setName('Project Number')
            .setDesc(`Project number from the URL (e.g., 5 from ${projectUrlExample})`)
            .addText(text => text
                .setPlaceholder('5')
                .setValue(String(this.plugin.settings.projectNumber))
                .onChange(async (value) => {
                    const num = parseInt(value);
                    if (!isNaN(num) && num > 0) {
                        this.plugin.settings.projectNumber = num;
                        await this.plugin.saveSettings();
                    }
                }));

        containerEl.createEl('h3', { text: 'Sync Settings' });

        new Setting(containerEl)
            .setName('Auto-refresh Interval')
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

        // Manual actions
        containerEl.createEl('h3', { text: 'Actions' });

        new Setting(containerEl)
            .setName('Refresh Now')
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
