# GitHub Projects for Obsidian

Manage GitHub Projects V2 with Kanban boards directly in Obsidian.

## Features

- 📋 **Kanban Board View**: Visualize your GitHub Projects V2 as interactive Kanban boards
- 🔄 **Drag & Drop**: Move items between columns with smooth drag-and-drop
- 🔐 **Secure Authentication**: Personal Access Token stored in localStorage (not synced with vault)
- ⚡ **Real-time Sync**: Auto-refresh project data from GitHub at configurable intervals
- 🎨 **Theme Compatible**: Seamlessly integrates with Obsidian themes
- 📱 **Mobile Support**: Works on desktop and mobile (iOS/Android)

## Installation

### From Obsidian Community Plugins

1. Open Settings in Obsidian
2. Go to Community Plugins and disable Safe Mode
3. Click Browse and search for "GitHub Projects"
4. Click Install, then Enable

### Manual Installation

1. Download the latest release from GitHub
2. Extract the files to `{VaultFolder}/.obsidian/plugins/github-projects/`
3. Reload Obsidian
4. Enable the plugin in Settings → Community Plugins

## Setup

### 1. Create a GitHub Personal Access Token

1. Go to [GitHub Settings → Tokens](https://github.com/settings/tokens)
2. Click "Generate new token" (fine-grained or classic)
3. For **fine-grained tokens**: Grant "Projects: Read and Write" permission
4. For **classic tokens**: Select the "project" scope
5. Copy the token (starts with `ghp_` or `github_pat_`)

### 2. Configure the Plugin

1. Open Obsidian Settings → GitHub Projects
2. Paste your GitHub token in the authentication section
3. Enter your **Organization name** (e.g., "octo-org")
4. Enter your **Project number** (from the URL: `github.com/orgs/octo-org/projects/5` → number is `5`)
5. (Optional) Configure auto-refresh interval

### 3. Open the Project Board

- Click the dashboard icon in the ribbon, or
- Use the command palette: "GitHub Projects: Open Project Board"

## Usage

### View Project Board

The board displays your project columns based on the "Status" field. Each card shows:

- Issue/PR number and title
- Description preview
- Assignees with avatars
- State (Open/Closed/Merged)
- Item type (Issue/PR/Draft)

### Move Items

Drag cards between columns to update their status. Changes are:

1. Applied immediately in the UI (optimistic update)
2. Synced to GitHub in the background
3. Verified on next auto-refresh

### View Card Details

Click any card to see full details:

- Complete description
- All assignees
- All field values
- Link to view on GitHub

### Manual Refresh

Use "GitHub Projects: Refresh Project Data" command or the Refresh button in settings to manually sync.

## Settings

| Setting | Description | Default |
|---------|-------------|---------|
| GitHub Token | Personal Access Token for authentication | - |
| Organization | GitHub organization name | - |
| Project Number | Project number from URL | 1 |
| Auto-refresh Interval | How often to sync from GitHub | 5 minutes |

## Development

### Prerequisites

- Node.js 16+
- npm or yarn

### Setup

```bash
npm install
```

### Build

```bash
# Development build with watch mode
npm run dev

# Production build
npm run build
```

### Test

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Project Structure

```
src/
├── api/              # GitHub GraphQL client
├── state/            # State management
├── views/            # UI components and views
├── utils/            # Utility functions
├── settings.ts       # Settings tab
└── main.tsx          # Plugin entry point
```

## Architecture

- **API Layer**: GraphQL client for GitHub Projects V2 API
- **State Management**: Event-driven state with Obsidian Events
- **UI Components**: Preact for reactive components
- **Drag & Drop**: SortableJS for smooth interactions
- **Sync**: Bidirectional sync with optimistic updates

## Security

- Tokens are stored in localStorage (not in vault files)
- Tokens are NOT synced or backed up
- Use fine-grained tokens with minimal permissions
- Other Obsidian plugins technically have access to localStorage

## Limitations

- Only supports GitHub Projects V2 (not legacy Projects)
- Requires "Status" field for column-based boards
- GraphQL rate limits apply (5,000 points/hour)

## Troubleshooting

### Connection Failed

- Verify token has "project" or "Projects: Read and Write" permission
- Check organization name and project number are correct
- Ensure project is accessible with your GitHub account

### Items Not Syncing

- Check auto-refresh interval in settings
- Manually refresh with the command
- Check browser console for errors

### Board Not Displaying

- Ensure project has a "Status" field (single-select type)
- Verify project has items
- Try refreshing the view

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- [Report issues](https://github.com/yourusername/obsidian-github-projects/issues)
- [Request features](https://github.com/yourusername/obsidian-github-projects/issues/new)
- [Discussions](https://github.com/yourusername/obsidian-github-projects/discussions)

## Acknowledgments

- Built with the [Obsidian Plugin API](https://github.com/obsidianmd/obsidian-api)
- Inspired by [obsidian-kanban](https://github.com/mgmeyers/obsidian-kanban)
- Uses [SortableJS](https://github.com/SortableJS/Sortable) for drag-and-drop
- UI powered by [Preact](https://preactjs.com/)
