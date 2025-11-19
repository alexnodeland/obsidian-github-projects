# Architecture

## Table of Contents

- [Overview](#overview)
- [High-Level Architecture](#high-level-architecture)
- [Core Components](#core-components)
- [Data Flow](#data-flow)
- [State Management](#state-management)
- [API Integration](#api-integration)
- [UI Layer](#ui-layer)
- [Storage & Security](#storage--security)
- [Performance Considerations](#performance-considerations)

## Overview

The GitHub Projects plugin integrates GitHub's Projects V2 API into Obsidian's plugin ecosystem, providing a Kanban board interface for project management. The architecture emphasizes:

- **Separation of concerns** between API, state, and UI layers
- **Optimistic updates** for responsive user experience
- **Event-driven state management** using Obsidian's Events system
- **Secure token storage** using localStorage (not vault files)
- **Efficient rendering** with Preact and virtual DOM

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Obsidian Application                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              GitHub Projects Plugin                    │  │
│  │                                                         │  │
│  │  ┌──────────────┐      ┌──────────────┐              │  │
│  │  │   Settings   │      │  Project     │              │  │
│  │  │     Tab      │◄────►│  Board View  │              │  │
│  │  └──────────────┘      └──────┬───────┘              │  │
│  │                               │                       │  │
│  │                        ┌──────▼───────┐              │  │
│  │                        │    State     │              │  │
│  │                        │  Management  │              │  │
│  │                        │ (EventEmitter)│             │  │
│  │                        └──────┬───────┘              │  │
│  │                               │                       │  │
│  │         ┌─────────────────────┼─────────────────┐    │  │
│  │         │                     │                 │    │  │
│  │    ┌────▼────┐         ┌──────▼──────┐   ┌─────▼────┐  │
│  │    │ GitHub  │         │   Storage   │   │   UI     │  │
│  │    │   API   │         │  (localStorage)│ │Components│  │
│  │    │ Client  │         └─────────────┘   │ (Preact) │  │
│  │    └────┬────┘                           └──────────┘  │
│  │         │                                              │  │
│  └─────────┼──────────────────────────────────────────────┘  │
│            │                                                │
└────────────┼────────────────────────────────────────────────┘
             │
       ┌─────▼──────┐
       │  GitHub    │
       │ Projects V2│
       │ GraphQL API│
       └────────────┘
```

## Core Components

### 1. Plugin Entry Point (`main.tsx`)

The main plugin class extends Obsidian's `Plugin` base class.

**Responsibilities**:
- Register custom views (ProjectBoardView)
- Register commands and ribbon icons
- Initialize settings
- Manage plugin lifecycle (load/unload)

**Key Methods**:
```typescript
class GitHubProjectsPlugin extends Plugin {
  async onload() {
    // Load settings
    // Register view
    // Add ribbon icon
    // Register commands
  }

  async onunload() {
    // Cleanup resources
    // Detach views
  }
}
```

### 2. Settings Tab (`settings.ts`)

Manages plugin configuration UI.

**Responsibilities**:
- Render settings UI
- Validate user input
- Save settings securely
- Provide test connection functionality

**Settings Schema**:
```typescript
interface PluginSettings {
  githubToken: string;       // Stored in localStorage
  organization: string;      // GitHub org name
  projectNumber: number;     // Project number from URL
  autoRefreshInterval: number; // Minutes
}
```

### 3. Project Board View (`views/ProjectBoardView.tsx`)

Custom ItemView displaying the Kanban board.

**Responsibilities**:
- Render board UI
- Handle user interactions
- Coordinate with state and API
- Manage view lifecycle

**Lifecycle**:
```typescript
class ProjectBoardView extends ItemView {
  async onOpen() {
    // Initialize state
    // Fetch project data
    // Render UI
  }

  async onClose() {
    // Cleanup event listeners
    // Save state
  }
}
```

### 4. State Management (`state/ProjectState.ts`)

Centralized state container using event-driven pattern.

**Responsibilities**:
- Store project data
- Emit change events
- Handle state mutations
- Cache data

**Events**:
- `project-loaded`: Project data fetched
- `item-moved`: Card moved between columns
- `project-error`: Error occurred
- `project-refreshing`: Refresh started

### 5. API Client (`api/client.ts`)

GraphQL client for GitHub Projects V2 API.

**Responsibilities**:
- Authenticate requests
- Execute GraphQL queries/mutations
- Handle rate limiting
- Parse responses

**Key Methods**:
```typescript
class GitHubAPIClient {
  async fetchProject(org, projectNumber): Promise<Project>
  async updateItemStatus(itemId, statusId): Promise<void>
  async addItemToProject(projectId, contentId): Promise<void>
}
```

### 6. UI Components (`views/components/`)

Preact components for rendering the board.

**Component Hierarchy**:
```
ProjectBoard
├── FilterBar
├── Column (multiple)
│   └── Card (multiple)
│       ├── Avatar (multiple)
│       └── Badge
└── DetailModal
```

## Data Flow

### 1. Loading Project Data

```
User Opens Board
       ↓
ProjectBoardView.onOpen()
       ↓
ProjectState.loadProject()
       ↓
GitHubAPIClient.fetchProject()
       ↓
GitHub GraphQL API
       ↓
ProjectState.setProject()
       ↓
Event: 'project-loaded'
       ↓
ProjectBoardView re-renders
```

### 2. Moving a Card (Optimistic Update)

```
User Drags Card
       ↓
onDrop handler
       ↓
ProjectState.moveItem() (optimistic)
       ↓
Event: 'item-moved'
       ↓
UI updates immediately
       ↓
GitHubAPIClient.updateItemStatus()
       ↓
GitHub GraphQL API
       ↓
Background verification on next refresh
```

### 3. Auto-Refresh

```
Timer triggers (every N minutes)
       ↓
ProjectState.refresh()
       ↓
Event: 'project-refreshing'
       ↓
UI shows loading indicator
       ↓
GitHubAPIClient.fetchProject()
       ↓
ProjectState.setProject()
       ↓
Event: 'project-loaded'
       ↓
UI updates with fresh data
```

## State Management

### Event-Driven Pattern

Using Obsidian's `Events` class for pub/sub pattern:

```typescript
class ProjectState {
  private events = new Events();
  private projectData: Project | null = null;

  on(event: string, callback: (...args: any[]) => void) {
    this.events.on(event, callback);
  }

  setProject(project: Project) {
    this.projectData = project;
    this.events.trigger('project-loaded', project);
  }
}
```

### State Immutability

State updates create new objects:

```typescript
moveItem(itemId: string, newStatusId: string) {
  const newItems = this.projectData.items.map(item =>
    item.id === itemId
      ? { ...item, statusId: newStatusId }
      : item
  );

  this.setProject({
    ...this.projectData,
    items: newItems
  });
}
```

### Caching Strategy

- **In-memory cache**: Current project state
- **localStorage cache**: Last successful fetch (for offline viewing)
- **TTL**: Cache invalidated on refresh or after interval

## API Integration

### GraphQL Queries

**Fetch Project**:
```graphql
query GetProject($org: String!, $number: Int!) {
  organization(login: $org) {
    projectV2(number: $number) {
      id
      title
      fields(first: 20) {
        nodes {
          ... on ProjectV2SingleSelectField {
            id
            name
            options {
              id
              name
            }
          }
        }
      }
      items(first: 100) {
        nodes {
          id
          content {
            ... on Issue {
              title
              number
              state
            }
            ... on PullRequest {
              title
              number
              state
            }
          }
          fieldValues(first: 20) {
            nodes {
              ... on ProjectV2ItemFieldSingleSelectValue {
                field { id }
                optionId
              }
            }
          }
        }
      }
    }
  }
}
```

**Update Item Status**:
```graphql
mutation UpdateItemStatus($projectId: ID!, $itemId: ID!, $fieldId: ID!, $value: String!) {
  updateProjectV2ItemFieldValue(
    input: {
      projectId: $projectId
      itemId: $itemId
      fieldId: $fieldId
      value: { singleSelectOptionId: $value }
    }
  ) {
    projectV2Item {
      id
    }
  }
}
```

### Rate Limiting

GitHub GraphQL API limits:
- **5,000 points per hour**
- Query cost varies (typically 1-50 points)

**Mitigation**:
- Configurable auto-refresh interval
- Debounced manual refreshes
- Batch mutations when possible

### Error Handling

```typescript
try {
  const response = await this.fetchProject(org, number);
  return response;
} catch (error) {
  if (error.status === 401) {
    throw new Error('Invalid token');
  } else if (error.status === 404) {
    throw new Error('Project not found');
  } else {
    throw new Error('Network error');
  }
}
```

## UI Layer

### Preact Components

We use Preact (React-compatible, 3KB) for:
- **Virtual DOM**: Efficient rendering
- **Hooks**: State and effects
- **TypeScript**: Type-safe components

### Drag and Drop

Using **SortableJS** for drag-and-drop:

```typescript
import Sortable from 'sortablejs';

const sortable = Sortable.create(columnElement, {
  group: 'board',
  animation: 150,
  onEnd: (evt) => {
    const itemId = evt.item.dataset.itemId;
    const newStatusId = evt.to.dataset.statusId;
    projectState.moveItem(itemId, newStatusId);
  }
});
```

### Styling

- **CSS Variables**: Theme integration
- **BEM Methodology**: Clear class naming
- **Responsive**: Mobile-friendly layouts

```css
.github-projects-board {
  --bg-color: var(--background-primary);
  --text-color: var(--text-normal);
}

.github-projects-board__column { }
.github-projects-board__card { }
```

## Storage & Security

### Token Storage

Tokens stored in `localStorage` (NOT vault files):

```typescript
// Save token
localStorage.setItem('github-projects-token', token);

// Retrieve token
const token = localStorage.getItem('github-projects-token');
```

**Security considerations**:
- ✅ Not synced via Obsidian Sync
- ✅ Not committed to version control
- ⚠️ Accessible to other plugins
- ⚠️ Stored in plain text (browser limitation)

**Recommendations**:
- Use fine-grained tokens with minimal permissions
- Set token expiration
- Rotate tokens periodically

### Settings Storage

Non-sensitive settings stored in vault:

```
.obsidian/plugins/github-projects/data.json
```

Contains: organization, project number, refresh interval (NOT token)

## Performance Considerations

### Virtual Scrolling

For boards with 100+ cards, implement virtual scrolling:

```typescript
import { VirtualScroller } from './VirtualScroller';

<VirtualScroller
  items={cards}
  itemHeight={120}
  renderItem={(card) => <Card {...card} />}
/>
```

### Debouncing

Debounce expensive operations:

```typescript
const debouncedRefresh = debounce(
  () => projectState.refresh(),
  1000
);
```

### Memoization

Memoize expensive calculations:

```typescript
const columns = useMemo(() => {
  return groupItemsByStatus(items);
}, [items]);
```

### Bundle Size

- **Preact**: 3KB (vs React 40KB)
- **Tree shaking**: Remove unused code
- **Code splitting**: Load features on demand

Current bundle size: **~120KB** (minified)

## Future Enhancements

### Planned Features

1. **Multi-project support**: Switch between projects
2. **Create issues**: Add new items from Obsidian
3. **Bi-directional links**: Link Obsidian notes to GitHub items
4. **Custom fields**: Display all project fields
5. **Filtering**: Advanced filters and search
6. **Offline mode**: Full offline support with sync queue

### Architecture Changes

1. **IndexedDB**: Replace localStorage for better performance
2. **Web Workers**: Offload API calls to background thread
3. **WebSocket**: Real-time updates from GitHub
4. **Plugin API**: Allow other plugins to integrate

## References

- [Obsidian Plugin API](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- [GitHub GraphQL API](https://docs.github.com/en/graphql)
- [Preact Documentation](https://preactjs.com/)
- [SortableJS](https://github.com/SortableJS/Sortable)
