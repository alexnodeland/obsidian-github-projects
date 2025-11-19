# GitHub Projects for Obsidian

[![CI](https://github.com/alexnodeland/obsidian-github-projects/actions/workflows/ci.yml/badge.svg)](https://github.com/alexnodeland/obsidian-github-projects/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/alexnodeland/obsidian-github-projects/branch/main/graph/badge.svg)](https://codecov.io/gh/alexnodeland/obsidian-github-projects)
[![Release](https://img.shields.io/github/v/release/alexnodeland/obsidian-github-projects)](https://github.com/alexnodeland/obsidian-github-projects/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=downloads&query=%24%5B%22github-projects%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)](https://obsidian.md/plugins?id=github-projects)

Manage GitHub Projects V2 with Kanban boards directly in Obsidian.

---

## ✨ Features

- 📋 **Kanban Board View** - Visualize your GitHub Projects V2 as interactive Kanban boards
- 🔄 **Drag & Drop** - Move items between columns with smooth drag-and-drop interactions
- 🔐 **Secure Authentication** - Personal Access Token stored in localStorage (not synced with vault)
- ⚡ **Real-time Sync** - Auto-refresh project data from GitHub at configurable intervals
- 🎨 **Theme Compatible** - Seamlessly integrates with Obsidian themes (light & dark mode)
- 📱 **Mobile Support** - Works on desktop and mobile (iOS/Android)
- 🔍 **Powerful Filtering** - Filter by assignee, state, type, or search across titles and descriptions
- 💬 **Card Details** - Click any card to view full details, comments, and metadata

## 📸 Screenshots

<!-- TODO: Add screenshots -->

## 📦 Installation

### From Obsidian Community Plugins (Recommended)

1. Open **Settings** in Obsidian
2. Navigate to **Community Plugins** and disable **Safe Mode**
3. Click **Browse** and search for **"GitHub Projects"**
4. Click **Install**, then **Enable**

### Manual Installation

1. Download the latest release from [GitHub releases](https://github.com/alexnodeland/obsidian-github-projects/releases)
2. Extract `main.js`, `manifest.json`, and `styles.css` to `{VaultFolder}/.obsidian/plugins/github-projects/`
3. Reload Obsidian
4. Enable the plugin in **Settings → Community Plugins**

## 🚀 Quick Start

### 1. Create a GitHub Personal Access Token

**For Fine-Grained Tokens (Recommended)**:
1. Go to [GitHub Settings → Personal access tokens → Fine-grained tokens](https://github.com/settings/tokens?type=beta)
2. Click **"Generate new token"**
3. Grant **"Projects: Read and Write"** permission
4. Copy the token (starts with `github_pat_`)

**For Classic Tokens**:
1. Go to [GitHub Settings → Personal access tokens](https://github.com/settings/tokens)
2. Click **"Generate new token (classic)"**
3. Select the **`project`** scope
4. Copy the token (starts with `ghp_`)

### 2. Configure the Plugin

1. Open **Obsidian Settings → GitHub Projects**
2. Paste your token
3. Enter your **organization name** (e.g., `my-org`)
4. Enter your **project number** (from URL: `github.com/orgs/my-org/projects/5` → `5`)

### 3. Open Your Board

- Click the dashboard icon (📋) in the ribbon, or
- Use command palette: **"GitHub Projects: Open Project Board"**

## 📖 Documentation

- **[User Guide](docs/user-guide.md)** - Installation, setup, and usage instructions
- **[Developer Guide](docs/developer-guide.md)** - Contributing and development setup
- **[Architecture](docs/architecture.md)** - Technical design and architecture
- **[API Reference](docs/api-reference.md)** - Plugin API documentation

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Obsidian installed

### Quick Setup

```bash
# Clone the repository
git clone https://github.com/alexnodeland/obsidian-github-projects.git
cd obsidian-github-projects

# Install dependencies
npm install

# Build the plugin
npm run build

# Run tests
npm test

# Start development mode (auto-rebuild and copy to vault)
make dev VAULT=/path/to/your/vault
```

### Available Commands

```bash
# Development
make dev VAULT=/path/to/vault   # Start development mode
make build                       # Production build
make test                        # Run tests
make test:coverage               # Run tests with coverage

# Quality Checks
make lint                        # Run linter
make typecheck                   # Type checking
make check                       # Run all checks (lint + typecheck + test)

# Utilities
make clean                       # Clean build artifacts
make help                        # Show all available commands
```

See the [Developer Guide](docs/developer-guide.md) for detailed instructions.

## 🏗️ Architecture

The plugin is built with:
- **TypeScript** - Type-safe code
- **Preact** - Lightweight React alternative (3KB)
- **SortableJS** - Smooth drag-and-drop
- **GitHub GraphQL API** - Projects V2 integration
- **Obsidian Plugin API** - Native Obsidian integration

Key architectural decisions:
- **Event-driven state management** for reactive UI
- **Optimistic updates** for responsive user experience
- **Secure token storage** in localStorage (not vault files)
- **Virtual DOM rendering** for performance

Learn more in the [Architecture documentation](docs/architecture.md).

## 🧪 Testing

We maintain high test coverage and code quality:

```bash
npm test                  # Run tests
npm run test:watch        # Watch mode
npm run test:coverage     # Generate coverage report
```

Coverage reports are available on [Codecov](https://codecov.io/gh/alexnodeland/obsidian-github-projects).

## 🤝 Contributing

Contributions are welcome! We appreciate:

- 🐛 Bug reports
- ✨ Feature requests
- 📖 Documentation improvements
- 💻 Code contributions
- 🎨 UI/UX enhancements

Please read our [Contributing Guide](CONTRIBUTORS.md) and [Developer Guide](docs/developer-guide.md) before submitting PRs.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with tests
4. Run checks: `make check`
5. Commit: `git commit -m "feat: add amazing feature"`
6. Push and create a PR

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history and changes.

## 🔒 Security

- Tokens are stored in localStorage (not in vault files)
- Tokens are **not synced** via Obsidian Sync
- Use fine-grained tokens with minimal permissions
- Set token expiration for additional security

See the [User Guide](docs/user-guide.md#token-security-concerns) for more details.

## ❓ FAQ

**Q: Can I use multiple projects?**
A: Currently, one project at a time. Switch projects by changing settings.

**Q: Does this work with personal projects?**
A: Yes! Use your GitHub username as the organization name.

**Q: Can I create new issues from Obsidian?**
A: Not yet. This feature is planned for a future release.

**Q: What about rate limits?**
A: The plugin uses GitHub's GraphQL API (5,000 points/hour). Normal usage stays well within limits.

See the full [FAQ in the User Guide](docs/user-guide.md#faq).

## 🙏 Acknowledgments

- **[Obsidian](https://obsidian.md/)** - For creating an amazing platform
- **[obsidian-kanban](https://github.com/mgmeyers/obsidian-kanban)** - Inspiration for board UI
- **[Preact](https://preactjs.com/)** - Lightweight UI framework
- **[SortableJS](https://github.com/SortableJS/Sortable)** - Drag-and-drop functionality

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💬 Support

- **Documentation**: [docs/](docs/)
- **Bug Reports**: [GitHub Issues](https://github.com/alexnodeland/obsidian-github-projects/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/alexnodeland/obsidian-github-projects/discussions)
- **Questions**: [GitHub Discussions Q&A](https://github.com/alexnodeland/obsidian-github-projects/discussions/categories/q-a)

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

Made with ❤️ for the Obsidian community

[Report Bug](https://github.com/alexnodeland/obsidian-github-projects/issues) · [Request Feature](https://github.com/alexnodeland/obsidian-github-projects/discussions) · [Documentation](docs/)

</div>
