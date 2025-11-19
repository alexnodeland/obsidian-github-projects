# Developer Guide

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Building](#building)
- [Contributing](#contributing)
- [Release Process](#release-process)

## Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js** 18 or higher ([Download](https://nodejs.org/))
- **npm** 9 or higher (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **Obsidian** installed ([Download](https://obsidian.md/))
- A test vault for development

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/obsidian-github-projects.git
cd obsidian-github-projects
```

3. Add the upstream remote:

```bash
git remote add upstream https://github.com/alexnodeland/obsidian-github-projects.git
```

## Development Setup

### Quick Setup with Make

```bash
# Install dependencies and set up development environment
make setup VAULT=/path/to/your/vault

# Start development with auto-rebuild
make dev VAULT=/path/to/your/vault
```

### Manual Setup

1. **Install dependencies**:

```bash
npm install
```

2. **Build the plugin**:

```bash
npm run build
```

3. **Link to your vault**:

```bash
./setup-dev.sh /path/to/your/vault
```

Or manually copy files:

```bash
mkdir -p /path/to/vault/.obsidian/plugins/github-projects
cp main.js manifest.json styles.css /path/to/vault/.obsidian/plugins/github-projects/
```

4. **Enable the plugin**:
   - Open Obsidian
   - Go to Settings → Community Plugins
   - Disable Safe Mode if enabled
   - Enable "GitHub Projects"

## Development Workflow

### Watch Mode for Development

Use the watch mode for continuous development:

```bash
# Using Make (recommended)
make dev VAULT=/path/to/your/vault

# Or using the script directly
./dev-watch.sh /path/to/your/vault
```

This will:
- Watch for file changes
- Automatically rebuild on changes
- Copy files to your vault
- Show notifications when ready to reload

After each rebuild:
1. Press `Ctrl/Cmd+R` in Obsidian to reload the plugin
2. Test your changes

### Making Changes

1. **Create a feature branch**:

```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes**

3. **Test your changes**:

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linter
npm run lint

# Type check
npm run build
```

4. **Commit your changes**:

```bash
git add .
git commit -m "feat: add awesome new feature"
```

Follow [Conventional Commits](https://www.conventionalcommits.org/) format:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build/tooling changes

5. **Push and create PR**:

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Project Structure

```
obsidian-github-projects/
├── .github/
│   └── workflows/          # GitHub Actions CI/CD
├── docs/                   # Documentation
├── src/
│   ├── api/               # GitHub API client
│   │   ├── client.ts      # GraphQL client
│   │   └── queries.ts     # GraphQL queries
│   ├── state/             # State management
│   │   ├── ProjectState.ts    # Project state
│   │   └── types.ts           # Type definitions
│   ├── utils/             # Utility functions
│   │   ├── github.ts      # GitHub helpers
│   │   └── storage.ts     # Storage helpers
│   ├── views/             # UI components
│   │   ├── components/    # Reusable components
│   │   │   ├── Card.tsx
│   │   │   ├── Column.tsx
│   │   │   └── DetailModal.tsx
│   │   └── ProjectBoardView.tsx
│   ├── __tests__/         # Unit tests
│   ├── __mocks__/         # Test mocks
│   ├── main.tsx           # Plugin entry point
│   └── settings.ts        # Settings tab
├── styles.css             # Plugin styles
├── manifest.json          # Plugin manifest
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── jest.config.js         # Jest config
├── esbuild.config.mjs     # Build config
└── Makefile              # Development tasks
```

### Key Files

- **`src/main.tsx`**: Plugin entry point, registers views and commands
- **`src/settings.ts`**: Settings tab implementation
- **`src/api/client.ts`**: GitHub GraphQL API client
- **`src/state/ProjectState.ts`**: Centralized state management
- **`src/views/ProjectBoardView.tsx`**: Main board view

## Code Standards

### TypeScript

- Use **strict mode** TypeScript
- Define interfaces for all data structures
- Avoid `any` types - use `unknown` and type guards
- Use async/await for asynchronous code

### Naming Conventions

- **PascalCase**: Classes, interfaces, types, components
- **camelCase**: Variables, functions, methods
- **UPPER_SNAKE_CASE**: Constants
- **kebab-case**: CSS classes, file names (when not components)

### Code Style

We use ESLint for code quality. Run before committing:

```bash
npm run lint
```

Key rules:
- Use **2 spaces** for indentation
- Use **single quotes** for strings
- Add **semicolons** at statement ends
- Max line length: **100 characters**
- Use **template literals** for string interpolation

### Component Guidelines

**Preact Components**:
- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use TypeScript for prop types

Example:

```typescript
interface CardProps {
  item: ProjectItem;
  onMove: (itemId: string, statusId: string) => void;
}

export function Card({ item, onMove }: CardProps) {
  // Component implementation
}
```

### State Management

- Use Obsidian's `Events` for event-driven state
- Keep state immutable - create new objects for updates
- Use the `ProjectState` class for centralized state
- Emit events for state changes

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- Card.test.tsx
```

### Writing Tests

Place tests in `src/__tests__/` directory:

```typescript
import { render, screen } from '@testing-library/preact';
import { Card } from '../views/components/Card';

describe('Card', () => {
  it('renders card title', () => {
    const item = { id: '1', title: 'Test Issue', content: '' };
    render(<Card item={item} onMove={jest.fn()} />);

    expect(screen.getByText('Test Issue')).toBeInTheDocument();
  });
});
```

### Test Coverage

We aim for **>80% code coverage**. Check coverage:

```bash
npm test -- --coverage
```

Coverage reports are generated in `coverage/` directory.

## Building

### Development Build

```bash
npm run dev
```

This creates an unminified build with source maps for debugging.

### Production Build

```bash
npm run build
```

This creates an optimized, minified build without source maps.

### Build Output

The build process generates:
- `main.js` - Bundled plugin code
- `main.js.map` - Source map (dev build only)

## Contributing

### Pull Request Process

1. **Ensure tests pass**:
   ```bash
   npm test
   npm run lint
   npm run build
   ```

2. **Update documentation** if needed

3. **Add tests** for new features

4. **Follow commit conventions** (Conventional Commits)

5. **Create PR** with clear description:
   - What changes were made
   - Why the changes were needed
   - How to test the changes

6. **Respond to review feedback**

### Code Review Guidelines

When reviewing PRs:
- Check code quality and style
- Verify tests are included and passing
- Test functionality manually
- Suggest improvements constructively
- Approve when ready to merge

## Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### Creating a Release

1. **Update version** in `package.json` and `manifest.json`:

```bash
npm version patch  # or minor, or major
```

2. **Update CHANGELOG.md** with release notes

3. **Commit version bump**:

```bash
git add .
git commit -m "chore: bump version to X.Y.Z"
```

4. **Create and push tag**:

```bash
git tag X.Y.Z
git push origin main --tags
```

5. **GitHub Actions** will automatically:
   - Run tests
   - Build the plugin
   - Create a GitHub release
   - Upload release artifacts

### Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in manifest.json and package.json
- [ ] Tag created and pushed
- [ ] GitHub release created successfully
- [ ] Community plugin submission updated (if applicable)

## Development Tools

### Useful Make Commands

```bash
make setup VAULT=/path    # Initial setup
make dev VAULT=/path      # Development mode
make build                # Production build
make test                 # Run tests
make lint                 # Run linter
make clean                # Clean build artifacts
make coverage             # Generate coverage report
```

### Debugging

**Browser DevTools**:
1. Open DevTools: `Ctrl/Cmd+Shift+I`
2. Check Console for errors
3. Use debugger statements in code
4. Inspect network requests

**Source Maps**:
Development builds include source maps for debugging TypeScript in DevTools.

### Obsidian API Documentation

- [Official API Docs](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- [API Reference](https://github.com/obsidianmd/obsidian-api)
- [Sample Plugin](https://github.com/obsidianmd/obsidian-sample-plugin)

## Getting Help

- **Questions**: Open a [GitHub Discussion](https://github.com/alexnodeland/obsidian-github-projects/discussions)
- **Bugs**: Open an [Issue](https://github.com/alexnodeland/obsidian-github-projects/issues)
- **Ideas**: Open a [Feature Request](https://github.com/alexnodeland/obsidian-github-projects/issues/new)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
