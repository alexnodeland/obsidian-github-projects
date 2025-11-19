# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Extensive customization options** for card and modal displays
  - Configure card title length and description truncation
  - Show/hide repository, labels, description, milestone on cards
  - Control maximum number of labels and assignees displayed
  - Show/hide PR changes, author, assignees, comments, reactions
  - Configure detail modal sections visibility (status badges, repository, labels, assignees, author, reviewers, milestone, PR changes, engagement, timeline, comments)
  - All settings applied immediately with real-time preview
  - Backwards compatible with existing settings

## [0.1.0] - 2025-01-XX

### Added
- Initial release
- Kanban board view for GitHub Projects V2
- Drag and drop functionality for moving items between columns
- GitHub Personal Access Token authentication
- Auto-refresh with configurable intervals
- Card detail modal with full item information
- Filtering by assignee, state, and type
- Search functionality across titles and descriptions
- Mobile support for iOS and Android
- Theme compatibility with Obsidian themes
- Settings tab for configuration
- Comprehensive documentation structure
- GitHub Actions CI/CD workflows
- Code coverage reporting
- Makefile for improved developer experience
- Polish UI with comprehensive improvements
- Collapsible comments panel for better UX
- Authors and milestone to global filter options
- Improved scrolling UX by removing nested scrollable elements

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

[Unreleased]: https://github.com/alexnodeland/obsidian-github-projects/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/alexnodeland/obsidian-github-projects/releases/tag/v0.1.0
