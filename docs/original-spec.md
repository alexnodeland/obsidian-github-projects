# Building a Full-Featured Obsidian Plugin for GitHub Projects

GitHub Projects V2 requires GraphQL API integration  and custom Kanban UI within Obsidian’s Electron-based architecture. The technical path forward combines **SortableJS for drag-and-drop**, **Personal Access Tokens stored in localStorage**, **Preact for reactive UI**, and **ItemView extension** for persistent panels. Nine battle-tested plugins provide production patterns: obsidian-kanban demonstrates board UI architecture, obsidian-git shows GitHub authentication flows, and the Projects plugin reveals multi-view state management.  This guide provides implementation-ready code, API specifications, and architectural decisions needed to build a production-quality integration.

## Obsidian plugin development fundamentals

The official Obsidian Plugin API provides the foundation through TypeScript interfaces and base classes.   Every plugin extends the `Plugin` class and implements lifecycle methods `onload()` and `onunload()`.  The build pipeline uses **esbuild** as the standard bundler, configured to externalize Obsidian’s API and Electron dependencies while targeting ES2018 and CommonJS output format. 

The essential plugin structure requires three files: **main.ts** (entry point), **manifest.json** (metadata), and **styles.css** (optional styling).  TypeScript configuration should enable strict null checks, set module resolution to node, and include DOM libraries.  The official sample plugin at github.com/obsidianmd/obsidian-sample-plugin demonstrates this structure with ribbon icons, commands, modals, and settings tabs. 

**Basic plugin skeleton:**

```typescript
import { Plugin, PluginSettingTab, Setting } from ‘obsidian’;

interface PluginSettings {
    githubToken: string;  // Don’t actually store here - see auth section
    projectNumber: number;
}

export default class GitHubProjectsPlugin extends Plugin {
    settings: PluginSettings;

    async onload() {
        await this.loadSettings();
        
        // Register custom view for project board
        this.registerView(
            VIEW_TYPE_PROJECT_BOARD,
            (leaf) => new ProjectBoardView(leaf, this)
        );

        // Add ribbon icon
        this.addRibbonIcon(‘layout-dashboard’, ‘Open GitHub Project’, () => {
            this.activateView();
        });

        // Register commands
        this.addCommand({
            id: ‘open-project-board’,
            name: ‘Open Project Board’,
            callback: () => this.activateView()
        });

        // Register events with automatic cleanup
        this.registerEvent(
            this.app.workspace.on(‘file-open’, (file) => {
                // Handle file events
            })
        );

        this.addSettingTab(new ProjectSettingTab(this.app, this));
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
```

**esbuild configuration (esbuild.config.mjs):**

```javascript
import esbuild from “esbuild”;
import process from “process”;

const prod = (process.argv[2] === “production”);

const context = await esbuild.context({
    entryPoints: [“main.ts”],
    bundle: true,
    external: [
        “obsidian”,
        “electron”,
        “@codemirror/*”,
        “@lezer/*”
    ],
    format: “cjs”,
    target: “es2018”,
    sourcemap: prod ? false : “inline”,
    treeShaking: true,
    outfile: “main.js”,
});

if (prod) {
    await context.rebuild();
    process.exit(0);
} else {
    await context.watch();
}
```

### Custom views and workspace integration

Custom views extend **ItemView** (for panels) or **TextFileView** (for file-backed views). Registration happens in `onload()` using `registerView()`, and cleanup requires detaching all leaves of that type in `onunload()`.  Views define their type, display text, icon, and implement `onOpen()` and `onClose()` for lifecycle management. 

**Complete custom view implementation:**

```typescript
import { ItemView, WorkspaceLeaf } from “obsidian”;

export const VIEW_TYPE_PROJECT_BOARD = “github-project-board”;

export class ProjectBoardView extends ItemView {
    plugin: GitHubProjectsPlugin;
    
    constructor(leaf: WorkspaceLeaf, plugin: GitHubProjectsPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType() {
        return VIEW_TYPE_PROJECT_BOARD;
    }

    getDisplayText() {
        return “GitHub Project Board”;
    }

    getIcon() {
        return “layout-dashboard”;
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass(‘github-project-container’);
        
        // Render your board UI here
        await this.renderProjectBoard(container);
    }

    async onClose() {
        // Cleanup resources
    }

    getState() {
        return {
            projectId: this.currentProjectId,
            // Store serializable state
        };
    }

    async setState(state: any, result: any) {
        this.currentProjectId = state.projectId;
        await super.setState(state, result);
    }
}
```

**View activation patterns:**

```typescript
async activateView() {
    // Detach existing instances
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_PROJECT_BOARD);

    // Create in right leaf
    const leaf = this.app.workspace.getRightLeaf(false);
    await leaf.setViewState({
        type: VIEW_TYPE_PROJECT_BOARD,
        active: true,
    });

    // Reveal the leaf
    this.app.workspace.revealLeaf(
        this.app.workspace.getLeavesOfType(VIEW_TYPE_PROJECT_BOARD)[0]
    );
}
```

### State management and data persistence

Obsidian provides two storage mechanisms: **data.json** (vault-specific, synced) accessed via `loadData()`/`saveData()`, and **localStorage** (shared across vaults, not synced).  For complex state, many plugins use EventEmitter3 for event-driven updates or integrate React Context/Redux for sophisticated state management.

The obsidian-kanban plugin demonstrates advanced state management with **immutability-helper** for state updates and EventEmitter3 for component communication.   For simpler needs, native JavaScript patterns with async/await suffice.

**Caching pattern for API data:**

```typescript
class APICache {
    private cache: Map<string, { data: any, timestamp: number }> = new Map();
    private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    async fetchWithCache(endpoint: string, fetcher: () => Promise<any>): Promise<any> {
        const cached = this.cache.get(endpoint);
        const now = Date.now();

        if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
            return cached.data;
        }

        const data = await fetcher();
        this.cache.set(endpoint, { data, timestamp: now });
        return data;
    }

    invalidate(endpoint?: string) {
        if (endpoint) {
            this.cache.delete(endpoint);
        } else {
            this.cache.clear();
        }
    }
}
```

### Plugin settings and configuration UI

Settings extend **PluginSettingTab** and use the **Setting** class to create form elements. Obsidian provides built-in components: text inputs, dropdowns, toggles, sliders, and buttons.  Settings automatically save when changed using the `onChange` callback pattern.

**Comprehensive settings implementation:**

```typescript
class ProjectSettingTab extends PluginSettingTab {
    plugin: GitHubProjectsPlugin;

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl(‘h2’, { text: ‘GitHub Projects Settings’ });

        // Security notice
        containerEl.createEl(‘p’, {
            text: ‘Your GitHub token is stored in localStorage and will not be synced with your vault.’,
            cls: ‘setting-item-description’
        });

        const token = this.plugin.getToken();

        if (token) {
            new Setting(containerEl)
                .setName(‘GitHub Connected’)
                .setDesc(‘Your GitHub account is connected’)
                .addButton(btn => btn
                    .setButtonText(‘Test Connection’)
                    .onClick(async () => {
                        const valid = await this.plugin.testConnection();
                        new Notice(valid ? ‘Connection successful!’ : ‘Connection failed’);
                    }))
                .addButton(btn => btn
                    .setButtonText(‘Disconnect’)
                    .setWarning()
                    .onClick(() => {
                        this.plugin.clearToken();
                        this.display();
                    }));
        } else {
            new Setting(containerEl)
                .setName(‘GitHub Personal Access Token’)
                .setDesc(‘Create a token at github.com/settings/tokens with “project” scope’)
                .addText(text => {
                    text.setPlaceholder(‘ghp_xxxxxxxxxxxxx’)
                        .onChange(async (value) => {
                            if (value.startsWith(‘ghp_’)) {
                                this.plugin.setToken(value);
                                const valid = await this.plugin.testConnection();
                                if (valid) {
                                    new Notice(‘Connected to GitHub!’);
                                    this.display();
                                }
                            }
                        });
                    text.inputEl.type = ‘password’;
                });
        }

        new Setting(containerEl)
            .setName(‘Organization’)
            .setDesc(‘GitHub organization name’)
            .addText(text => text
                .setPlaceholder(‘octo-org’)
                .setValue(this.plugin.settings.organization)
                .onChange(async (value) => {
                    this.plugin.settings.organization = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName(‘Project Number’)
            .setDesc(‘Project number from URL’)
            .addText(text => text
                .setPlaceholder(‘5’)
                .setValue(String(this.plugin.settings.projectNumber))
                .onChange(async (value) => {
                    this.plugin.settings.projectNumber = Number(value);
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName(‘Auto-refresh Interval’)
            .setDesc(‘How often to refresh project data (seconds)’)
            .addDropdown(dropdown => dropdown
                .addOption(‘0’, ‘Manual only’)
                .addOption(‘60’, ‘1 minute’)
                .addOption(‘300’, ‘5 minutes’)
                .addOption(‘600’, ‘10 minutes’)
                .setValue(String(this.plugin.settings.refreshInterval))
                .onChange(async (value) => {
                    this.plugin.settings.refreshInterval = Number(value);
                    await this.plugin.saveSettings();
                }));
    }
}
```

## GitHub Projects V2 GraphQL API integration

GitHub Projects V2 operates **exclusively through GraphQL** at `https://api.github.com/graphql`. The legacy Projects API used REST, but Projects V2 requires GraphQL knowledge.  The core objects are **ProjectV2** (the project), **ProjectV2Item** (issues/PRs/drafts), and **ProjectV2Field** (columns and custom fields with typed values). 

### GraphQL schema and query patterns

Projects V2 uses Node IDs (Base64-encoded strings like “PVT_kwDOBQfyVc0FoQ”) rather than numeric IDs.   Queries start from either `organization(login:)` or `user(login:)` and navigate to `projectV2(number:)`.   Fields include both built-in types (title, assignees, labels) and custom fields (single-select for status, text, number, date, iteration).

**Fetching project structure:**

```graphql
query($org: String!, $number: Int!) {
  organization(login: $org) {
    projectV2(number: $number) {
      id
      title
      url
      fields(first: 20) {
        nodes {
          ... on ProjectV2Field {
            id
            name
          }
          ... on ProjectV2SingleSelectField {
            id
            name
            options {
              id
              name
            }
          }
          ... on ProjectV2IterationField {
            id
            name
            configuration {
              iterations {
                id
                startDate
                title
              }
            }
          }
        }
      }
    }
  }
}
```

**Fetching project items with field values:**

```graphql
query($projectId: ID!, $cursor: String) {
  node(id: $projectId) {
    ... on ProjectV2 {
      items(first: 100, after: $cursor) {
        nodes {
          id
          fieldValues(first: 8) {
            nodes {
              ... on ProjectV2ItemFieldTextValue {
                text
                field {
                  ... on ProjectV2FieldCommon {
                    name
                  }
                }
              }
              ... on ProjectV2ItemFieldSingleSelectValue {
                name
                optionId
                field {
                  ... on ProjectV2FieldCommon {
                    name
                  }
                }
              }
              ... on ProjectV2ItemFieldDateValue {
                date
                field {
                  ... on ProjectV2FieldCommon {
                    name
                  }
                }
              }
            }
          }
          content {
            ... on Issue {
              title
              number
              url
              state
              assignees(first: 5) {
                nodes {
                  login
                  avatarUrl
                }
              }
            }
            ... on PullRequest {
              title
              number
              url
              state
            }
            ... on DraftIssue {
              title
              body
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
}
```

### Mutations for updating project state

All mutations require the **projectId** (not the number) and **itemId**. Status changes use `updateProjectV2ItemFieldValue` with the field ID and option ID from the single-select field.  Adding items requires the GitHub issue/PR Node ID obtained from separate queries.

**Update status (single-select field):**

```graphql
mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
  updateProjectV2ItemFieldValue(input: {
    projectId: $projectId
    itemId: $itemId
    fieldId: $fieldId
    value: {
      singleSelectOptionId: $optionId
    }
  }) {
    projectV2Item {
      id
    }
  }
}
```

**Add issue to project:**

```graphql
mutation($projectId: ID!, $contentId: ID!) {
  addProjectV2ItemById(input: {
    projectId: $projectId
    contentId: $contentId
  }) {
    item {
      id
    }
  }
}
```

**Create draft issue:**

```graphql
mutation($projectId: ID!, $title: String!, $body: String) {
  addProjectV2DraftIssue(input: {
    projectId: $projectId
    title: $title
    body: $body
  }) {
    projectItem {
      id
    }
  }
}
```

**Update text/number/date fields:**

```graphql
mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $text: String!) {
  updateProjectV2ItemFieldValue(input: {
    projectId: $projectId
    itemId: $itemId
    fieldId: $fieldId
    value: {
      text: $text
      # OR: number: 42
      # OR: date: “2024-12-31”
    }
  }) {
    projectV2Item {
      id
    }
  }
}
```

**Archive/unarchive items:**

```graphql
mutation($projectId: ID!, $itemId: ID!) {
  archiveProjectV2Item(input: {
    projectId: $projectId
    itemId: $itemId
  }) {
    item {
      id
    }
  }
}
```

### Authentication and token requirements

Personal Access Tokens require the **project** scope for read/write or **read:project** for read-only access.  Fine-grained tokens need “Projects: Read and Write” permissions.  OAuth apps use the same scopes.  GitHub Apps require “Organization permissions: Projects (Read & Write)”. 

**Making authenticated requests:**

```typescript
import { requestUrl } from ‘obsidian’;

async function queryGitHub(query: string, variables: any, token: string) {
    const response = await requestUrl({
        url: ‘https://api.github.com/graphql’,
        method: ‘POST’,
        headers: {
            ‘Authorization’: `Bearer ${token}`,
            ‘Content-Type’: ‘application/json’,
            ‘Accept’: ‘application/vnd.github+json’
        },
        body: JSON.stringify({ query, variables }),
        throw: false
    });

    if (response.status !== 200) {
        throw new Error(`GitHub API error: ${response.status} - ${response.text}`);
    }

    const data = response.json;
    if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    return data.data;
}
```

### Rate limits and pagination handling

GitHub GraphQL uses a **points-based system** with 5,000 points/hour for standard users.  Points calculate as total requested items divided by 100, rounded up.   Pagination requires `first`/`last` arguments (1-100) and cursor-based navigation using `pageInfo.endCursor`.  

**Pagination implementation:**

```typescript
async function fetchAllProjectItems(projectId: string, token: string) {
    let hasNextPage = true;
    let cursor: string | null = null;
    const items: any[] = [];

    while (hasNextPage) {
        const query = `
            query($projectId: ID!, $cursor: String) {
                node(id: $projectId) {
                    ... on ProjectV2 {
                        items(first: 100, after: $cursor) {
                            nodes { id }
                            pageInfo {
                                hasNextPage
                                endCursor
                            }
                        }
                    }
                }
            }
        `;

        const data = await queryGitHub(query, { projectId, cursor }, token);
        items.push(...data.node.items.nodes);
        
        hasNextPage = data.node.items.pageInfo.hasNextPage;
        cursor = data.node.items.pageInfo.endCursor;
    }

    return items;
}
```

**Check rate limit status:**

```graphql
query {
  rateLimit {
    limit
    remaining
    used
    resetAt
    cost  # Cost of this specific query
  }
}
```

## Authentication and secure credential storage

Obsidian plugins face security constraints: no built-in secure storage API, shared localStorage between all plugins, and mobile limitations.  The recommended approach uses **localStorage for tokens** (not data.json which syncs with vault and exposes credentials).  Desktop-only plugins can use Electron’s `safeStorage` for OS-level encryption.  

### Personal Access Token storage pattern

Store tokens in localStorage with plugin-specific keys. Never commit tokens to data.json which appears in `.obsidian/plugins/<name>/data.json` and syncs across devices.   Implement clear user warnings about storage location and token scope requirements.

**Token management implementation:**

```typescript
export default class GitHubProjectsPlugin extends Plugin {
    private readonly TOKEN_KEY = ‘github-projects-token’;

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    setToken(token: string): void {
        localStorage.setItem(this.TOKEN_KEY, token);
        this.initializeAPI(token);
        new Notice(‘GitHub token saved’);
    }

    clearToken(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        this.api = null;
        new Notice(‘GitHub token removed’);
    }

    async testConnection(): Promise<boolean> {
        const token = this.getToken();
        if (!token) return false;

        try {
            const query = ‘query { viewer { login } }’;
            await queryGitHub(query, {}, token);
            return true;
        } catch (error) {
            console.error(‘GitHub connection test failed:’, error);
            return false;
        }
    }

    initializeAPI(token: string): void {
        // Initialize GitHub client with token
    }
}
```

### OAuth flow implementation for Obsidian

OAuth works through Obsidian’s **protocol handler** `obsidian://`. Register handlers in `onload()` using `registerObsidianProtocolHandler()`. The callback URL becomes `obsidian://your-plugin-name?code=AUTH_CODE&state=STATE`.   Store the refresh token (not just access token) for long-term access.

**OAuth implementation pattern:**

```typescript
export default class GitHubProjectsPlugin extends Plugin {
    async onload() {
        // Register OAuth callback handler
        this.registerObsidianProtocolHandler(‘github-projects’, async (params) => {
            const { code, state } = params;
            
            // Verify state to prevent CSRF
            if (state !== this.oauthState) {
                new Notice(‘OAuth state mismatch - please try again’);
                return;
            }

            try {
                // Exchange code for token
                const tokens = await this.exchangeCodeForToken(code);
                
                // Store refresh token
                localStorage.setItem(‘github-oauth-refresh’, JSON.stringify(tokens));
                
                new Notice(‘Connected to GitHub!’);
                
                // Refresh settings UI
                this.settingsTab?.display();
            } catch (error) {
                new Notice(‘OAuth failed: ‘ + error.message);
            }
        });
    }

    async initiateOAuthFlow(): void {
        // Generate random state for CSRF protection
        this.oauthState = crypto.randomBytes(16).toString(‘hex’);
        
        const clientId = ‘YOUR_GITHUB_APP_CLIENT_ID’;
        const redirectUri = ‘obsidian://github-projects’;
        const scope = ‘project’;
        
        const authUrl = `https://github.com/login/oauth/authorize?` +
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `scope=${scope}&` +
            `state=${this.oauthState}`;
        
        // Open browser for OAuth
        window.open(authUrl);
    }

    async exchangeCodeForToken(code: string): Promise<any> {
        // Exchange code for token via your backend proxy
        // (Cannot do client-side due to client_secret requirement)
        const response = await requestUrl({
            url: ‘YOUR_BACKEND_PROXY/github-oauth’,
            method: ‘POST’,
            body: JSON.stringify({ code }),
            headers: { ‘Content-Type’: ‘application/json’ }
        });
        
        return response.json;
    }
}
```

### Security best practices for tokens

Never store tokens in data.json or plugin code. Use minimal token scopes (fine-grained tokens with only “Projects: Read and Write”).  Set expiration dates on tokens. Inform users explicitly where credentials are stored and warn about shared localStorage access across plugins.  

**Security checklist:**

- ✅ Store in localStorage with clear plugin-specific key
- ✅ Use fine-grained PATs with minimal scopes
- ✅ Document token storage location in settings UI
- ✅ Provide easy token revocation button
- ✅ Validate token on plugin load
- ✅ Handle 401/403 responses gracefully
- ❌ Never store in data.json
- ❌ Never hardcode tokens in plugin code
- ❌ Don’t request excessive scopes

**User education in settings:**

```typescript
containerEl.createEl(‘div’, { cls: ‘setting-item-description’ }, (el) => {
    el.innerHTML = `
        <strong>Security Note:</strong><br>
        Your GitHub token is stored in localStorage (not in vault files).<br>
        It will NOT be synced with your vault or backed up.<br>
        Other Obsidian plugins technically have access to localStorage.<br>
        <br>
        <strong>Required Token Permissions:</strong><br>
        • Fine-grained token: “Projects: Read and Write”<br>
        • Classic token: “project” scope<br>
        <br>
        Create token at: <a href=“https://github.com/settings/tokens”>github.com/settings/tokens</a>
    `;
});
```

## Kanban UI implementation with drag-and-drop

SortableJS emerges as the **recommended drag-and-drop library** for Obsidian plugins, used successfully by the manual-sorting plugin.  The obsidian-kanban plugin demonstrates a custom HTML5 drag-and-drop implementation, but SortableJS provides battle-tested functionality with simpler integration and excellent touch device support for mobile.

### SortableJS integration for board columns

Install SortableJS with `npm install sortablejs @types/sortablejs`. Each column receives its own Sortable instance with shared group names for cross-column dragging. The `onEnd` event provides old/new indices and source/target containers for state updates.

**Implementing draggable columns:**

```typescript
import Sortable from ‘sortablejs’;

class KanbanBoard {
    private sortables: Map<string, Sortable> = new Map();

    initializeDragAndDrop(columns: Column[]): void {
        columns.forEach(column => {
            const columnEl = document.getElementById(`column-${column.id}`);
            if (!columnEl) return;

            const sortable = new Sortable(columnEl, {
                group: ‘kanban-cards’,
                animation: 150,
                ghostClass: ‘card-ghost’,
                dragClass: ‘card-dragging’,
                handle: ‘.card-drag-handle’,
                onEnd: (evt) => this.handleCardMove(evt),
                onStart: (evt) => this.handleDragStart(evt),
            });

            this.sortables.set(column.id, sortable);
        });
    }

    handleCardMove(evt: Sortable.SortableEvent): void {
        const cardId = evt.item.dataset.cardId;
        const fromColumnId = evt.from.dataset.columnId;
        const toColumnId = evt.to.dataset.columnId;
        const newIndex = evt.newIndex;

        // Update local state
        this.moveCard(cardId, fromColumnId, toColumnId, newIndex);

        // Sync to GitHub
        this.syncCardPosition(cardId, toColumnId);
    }

    cleanup(): void {
        this.sortables.forEach(sortable => sortable.destroy());
        this.sortables.clear();
    }
}
```

### React/Preact for reactive UI components

**Preact is preferred over React** for smaller bundle size while maintaining React-compatible API.  The obsidian-kanban plugin uses Preact successfully.  Install with `npm install preact` and `npm install —save-dev @types/react @types/react-dom`. Configure TypeScript with `”jsx”: “react”` and use Preact’s compatibility layer.

**Preact component structure:**

```typescript
import { render } from ‘preact’;
import { useState, useEffect } from ‘preact/hooks’;
import { ItemView, WorkspaceLeaf } from ‘obsidian’;

interface ProjectData {
    columns: Column[];
    cards: Card[];
}

const ProjectBoard = ({ plugin }: { plugin: GitHubProjectsPlugin }) => {
    const [data, setData] = useState<ProjectData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProjectData();
    }, []);

    async function loadProjectData() {
        try {
            const project = await plugin.fetchProject();
            setData(project);
        } catch (error) {
            console.error(‘Failed to load project:’, error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className=“loading-spinner”>Loading project...</div>;
    }

    if (!data) {
        return <div className=“error-message”>Failed to load project</div>;
    }

    return (
        <div className=“project-board”>
            {data.columns.map(column => (
                <Column
                    key={column.id}
                    column={column}
                    cards={data.cards.filter(c => c.columnId === column.id)}
                    onCardMove={(cardId, newColumnId) => {
                        // Handle card movement
                    }}
                />
            ))}
        </div>
    );
};

export class ProjectBoardView extends ItemView {
    plugin: GitHubProjectsPlugin;
    root: Element;

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        
        render(<ProjectBoard plugin={this.plugin} />, container);
    }

    async onClose() {
        // Preact cleanup happens automatically
    }
}
```

### Modal components for card editing

Obsidian’s **Modal class** provides the foundation for dialogs.  Override `onOpen()` to build UI and `onClose()` for cleanup.   Integrate React/Preact components within modals for complex forms.

**Card editing modal:**

```typescript
import { Modal, App, Notice } from ‘obsidian’;

class CardEditModal extends Modal {
    plugin: GitHubProjectsPlugin;
    card: Card;
    onSave: (card: Card) => void;

    constructor(app: App, plugin: GitHubProjectsPlugin, card: Card, onSave: (card: Card) => void) {
        super(app);
        this.plugin = plugin;
        this.card = card;
        this.onSave = onSave;
    }

    onOpen() {
        const { contentEl, titleEl } = this;
        
        titleEl.setText(‘Edit Card’);

        // Title input
        const titleDiv = contentEl.createDiv({ cls: ‘modal-input-group’ });
        titleDiv.createEl(‘label’, { text: ‘Title’ });
        const titleInput = titleDiv.createEl(‘input’, {
            type: ‘text’,
            value: this.card.title,
            cls: ‘modal-input’
        });

        // Description textarea
        const descDiv = contentEl.createDiv({ cls: ‘modal-input-group’ });
        descDiv.createEl(‘label’, { text: ‘Description’ });
        const descInput = descDiv.createEl(‘textarea’, {
            value: this.card.description,
            cls: ‘modal-textarea’
        });

        // Assignee dropdown
        const assigneeDiv = contentEl.createDiv({ cls: ‘modal-input-group’ });
        assigneeDiv.createEl(‘label’, { text: ‘Assignee’ });
        const assigneeSelect = assigneeDiv.createEl(‘select’, { cls: ‘modal-select’ });
        // Populate with team members

        // Button group
        const buttonGroup = contentEl.createDiv({ cls: ‘modal-button-group’ });
        
        const saveBtn = buttonGroup.createEl(‘button’, {
            text: ‘Save’,
            cls: ‘mod-cta’
        });
        saveBtn.addEventListener(‘click’, () => {
            this.card.title = titleInput.value;
            this.card.description = descInput.value;
            this.onSave(this.card);
            this.close();
        });

        const cancelBtn = buttonGroup.createEl(‘button’, { text: ‘Cancel’ });
        cancelBtn.addEventListener(‘click’, () => this.close());
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
```

### Styling with Obsidian CSS variables

All styles go in **styles.css** (automatically loaded) or injected dynamically. Use Obsidian’s CSS variables for theme compatibility: `—background-primary`, `—background-secondary`, `—text-normal`, `—text-muted`, `—interactive-accent`, `—background-modifier-border`.

**Complete board styling:**

```css
/* Board container */
.project-board {
  display: flex;
  gap: 16px;
  padding: 16px;
  height: 100%;
  overflow-x: auto;
  background-color: var(—background-secondary);
}

/* Column styling */
.kanban-column {
  flex: 0 0 300px;
  display: flex;
  flex-direction: column;
  background-color: var(—background-primary);
  border: 1px solid var(—background-modifier-border);
  border-radius: 8px;
  padding: 12px;
  max-height: 100%;
}

.column-header {
  font-weight: 600;
  font-size: 14px;
  color: var(—text-normal);
  padding: 8px;
  margin-bottom: 12px;
  border-bottom: 2px solid var(—interactive-accent);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.column-count {
  font-size: 12px;
  color: var(—text-muted);
  background-color: var(—background-modifier-border);
  padding: 2px 8px;
  border-radius: 12px;
}

/* Card list */
.column-cards {
  flex: 1;
  overflow-y: auto;
  min-height: 50px;
}

/* Card styling */
.kanban-card {
  background-color: var(—background-primary);
  border: 1px solid var(—background-modifier-border);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.kanban-card:hover {
  border-color: var(—interactive-accent);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.card-title {
  font-weight: 500;
  color: var(—text-normal);
  margin-bottom: 4px;
  font-size: 14px;
}

.card-description {
  font-size: 12px;
  color: var(—text-muted);
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-metadata {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 11px;
  color: var(—text-faint);
}

.card-assignee {
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-assignee img {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}

/* Drag states */
.card-ghost {
  opacity: 0.4;
  background-color: var(—background-secondary);
}

.card-dragging {
  opacity: 0.8;
  transform: rotate(2deg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.card-drag-handle {
  cursor: grab;
  padding: 4px;
  margin: -4px -4px -4px 0;
}

.card-drag-handle:active {
  cursor: grabbing;
}

/* Loading states */
.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(—text-muted);
  font-size: 14px;
}

/* Dark theme adjustments */
.theme-dark .kanban-card:hover {
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.1);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .project-board {
    flex-direction: column;
  }
  
  .kanban-column {
    flex: 1 1 auto;
    max-height: none;
  }
}
```

## Real-world plugin examples and architectural patterns

Nine production plugins provide implementation patterns: **obsidian-kanban** (3.7k stars) for drag-and-drop boards, **obsidian-git** for GitHub API integration and authentication, **obsidian-dataview** (8.1k stars) for data indexing and state management, **Projects plugin** for multi-view architecture, and **Todoist/Jira plugins** for external API patterns.

### Obsidian Git: GitHub authentication and API patterns

The obsidian-git plugin (github.com/Vinzent03/obsidian-git) demonstrates production GitHub integration with custom views for source control, history browsing, and diff viewing. Authentication supports HTTPS with Personal Access Tokens, SSH keys, and Git credential managers. Mobile implementation uses isomorphic-git JavaScript library.

**Key architectural lessons:**

- **Custom view hierarchy:** Source Control View, History View, and Diff View as separate ItemView implementations
- **State synchronization:** Polling Git status and reflecting in UI
- **Background operations:** Automatic commit-and-sync scheduling with configurable intervals
- **Error handling:** Graceful merge conflict resolution and authentication failure recovery
- **Command palette integration:** 20+ commands for all Git operations
- **Mobile adaptation:** Separate code paths for desktop Git vs mobile JavaScript Git

### Obsidian Kanban: Board UI and markdown backing

The obsidian-kanban plugin (github.com/mgmeyers/obsidian-kanban) uses **Preact for UI** and stores all data in markdown files for portability. Custom drag-and-drop implementation without external libraries provides full control. State management uses EventEmitter3 for component communication and immutability-helper for updates.

**Architecture highlights:**

- **File structure:** `src/KanbanView.tsx` extends TextFileView for markdown backing
- **Component hierarchy:** Kanban → Lane → Card components with clear separation
- **Drag system:** `src/dnd/managers/DragManager` with custom HTML5 implementation
- **State flow:** Markdown parsing → Internal state → Preact rendering → User actions → Markdown generation
- **Settings per board:** Embedded metadata in markdown frontmatter

**Markdown format pattern:**

```markdown
—
kanban-plugin: basic
—

## To Do

- [ ] Task 1
- [ ] Task 2

## In Progress

- [ ] Task 3

## Done

- [x] Task 4
```

### Dataview: Indexing and query execution

The dataview plugin (github.com/blacksmithgu/obsidian-dataview) indexes all vault metadata and provides a SQL-like query language. The architecture separates indexing (background), query parsing (synchronous), and rendering (reactive).

**Performance patterns:**

- **Incremental indexing:** Only re-index changed files
- **Query caching:** Cache parsed queries and execution plans
- **Live updates:** React to file changes and re-render affected views
- **Worker threads:** Offload expensive operations on desktop
- **Pagination:** Virtual scrolling for large result sets

### Projects Plugin: Multi-view state management

The now-archived Projects plugin (github.com/obsmd-projects/obsidian-projects) implemented four view types: Table, Board, Calendar, and Gallery. Svelte provides reactive UI with centralized state stores. Dataview integration enables project definitions via queries.

**View switching architecture:**

```typescript
enum ViewType {
    TABLE = ‘table’,
    BOARD = ‘board’,
    CALENDAR = ‘calendar’,
    GALLERY = ‘gallery’
}

class ProjectView extends ItemView {
    currentViewType: ViewType;
    viewInstances: Map<ViewType, BaseView>;

    async switchView(type: ViewType) {
        // Serialize current view state
        const state = this.viewInstances.get(this.currentViewType)?.getState();
        
        // Cleanup current view
        await this.viewInstances.get(this.currentViewType)?.cleanup();
        
        // Initialize new view
        this.currentViewType = type;
        if (!this.viewInstances.has(type)) {
            this.viewInstances.set(type, this.createView(type));
        }
        
        // Render with preserved state
        await this.viewInstances.get(type)?.render(state);
    }
}
```

## Recommended architecture for GitHub Projects plugin

Combine proven patterns: **SortableJS for drag-and-drop**, **Preact for reactive UI**, **localStorage for token storage**, **GraphQL client with pagination**, and **ItemView for persistent panel**. Structure code into layers: API client, state manager, view components, and UI primitives.

### Project structure and file organization

```
src/
├── main.ts                          # Plugin entry point
├── settings.ts                      # Settings tab implementation
├── api/
│   ├── github-client.ts            # GraphQL client wrapper
│   ├── queries.ts                  # GraphQL query definitions
│   ├── mutations.ts                # GraphQL mutation definitions
│   └── types.ts                    # TypeScript types from schema
├── state/
│   ├── project-state.ts            # Project data state management
│   ├── cache.ts                    # API response caching
│   └── sync.ts                     # Bidirectional sync logic
├── views/
│   ├── ProjectBoardView.tsx        # Main view class
│   ├── components/
│   │   ├── Board.tsx               # Board container
│   │   ├── Column.tsx              # Column component
│   │   ├── Card.tsx                # Card component
│   │   ├── CardEditor.tsx          # Card editing modal
│   │   └── EmptyState.tsx          # Empty/loading states
│   └── modals/
│       ├── SettingsModal.tsx       # Project settings
│       └── NewCardModal.tsx        # Create card modal
├── utils/
│   ├── auth.ts                     # Token management utilities
│   ├── formatting.ts               # Date/text formatting
│   └── error-handling.ts           # Error display utilities
└── styles.css                       # Plugin styles
```

### Complete implementation example

**api/github-client.ts:**

```typescript
import { requestUrl } from ‘obsidian’;
import { QUERIES } from ‘./queries’;
import { MUTATIONS } from ‘./mutations’;

export class GitHubClient {
    constructor(private token: string) {}

    private async query(query: string, variables: any = {}): Promise<any> {
        const response = await requestUrl({
            url: ‘https://api.github.com/graphql’,
            method: ‘POST’,
            headers: {
                ‘Authorization’: `Bearer ${this.token}`,
                ‘Content-Type’: ‘application/json’,
            },
            body: JSON.stringify({ query, variables }),
            throw: false
        });

        if (response.status !== 200) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        if (response.json.errors) {
            throw new Error(`GraphQL error: ${JSON.stringify(response.json.errors)}`);
        }

        return response.json.data;
    }

    async fetchProject(org: string, number: number): Promise<Project> {
        const data = await this.query(QUERIES.GET_PROJECT, { org, number });
        return this.transformProject(data.organization.projectV2);
    }

    async fetchProjectItems(projectId: string): Promise<ProjectItem[]> {
        const items: ProjectItem[] = [];
        let cursor: string | null = null;
        let hasNextPage = true;

        while (hasNextPage) {
            const data = await this.query(QUERIES.GET_PROJECT_ITEMS, {
                projectId,
                cursor
            });

            const result = data.node.items;
            items.push(...result.nodes.map(this.transformItem));
            
            hasNextPage = result.pageInfo.hasNextPage;
            cursor = result.pageInfo.endCursor;
        }

        return items;
    }

    async updateCardStatus(
        projectId: string,
        itemId: string,
        fieldId: string,
        optionId: string
    ): Promise<void> {
        await this.query(MUTATIONS.UPDATE_FIELD_VALUE, {
            projectId,
            itemId,
            fieldId,
            optionId
        });
    }

    async addIssueToProject(projectId: string, issueId: string): Promise<string> {
        const data = await this.query(MUTATIONS.ADD_ITEM, {
            projectId,
            contentId: issueId
        });
        return data.addProjectV2ItemById.item.id;
    }

    private transformProject(raw: any): Project {
        return {
            id: raw.id,
            title: raw.title,
            url: raw.url,
            fields: raw.fields.nodes.map(this.transformField),
        };
    }

    private transformField(raw: any): Field {
        if (raw.__typename === ‘ProjectV2SingleSelectField’) {
            return {
                id: raw.id,
                name: raw.name,
                type: ‘single-select’,
                options: raw.options.map((o: any) => ({
                    id: o.id,
                    name: o.name
                }))
            };
        }
        // Handle other field types...
    }

    private transformItem(raw: any): ProjectItem {
        // Transform raw GraphQL response to app model
    }
}
```

**state/project-state.ts:**

```typescript
import { EventEmitter } from ‘events’;

export class ProjectState extends EventEmitter {
    private project: Project | null = null;
    private items: Map<string, ProjectItem> = new Map();
    private columns: Column[] = [];

    setProject(project: Project): void {
        this.project = project;
        this.processFields(project.fields);
        this.emit(‘project-updated’, project);
    }

    setItems(items: ProjectItem[]): void {
        this.items.clear();
        items.forEach(item => this.items.set(item.id, item));
        this.emit(‘items-updated’, items);
    }

    moveCard(cardId: string, fromColumnId: string, toColumnId: string, index: number): void {
        const card = this.items.get(cardId);
        if (!card) return;

        card.columnId = toColumnId;
        card.position = index;

        this.emit(‘card-moved’, { cardId, fromColumnId, toColumnId, index });
    }

    getColumnCards(columnId: string): ProjectItem[] {
        return Array.from(this.items.values())
            .filter(item => item.columnId === columnId)
            .sort((a, b) => a.position - b.position);
    }

    private processFields(fields: Field[]): void {
        const statusField = fields.find(f => f.name === ‘Status’ && f.type === ‘single-select’);
        if (statusField && statusField.options) {
            this.columns = statusField.options.map(opt => ({
                id: opt.id,
                name: opt.name,
                fieldId: statusField.id
            }));
        }
    }
}
```

**views/components/Board.tsx:**

```typescript
import { h } from ‘preact’;
import { useEffect, useState } from ‘preact/hooks’;
import { Column } from ‘./Column’;
import { ProjectState } from ‘../../state/project-state’;

export const Board = ({ state, onCardMove }: {
    state: ProjectState;
    onCardMove: (cardId: string, toColumnId: string) => void;
}) => {
    const [columns, setColumns] = useState([]);
    const [cardsByColumn, setCardsByColumn] = useState(new Map());

    useEffect(() => {
        const updateData = () => {
            const cols = state.getColumns();
            setColumns(cols);
            
            const cardsMap = new Map();
            cols.forEach(col => {
                cardsMap.set(col.id, state.getColumnCards(col.id));
            });
            setCardsByColumn(cardsMap);
        };

        updateData();
        
        state.on(‘items-updated’, updateData);
        state.on(‘card-moved’, updateData);
        
        return () => {
            state.off(‘items-updated’, updateData);
            state.off(‘card-moved’, updateData);
        };
    }, [state]);

    return (
        <div className=“project-board”>
            {columns.map(column => (
                <Column
                    key={column.id}
                    column={column}
                    cards={cardsByColumn.get(column.id) || []}
                    onCardMove={onCardMove}
                />
            ))}
        </div>
    );
};
```

### Sync strategy and conflict resolution

Implement optimistic updates for immediate UI feedback, then sync to GitHub in background. Handle conflicts by prioritizing GitHub state on refresh while queueing user changes for retry.

**Sync manager pattern:**

```typescript
export class SyncManager {
    private pendingUpdates: Map<string, Update> = new Map();
    private syncInterval: number;

    constructor(
        private client: GitHubClient,
        private state: ProjectState
    ) {}

    startAutoSync(intervalSeconds: number): void {
        this.syncInterval = window.setInterval(() => {
            this.sync();
        }, intervalSeconds * 1000);
    }

    async sync(): Promise<void> {
        try {
            // Fetch latest from GitHub
            const items = await this.client.fetchProjectItems(this.projectId);
            
            // Apply pending updates
            for (const [itemId, update] of this.pendingUpdates) {
                try {
                    await this.client.updateCardStatus(
                        update.projectId,
                        itemId,
                        update.fieldId,
                        update.optionId
                    );
                    this.pendingUpdates.delete(itemId);
                } catch (error) {
                    console.error(‘Failed to sync update:’, error);
                }
            }
            
            // Update local state
            this.state.setItems(items);
        } catch (error) {
            new Notice(‘Sync failed: ‘ + error.message);
        }
    }

    queueUpdate(itemId: string, update: Update): void {
        this.pendingUpdates.set(itemId, update);
        
        // Try immediate sync
        this.sync().catch(console.error);
    }

    stop(): void {
        if (this.syncInterval) {
            window.clearInterval(this.syncInterval);
        }
    }
}
```

## Integration checklist and next steps

Build incrementally: start with authentication and basic GraphQL queries, add custom view with static data, implement SortableJS drag-and-drop, integrate Preact components, add GitHub mutations for updates, implement sync manager, polish with error handling and loading states.

### Development workflow

1. **Setup phase:**
- Clone obsidian-sample-plugin as starting point
- Install dependencies: `npm install sortablejs preact @types/sortablejs`
- Configure esbuild for Preact/React JSX
- Create test vault with `.obsidian/plugins/github-projects` symlink
1. **Authentication phase:**
- Implement token storage in localStorage
- Build settings tab with token input and test button
- Create GitHubClient with basic query method
- Test connection with `viewer { login }` query
1. **API integration phase:**
- Define TypeScript types from GraphQL schema
- Implement project fetching query
- Implement items fetching with pagination
- Add mutations for status updates
1. **UI foundation phase:**
- Create ProjectBoardView extending ItemView
- Register view and add activation command
- Build basic board layout with CSS
- Render static columns and cards
1. **Drag-and-drop phase:**
- Integrate SortableJS on column containers
- Handle `onEnd` events for card moves
- Update local state optimistically
- Trigger GitHub mutations in background
1. **State management phase:**
- Implement ProjectState with EventEmitter
- Add caching layer with timestamp expiry
- Build SyncManager for background sync
- Handle conflict resolution
1. **Polish phase:**
- Add loading spinners and empty states
- Implement error boundaries and retry logic
- Add keyboard shortcuts with Scope
- Create card editing modal
- Test on mobile (drag-and-drop touch events)
1. **Documentation and release:**
- Write comprehensive README with screenshots
- Document token creation steps
- Create demo video
- Submit to Obsidian community plugins

### Testing strategies

Test authentication flows with both valid and invalid tokens. Verify pagination with projects containing 100+ items. Test drag-and-drop on desktop and mobile. Simulate network failures and verify retry logic. Test with popular themes (Minimal, Things, ITS Theme) for CSS compatibility.

**Manual testing checklist:**

- ✅ Token validation on plugin load
- ✅ Project fetching with various org/project combinations
- ✅ Pagination through 200+ items
- ✅ Drag card within column
- ✅ Drag card between columns
- ✅ Status update reflects in GitHub
- ✅ Background sync every N minutes
- ✅ Network failure handling with retry
- ✅ Concurrent edits from GitHub web UI
- ✅ Mobile drag-and-drop (iOS/Android)
- ✅ Theme compatibility (light/dark)
- ✅ Keyboard shortcuts work correctly

### Performance optimization considerations

Cache GraphQL responses with 5-minute TTL. Implement virtual scrolling for projects with 500+ cards. Debounce status updates to batch rapid column changes. Use incremental rendering for large boards. Profile with Chrome DevTools to identify bottlenecks.

### Community plugin submission requirements

Prepare `manifest.json` with required fields (id, name, version, minAppVersion, author). Create `versions.json` mapping plugin versions to minimum Obsidian versions. Tag GitHub release with version number. Include main.js, manifest.json, and styles.css in release assets. Submit pull request to obsidianmd/obsidian-releases repository.

**manifest.json example:**

```json
{
    "id": "github-projects",
    "name": "GitHub Projects",
    "version": "0.1.0",
    "minAppVersion": "0.15.0",
    "description": "Manage GitHub Projects with Kanban boards in Obsidian",
    "author": "Alex Nodeland",
    "authorUrl": "https://github.com/alexnodeland/obsidian-github-projects",
    "isDesktopOnly": false
}
```

The foundation combines battle-tested patterns from production plugins: obsidian-git’s authentication flows, obsidian-kanban’s board architecture, dataview’s state management, and Projects plugin’s multi-view design. GitHub Projects V2’s GraphQL API provides rich metadata and typed fields for sophisticated project management. SortableJS delivers production-ready drag-and-drop with mobile support. Preact enables reactive UI with minimal bundle size. The result: a full-featured GitHub Projects integration bringing project management directly into Obsidian’s knowledge workspace.