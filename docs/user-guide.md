# User Guide

## Table of Contents

- [Installation](#installation)
- [Setup](#setup)
- [Usage](#usage)
- [Features](#features)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

## Installation

### From Obsidian Community Plugins (Recommended)

1. Open **Settings** in Obsidian
2. Navigate to **Community Plugins** and disable **Safe Mode** if enabled
3. Click **Browse** and search for **"GitHub Projects"**
4. Click **Install**, then **Enable**

### Manual Installation

1. Download the latest release from the [GitHub releases page](https://github.com/alexnodeland/obsidian-github-projects/releases)
2. Extract `main.js`, `manifest.json`, and `styles.css` from the zip file
3. Create a folder named `github-projects` in `{VaultFolder}/.obsidian/plugins/`
4. Copy the extracted files into the `github-projects` folder
5. Reload Obsidian
6. Enable the plugin in **Settings → Community Plugins**

## Setup

### Step 1: Create a GitHub Personal Access Token

You need a Personal Access Token (PAT) to authenticate with GitHub's API.

#### For Fine-Grained Tokens (Recommended)

1. Go to [GitHub Settings → Developer settings → Personal access tokens → Fine-grained tokens](https://github.com/settings/tokens?type=beta)
2. Click **"Generate new token"**
3. Configure the token:
   - **Token name**: `Obsidian GitHub Projects`
   - **Expiration**: Choose your preferred expiration (90 days recommended)
   - **Repository access**: Select specific repositories or all repositories
   - **Permissions**: Grant **"Projects"** permission with **Read and Write** access
4. Click **"Generate token"**
5. **Copy the token immediately** (it starts with `github_pat_`)

#### For Classic Tokens

1. Go to [GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
2. Click **"Generate new token (classic)"**
3. Configure the token:
   - **Note**: `Obsidian GitHub Projects`
   - **Expiration**: Choose your preferred expiration
   - **Scopes**: Check the **`project`** scope (also requires `repo` for private projects)
4. Click **"Generate token"**
5. **Copy the token immediately** (it starts with `ghp_`)

⚠️ **Security Note**: Store your token securely. The plugin stores it in `localStorage`, which is not synced with your vault files.

### Step 2: Configure the Plugin

1. Open **Obsidian Settings → GitHub Projects**
2. Paste your GitHub token in the **"GitHub Token"** field
3. Enter your **GitHub organization name** (e.g., `my-org`)
   - Find this in your project URL: `github.com/orgs/my-org/projects/5`
4. Enter your **Project number** (e.g., `5`)
   - Find this in your project URL: `github.com/orgs/my-org/projects/5`
5. (Optional) Configure **Auto-refresh interval** (default: 5 minutes)

### Step 3: Open Your Project Board

You can open your project board in multiple ways:

- **Ribbon Icon**: Click the dashboard icon (📋) in the left ribbon
- **Command Palette**: Press `Ctrl/Cmd+P` and search for "GitHub Projects: Open Project Board"
- **Settings**: Click "Open Project Board" button in the plugin settings

## Usage

### Viewing the Project Board

The board displays your GitHub Project as a Kanban board with columns based on the **Status** field.

Each card shows:
- **Issue/PR number** and **title**
- **Description** preview (first 100 characters)
- **Assignees** with avatars
- **State indicator**: Open (green), Closed (red), Merged (purple)
- **Type badge**: Issue, Pull Request, or Draft Issue

### Moving Items Between Columns

**Drag and Drop**:
1. Click and hold a card
2. Drag it to the desired column
3. Release to drop

The plugin uses **optimistic updates**:
- The UI updates immediately for responsive feel
- Changes sync to GitHub in the background
- The board refreshes automatically to verify the update

### Viewing Card Details

Click any card to open the detail modal, which shows:

- **Full title** and **description** (rendered as Markdown)
- **All assignees** with names and avatars
- **All project fields** and their values
- **Direct link** to view the item on GitHub

Click outside the modal or press `Esc` to close.

### Filtering and Searching

Use the filter controls at the top of the board:

- **Search**: Type to filter by title or description
- **Assignee filter**: Show only items assigned to specific users
- **State filter**: Filter by Open, Closed, or Merged
- **Type filter**: Filter by Issue, Pull Request, or Draft

### Refreshing Data

The board auto-refreshes at the interval specified in settings (default: 5 minutes).

**Manual refresh**:
- Use command: "GitHub Projects: Refresh Project Data"
- Click the **Refresh** button in settings

## Features

### 📋 Kanban Board View

Visualize your entire GitHub Project V2 as an interactive Kanban board with customizable columns.

### 🔄 Drag & Drop

Smoothly move items between columns. Changes are applied optimistically and synced to GitHub in the background.

### 🔐 Secure Authentication

- Tokens stored in `localStorage` (not in vault files)
- Tokens are **never synced** to other devices
- Support for both fine-grained and classic tokens

### ⚡ Real-time Sync

- Auto-refresh at configurable intervals
- Background sync with optimistic updates
- Manual refresh on demand

### 🎨 Theme Compatible

Seamlessly integrates with Obsidian's theme system, supporting both light and dark modes.

### 📱 Mobile Support

Full support for Obsidian mobile on iOS and Android with touch-optimized drag-and-drop.

### 🔍 Powerful Filtering

Filter by assignee, state, type, or search by text across titles and descriptions.

## Troubleshooting

### Connection Failed

**Error**: "Failed to connect to GitHub" or "Authentication failed"

**Solutions**:
1. Verify your token has the correct permissions:
   - Fine-grained tokens: "Projects: Read and Write"
   - Classic tokens: `project` scope (and `repo` for private projects)
2. Check that your organization name is correct (case-sensitive)
3. Verify the project number matches your project URL
4. Ensure your token hasn't expired
5. Confirm you have access to the project with your GitHub account

### Items Not Syncing

**Issue**: Changes in Obsidian don't appear on GitHub, or vice versa

**Solutions**:
1. Check the auto-refresh interval in settings
2. Manually refresh using the command or settings button
3. Open browser console (`Ctrl/Cmd+Shift+I`) and check for errors
4. Verify you have write permissions on the project
5. Check GitHub's API status: https://www.githubstatus.com

### Board Not Displaying

**Issue**: Board appears empty or doesn't load

**Solutions**:
1. Ensure your project has a **"Status"** field (single-select type)
2. Verify the project has items (issues, PRs, or drafts)
3. Check that at least some items have a status value set
4. Try refreshing the view with `Ctrl/Cmd+R`
5. Check browser console for error messages

### Drag and Drop Not Working

**Issue**: Can't move cards between columns

**Solutions**:
1. Ensure you have write permissions on the project
2. Check that your token hasn't expired
3. Verify the "Status" field is not locked or read-only
4. Try refreshing the board
5. On mobile, ensure you're using a long press to initiate drag

### Performance Issues

**Issue**: Board is slow or laggy

**Solutions**:
1. Increase auto-refresh interval (Settings → Auto-refresh interval)
2. If your project has many items (>100), consider:
   - Using GitHub's built-in filters to reduce item count
   - Closing old issues to reduce total items
3. Disable other resource-intensive plugins temporarily
4. Clear Obsidian's cache: Settings → About → Advanced → Clear cache

### Token Security Concerns

**Question**: How secure is my token?

**Answer**:
- Tokens are stored in `localStorage`, not in vault files
- Tokens are **not synced** between devices via Obsidian Sync
- Other Obsidian plugins have access to `localStorage`
- Use fine-grained tokens with minimal permissions
- Set token expiration to limit risk
- Rotate tokens periodically

## FAQ

### Can I use multiple projects?

Currently, the plugin supports one project at a time. You can switch projects by changing the organization and project number in settings.

### Does this work with personal projects?

Yes! For projects under your personal account, use your GitHub username as the "organization" name.

### Can I create new issues from Obsidian?

Not yet. This feature is planned for a future release. Currently, the plugin supports viewing and moving existing items.

### Does this work offline?

The plugin requires an internet connection to sync with GitHub. However, the last loaded state is cached and will display if you open the board offline.

### What about GitHub rate limits?

The plugin uses GitHub's GraphQL API, which has a rate limit of 5,000 points per hour. Normal usage (viewing and updating boards) uses minimal points. If you hit rate limits:
- Increase auto-refresh interval
- Reduce manual refreshes
- Check for other apps/scripts using your token

### Can I customize the columns?

Columns are automatically generated from your project's "Status" field values. To customize columns, update the Status field options in your GitHub Project settings.

### Is my data synced between devices?

The plugin data (board state) is fetched fresh from GitHub. Your token is **not synced** and must be configured separately on each device.

### Can I contribute to the project?

Absolutely! See the [Developer Guide](developer-guide.md) for information on contributing.

## Need More Help?

- **Report bugs**: [GitHub Issues](https://github.com/alexnodeland/obsidian-github-projects/issues)
- **Request features**: [GitHub Discussions](https://github.com/alexnodeland/obsidian-github-projects/discussions)
- **Ask questions**: [GitHub Discussions Q&A](https://github.com/alexnodeland/obsidian-github-projects/discussions/categories/q-a)
