# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Obsidian plugin that integrates GitHub Projects V2 as interactive Kanban boards. The plugin uses Preact (React alternative) for UI components and communicates with GitHub's GraphQL API to fetch and manage project data.

## Common Development Commands

**IMPORTANT**: Always prefer `make` commands over `npm` commands for consistency. Always run `make check` before completing any work to ensure the CI pipeline will pass.

### Building and Development
```bash
# Install dependencies
make install

# Development build with watch mode (copies to vault automatically)
make dev VAULT=/path/to/your/vault

# Production build
make build

# Clean build artifacts
make clean
```

### Testing
```bash
# Run all tests
make test

# Run tests in watch mode
make test-watch

# Run tests with coverage
make coverage

# Run specific test file
npm test -- src/__tests__/github-client.test.ts
```

### Code Quality Checks (MUST RUN BEFORE COMPLETING WORK)
```bash
# Run ALL checks (lint + typecheck + test) - ALWAYS run this before finishing
make check

# Individual checks if needed:
make lint        # Run linter
make typecheck   # Type checking

# The CI pipeline will fail if any of these checks fail
```

### Test Coverage Requirements
When running `make coverage`, ensure all metrics meet the thresholds defined in `jest.config.js` under `coverageThreshold.global`. The CI pipeline will automatically fail if coverage falls below these configured thresholds.

Check the current thresholds in jest.config.js:coverageThreshold before creating a PR.

### Development Workflow with Vault
```bash
# Start development mode (build + copy to vault + watch)
make dev VAULT=/path/to/vault

# Copy built plugin to vault
make copy-to-vault VAULT=/path/to/vault

# Create symlink to vault (alternative to copying)
make link-vault VAULT=/path/to/vault
```

### Before Creating a PR
```bash
# Run the PR check command - this runs ALL checks including coverage verification
make pr

# The make pr command will:
# 1. Run linter
# 2. Run type checking
# 3. Run all tests
# 4. Verify test coverage meets thresholds from jest.config.js
# 5. Only pass if ALL checks succeed

# If coverage falls below thresholds defined in jest.config.js, the command will fail
```

## Architecture and Key Components

### Core Structure

The plugin follows a modular architecture with clear separation of concerns:

- **API Layer** (`src/api/`)
  - `github-client.ts`: Main GitHub GraphQL client for Projects V2 API
  - `queries.ts`: GraphQL query definitions for fetching data
  - `mutations.ts`: GraphQL mutations for updating project items
  - `types.ts`: TypeScript type definitions for API responses

- **State Management** (`src/state/`)
  - `project-state.ts`: Event-driven state container extending Obsidian's Events class
  - `sync.ts`: Manages auto-refresh and synchronization with GitHub
  - `cache.ts`: API response caching to minimize requests

- **Utilities** (`src/utils/`)
  - `auth.ts`: Authentication and token management
  - `card-filters.ts`: Card filtering logic
  - `error-handling.ts`: Centralized error handling
  - `formatting.ts`: Text formatting utilities

- **View Layer** (`src/views/`)
  - `ProjectBoardView.tsx`: Main Obsidian view container
  - `components/Board.tsx`: Kanban board with drag-and-drop via SortableJS
  - `components/Column.tsx`: Individual board columns
  - `components/Card.tsx`: Project item cards
  - `components/ProjectSelector.tsx`: Project dropdown selector for switching projects
  - `components/GlobalFilters.tsx`: Global filtering controls
  - `components/ColumnFilters.tsx`: Per-column filtering options
  - `components/CardDetailContent.tsx`: Content component for card details
  - `components/EmptyState.tsx`: Empty state display
  - `components/LoadingSpinner.tsx`: Loading indicator
  - `components/Toast.tsx`: Toast notification component
  - `modals/CardDetailModal.tsx`: Detailed view for individual items

- **Plugin Core**
  - `src/main.tsx`: Entry point extending Obsidian's Plugin class
  - `src/settings.ts`: Settings tab and configuration management
  - Manages plugin lifecycle, commands, and ribbon icons
  - Coordinates between managers and views

### Key Design Patterns

1. **Event-Driven Updates**: ProjectState extends Obsidian's Events class to emit events when data changes, allowing views to reactively update.

2. **Optimistic UI Updates**: When dragging cards, the UI updates immediately while mutations are sent to GitHub in the background.

3. **Token Management**: GitHub tokens are stored in localStorage (not vault files) for security, preventing sync across devices.

4. **Virtual DOM with Preact**: Uses Preact (3KB React alternative) with aliasing for React compatibility, rendering components efficiently.

5. **GraphQL Pagination**: Handles GitHub's cursor-based pagination to fetch all project items across large projects.

## GitHub API Integration

The plugin uses GitHub's Projects V2 GraphQL API with the following key operations:

- Fetching project metadata and fields
- Retrieving all project items with pagination
- Moving items between columns (updating Status field)
- Fetching item details (issues, PRs, draft items)

Authentication requires a GitHub Personal Access Token with `project` scope (classic) or `Projects: Read and Write` permission (fine-grained).

## Build Configuration

- **esbuild**: Bundles TypeScript/JSX with Preact aliasing
- **Target**: ES2018 for Obsidian compatibility
- **External**: Obsidian APIs and Node built-ins are marked external
- **Source maps**: Inline in development, disabled in production

## Testing Strategy

Tests use Jest with ts-jest for TypeScript support. Key test files:
- `github-client.test.ts`: API client tests with mocked responses
- `github-client-projects.test.ts`: Project-specific API tests
- `project-state.test.ts`: State management and event emission
- `card-filters.test.ts`: Filtering logic for cards
- `cache.test.ts`: Caching behavior and expiration
- `error-handling.test.ts`: Error handling mechanisms
- `sync.test.ts`: Synchronization logic tests
- `utils.test.ts`: Utility function tests

Mock Obsidian APIs are provided in `src/__mocks__/obsidian.ts`.

## Project-Specific Patterns

1. **Column Organization**: Items are organized into columns based on their Status field value, which must be a single-select field in the GitHub project.

2. **Field Transformation**: GitHub's field values are transformed into a normalized format for consistent handling across different field types.

3. **Rate Limiting**: The plugin respects GitHub's rate limits (5000 points/hour for GraphQL) with caching and minimal refresh intervals.

4. **Settings Storage**: Plugin settings are stored in Obsidian's data.json, while sensitive tokens use localStorage.