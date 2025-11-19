# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0-alpha] - 2025-11-19

### Added
- **Initial alpha release** with full feature set
- **Kanban Board View** - Interactive GitHub Projects V2 visualization
- **Drag and Drop** - Move items between columns with smooth interactions
- **GitHub Authentication** - Secure Personal Access Token support (Classic and Fine-grained)
- **Auto-refresh** - Configurable sync intervals (default: 5 minutes)
- **Comprehensive Customization** - Extensive settings for card and modal displays:
  - Configure card title length and description truncation
  - Show/hide repository, labels, description, milestone on cards
  - Control maximum number of labels and assignees displayed
  - Configure detail modal sections visibility
  - All settings applied immediately with real-time preview
- **Project Selector** - Easy switching between multiple projects
- **Advanced Filtering** - Filter by assignee, state, type, author, milestone
- **Search** - Full-text search across titles and descriptions
- **Card Details** - Rich detail modal with comments, timeline, and metadata
- **Mobile Support** - Full functionality on iOS and Android
- **Theme Compatibility** - Seamless integration with Obsidian themes
- **Developer Experience**:
  - Comprehensive documentation (User Guide, Developer Guide, Architecture, API Reference)
  - GitHub Actions CI/CD with automated testing
  - Code coverage reporting (80% minimum threshold)
  - Makefile for streamlined development workflow
  - TypeScript with strict type checking
  - Jest test suite with mocked Obsidian APIs
- **Performance Optimizations**:
  - API response caching to minimize requests
  - Optimistic UI updates for responsive feel
  - Virtual DOM rendering with Preact
  - Efficient GraphQL pagination handling

### Fixed
- TypeScript errors related to filter options
- Scrolling issues in card detail modal
- Edge case handling in UI components

### Security
- Secure token storage in localStorage (not synced with vault)

## Release Types

- **MAJOR** (X.0.0): Breaking changes, major new features
- **MINOR** (0.X.0): New features, backward compatible
- **PATCH** (0.0.X): Bug fixes, minor improvements

## Categories

- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements

---

[Unreleased]: https://github.com/alexnodeland/obsidian-github-projects/compare/v1.0.0-alpha...HEAD
[1.0.0-alpha]: https://github.com/alexnodeland/obsidian-github-projects/releases/tag/v1.0.0-alpha
