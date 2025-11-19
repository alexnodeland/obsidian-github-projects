# API Reference

## Table of Contents

- [Plugin API](#plugin-api)
- [State Management](#state-management)
- [GitHub API Client](#github-api-client)
- [Type Definitions](#type-definitions)
- [Events](#events)
- [Utility Functions](#utility-functions)

## Plugin API

### GitHubProjectsPlugin

Main plugin class extending Obsidian's `Plugin`.

#### Properties

```typescript
class GitHubProjectsPlugin extends Plugin {
  settings: PluginSettings;
  projectState: ProjectState;
}
```

#### Methods

##### `onload(): Promise<void>`

Called when the plugin is loaded.

**Returns**: `Promise<void>`

**Example**:
```typescript
async onload() {
  await this.loadSettings();
  this.registerView(VIEW_TYPE_PROJECT_BOARD, (leaf) => new ProjectBoardView(leaf, this));
  this.addRibbonIcon('layout-dashboard', 'Open GitHub Project', () => this.activateView());
}
```

##### `onunload(): void`

Called when the plugin is unloaded.

**Returns**: `void`

##### `loadSettings(): Promise<void>`

Load plugin settings from storage.

**Returns**: `Promise<void>`

##### `saveSettings(): Promise<void>`

Save plugin settings to storage.

**Returns**: `Promise<void>`

##### `activateView(): Promise<void>`

Open or focus the project board view.

**Returns**: `Promise<void>`

**Example**:
```typescript
await this.plugin.activateView();
```

## State Management

### ProjectState

Centralized state management using event-driven pattern.

#### Constructor

```typescript
constructor(plugin: GitHubProjectsPlugin)
```

**Parameters**:
- `plugin`: Reference to the main plugin instance

#### Properties

```typescript
class ProjectState {
  private project: Project | null;
  private loading: boolean;
  private error: string | null;
  private events: Events;
}
```

#### Methods

##### `loadProject(): Promise<void>`

Fetch project data from GitHub.

**Returns**: `Promise<void>`

**Emits**: `project-loading`, `project-loaded`, `project-error`

**Example**:
```typescript
await projectState.loadProject();
```

##### `refresh(): Promise<void>`

Refresh project data from GitHub.

**Returns**: `Promise<void>`

**Emits**: `project-refreshing`, `project-loaded`, `project-error`

##### `moveItem(itemId: string, statusId: string): Promise<void>`

Move an item to a different status (optimistic update).

**Parameters**:
- `itemId`: The ID of the item to move
- `statusId`: The ID of the target status

**Returns**: `Promise<void>`

**Emits**: `item-moved`, `item-move-error`

**Example**:
```typescript
await projectState.moveItem('ITEM_123', 'STATUS_456');
```

##### `getProject(): Project | null`

Get the current project data.

**Returns**: `Project | null`

##### `getColumns(): Column[]`

Get project columns based on status field.

**Returns**: `Column[]`

##### `getItemsByColumn(columnId: string): ProjectItem[]`

Get all items in a specific column.

**Parameters**:
- `columnId`: The column ID (status option ID)

**Returns**: `ProjectItem[]`

##### `on(event: string, callback: Function): void`

Subscribe to state events.

**Parameters**:
- `event`: Event name
- `callback`: Function to call when event is triggered

**Example**:
```typescript
projectState.on('project-loaded', (project) => {
  console.log('Project loaded:', project.title);
});
```

##### `off(event: string, callback: Function): void`

Unsubscribe from state events.

**Parameters**:
- `event`: Event name
- `callback`: Previously registered callback function

## GitHub API Client

### GitHubAPIClient

GraphQL client for GitHub Projects V2 API.

#### Constructor

```typescript
constructor(token: string)
```

**Parameters**:
- `token`: GitHub Personal Access Token

#### Methods

##### `fetchProject(organization: string, projectNumber: number): Promise<Project>`

Fetch project data from GitHub.

**Parameters**:
- `organization`: GitHub organization name
- `projectNumber`: Project number from URL

**Returns**: `Promise<Project>`

**Throws**:
- `Error` if authentication fails
- `Error` if project not found
- `Error` if network error

**Example**:
```typescript
const client = new GitHubAPIClient(token);
const project = await client.fetchProject('my-org', 5);
```

##### `updateItemStatus(projectId: string, itemId: string, fieldId: string, statusId: string): Promise<void>`

Update an item's status field.

**Parameters**:
- `projectId`: Project V2 ID
- `itemId`: Item ID
- `fieldId`: Status field ID
- `statusId`: Target status option ID

**Returns**: `Promise<void>`

**Throws**: `Error` if update fails

**Example**:
```typescript
await client.updateItemStatus(
  'PROJECT_ID',
  'ITEM_ID',
  'FIELD_ID',
  'STATUS_ID'
);
```

##### `testConnection(organization: string, projectNumber: number): Promise<boolean>`

Test if the API connection works.

**Parameters**:
- `organization`: GitHub organization name
- `projectNumber`: Project number

**Returns**: `Promise<boolean>` - `true` if connection successful

**Example**:
```typescript
const isValid = await client.testConnection('my-org', 5);
```

## Type Definitions

### PluginSettings

```typescript
interface PluginSettings {
  githubToken: string;        // GitHub PAT (stored in localStorage)
  organization: string;       // GitHub organization name
  projectNumber: number;      // Project number from URL
  autoRefreshInterval: number; // Auto-refresh interval in minutes
}
```

### Project

```typescript
interface Project {
  id: string;              // Project V2 ID
  title: string;           // Project title
  description?: string;    // Project description
  fields: ProjectField[];  // All project fields
  items: ProjectItem[];    // All project items
  statusField?: StatusField; // The "Status" field used for columns
}
```

### ProjectField

```typescript
interface ProjectField {
  id: string;          // Field ID
  name: string;        // Field name
  type: FieldType;     // Field type
  options?: FieldOption[]; // Options for select fields
}

type FieldType =
  | 'TEXT'
  | 'NUMBER'
  | 'DATE'
  | 'SINGLE_SELECT'
  | 'ITERATION';
```

### StatusField

```typescript
interface StatusField extends ProjectField {
  type: 'SINGLE_SELECT';
  options: StatusOption[];
}

interface StatusOption {
  id: string;      // Option ID
  name: string;    // Display name
  color?: string;  // Optional color
}
```

### ProjectItem

```typescript
interface ProjectItem {
  id: string;              // Item ID
  type: ItemType;          // Item type
  content: ItemContent;    // Issue or PR content
  fieldValues: FieldValue[]; // All field values
  statusId?: string;       // Current status option ID
}

type ItemType = 'ISSUE' | 'PULL_REQUEST' | 'DRAFT_ISSUE';
```

### ItemContent

```typescript
interface ItemContent {
  number?: number;         // Issue/PR number
  title: string;           // Title
  body?: string;           // Description
  state: ItemState;        // Open/Closed/Merged
  url: string;             // GitHub URL
  assignees: Assignee[];   // Assigned users
  labels: Label[];         // Labels
  createdAt: string;       // Creation timestamp
  updatedAt: string;       // Last update timestamp
}

type ItemState = 'OPEN' | 'CLOSED' | 'MERGED';
```

### Assignee

```typescript
interface Assignee {
  id: string;       // User ID
  login: string;    // GitHub username
  name?: string;    // Display name
  avatarUrl: string; // Avatar image URL
}
```

### Label

```typescript
interface Label {
  id: string;       // Label ID
  name: string;     // Label name
  color: string;    // Hex color code
  description?: string; // Label description
}
```

### Column

```typescript
interface Column {
  id: string;            // Status option ID
  name: string;          // Column name
  items: ProjectItem[];  // Items in this column
}
```

## Events

### State Events

The `ProjectState` class emits the following events:

#### `project-loading`

Emitted when project data fetch starts.

**Payload**: None

**Example**:
```typescript
projectState.on('project-loading', () => {
  console.log('Loading project...');
});
```

#### `project-loaded`

Emitted when project data is successfully loaded.

**Payload**: `Project`

**Example**:
```typescript
projectState.on('project-loaded', (project: Project) => {
  console.log('Project loaded:', project.title);
});
```

#### `project-error`

Emitted when project fetch fails.

**Payload**: `Error`

**Example**:
```typescript
projectState.on('project-error', (error: Error) => {
  console.error('Failed to load project:', error.message);
});
```

#### `project-refreshing`

Emitted when project refresh starts.

**Payload**: None

#### `item-moved`

Emitted when an item is moved (optimistically).

**Payload**: `{ itemId: string, statusId: string }`

**Example**:
```typescript
projectState.on('item-moved', ({ itemId, statusId }) => {
  console.log(`Item ${itemId} moved to ${statusId}`);
});
```

#### `item-move-error`

Emitted when item move fails.

**Payload**: `{ itemId: string, error: Error }`

## Utility Functions

### Storage Utilities

Located in `src/utils/storage.ts`:

#### `getToken(): string | null`

Get GitHub token from localStorage.

**Returns**: `string | null`

**Example**:
```typescript
const token = getToken();
```

#### `setToken(token: string): void`

Save GitHub token to localStorage.

**Parameters**:
- `token`: GitHub Personal Access Token

**Example**:
```typescript
setToken('ghp_...');
```

#### `clearToken(): void`

Remove GitHub token from localStorage.

**Example**:
```typescript
clearToken();
```

### GitHub Utilities

Located in `src/utils/github.ts`:

#### `parseProjectUrl(url: string): { org: string, number: number } | null`

Parse organization and project number from GitHub URL.

**Parameters**:
- `url`: GitHub project URL

**Returns**: `{ org: string, number: number } | null`

**Example**:
```typescript
const parsed = parseProjectUrl('https://github.com/orgs/my-org/projects/5');
// Returns: { org: 'my-org', number: 5 }
```

#### `formatItemNumber(item: ProjectItem): string`

Format item number for display (e.g., "#123").

**Parameters**:
- `item`: Project item

**Returns**: `string`

**Example**:
```typescript
const formatted = formatItemNumber(item);
// Returns: "#123"
```

#### `getItemStateColor(state: ItemState): string`

Get CSS color for item state.

**Parameters**:
- `state`: Item state (OPEN/CLOSED/MERGED)

**Returns**: `string` (CSS color value)

**Example**:
```typescript
const color = getItemStateColor('OPEN');
// Returns: 'var(--color-green)'
```

### Date Utilities

#### `formatRelativeTime(timestamp: string): string`

Format timestamp as relative time (e.g., "2 hours ago").

**Parameters**:
- `timestamp`: ISO 8601 timestamp

**Returns**: `string`

**Example**:
```typescript
const relative = formatRelativeTime('2024-01-15T10:00:00Z');
// Returns: "2 hours ago"
```

## Extension Points

### Custom Views

Register custom views that integrate with the plugin:

```typescript
this.registerView(
  'custom-view-type',
  (leaf) => new CustomView(leaf, this.plugin.projectState)
);
```

### Custom Commands

Add commands that interact with project state:

```typescript
this.addCommand({
  id: 'custom-command',
  name: 'Custom Command',
  callback: async () => {
    const project = this.plugin.projectState.getProject();
    // Do something with project data
  }
});
```

### Event Subscriptions

Subscribe to plugin events in other plugins or scripts:

```typescript
// Access plugin instance
const plugin = app.plugins.plugins['github-projects'];

// Subscribe to events
plugin.projectState.on('project-loaded', (project) => {
  // React to project updates
});
```

## Error Handling

### Error Types

#### `AuthenticationError`

Thrown when GitHub authentication fails.

```typescript
catch (error) {
  if (error.message.includes('authentication')) {
    // Handle authentication error
  }
}
```

#### `NotFoundError`

Thrown when project is not found.

```typescript
catch (error) {
  if (error.message.includes('not found')) {
    // Handle not found error
  }
}
```

#### `NetworkError`

Thrown when network request fails.

```typescript
catch (error) {
  if (error.message.includes('network')) {
    // Handle network error
  }
}
```

#### `RateLimitError`

Thrown when GitHub API rate limit is exceeded.

```typescript
catch (error) {
  if (error.message.includes('rate limit')) {
    // Handle rate limit error
  }
}
```

## Best Practices

### Performance

1. **Debounce frequent operations**:
   ```typescript
   const debouncedRefresh = debounce(() => state.refresh(), 1000);
   ```

2. **Memoize expensive calculations**:
   ```typescript
   const columns = useMemo(() => groupByStatus(items), [items]);
   ```

3. **Use virtual scrolling for large lists**

### Security

1. **Never log tokens**:
   ```typescript
   // Bad
   console.log('Token:', token);

   // Good
   console.log('Token:', token ? '[REDACTED]' : 'None');
   ```

2. **Validate all user input**
3. **Use HTTPS for all API calls**

### Error Handling

1. **Always handle errors gracefully**:
   ```typescript
   try {
     await state.loadProject();
   } catch (error) {
     new Notice('Failed to load project: ' + error.message);
   }
   ```

2. **Provide user-friendly error messages**
3. **Log errors for debugging**

## TypeScript Support

All APIs are fully typed. Import types:

```typescript
import type {
  Project,
  ProjectItem,
  PluginSettings,
  Column
} from 'obsidian-github-projects';
```

Enable strict TypeScript for best experience:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```
