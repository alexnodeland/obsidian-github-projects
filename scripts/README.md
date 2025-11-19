# Development Scripts

This directory contains helper scripts for plugin development.

## Available Scripts

### `setup-dev.sh`

Initial development setup script that builds the plugin and copies files to your Obsidian vault.

**Usage**:
```bash
./scripts/setup-dev.sh /path/to/your/vault
```

**What it does**:
1. Checks if dependencies are installed (runs `npm install` if needed)
2. Builds the plugin
3. Copies `main.js`, `manifest.json`, and `styles.css` to your vault's plugin directory

**Alternative**: Use `make setup VAULT=/path/to/vault`

### `dev-watch.sh`

Continuous development script that watches for changes and auto-copies files to your vault.

**Usage**:
```bash
./scripts/dev-watch.sh /path/to/your/vault
```

**What it does**:
1. Performs an initial build
2. Copies files to your vault
3. Watches for changes in `main.js`, `manifest.json`, and `styles.css`
4. Auto-copies files when changes are detected

**Alternative**: Use `make dev VAULT=/path/to/vault`

**Note**: Requires either `inotifywait` (Linux) or `fswatch` (macOS) for file watching. Falls back to 2-second polling if neither is available.

## Recommended Workflow

For the best development experience, use the Makefile:

```bash
# Initial setup
make setup VAULT=/path/to/vault

# Start development mode (build + watch + auto-copy)
make dev VAULT=/path/to/vault
```

## Troubleshooting

### Script Permission Errors

If you get permission errors, make the scripts executable:

```bash
chmod +x scripts/*.sh
```

### Vault Not Found

Ensure you're providing the full path to your Obsidian vault directory (the folder containing the `.obsidian` directory).

### File Watching Not Working (macOS)

Install `fswatch`:

```bash
brew install fswatch
```

### File Watching Not Working (Linux)

Install `inotify-tools`:

```bash
# Debian/Ubuntu
sudo apt-get install inotify-tools

# Fedora
sudo dnf install inotify-tools

# Arch
sudo pacman -S inotify-tools
```

## Advanced Usage

### Environment Variables

Both scripts support environment variables:

```bash
# Set vault path as environment variable
export OBSIDIAN_VAULT=/path/to/vault
./scripts/setup-dev.sh $OBSIDIAN_VAULT
```

### Custom Plugin Directory

If you want to use a custom plugin directory name (not `github-projects`), you'll need to modify the `PLUGIN_DIR` variable in the scripts.

## See Also

- [Developer Guide](../docs/developer-guide.md) - Complete development documentation
- [Makefile](../Makefile) - All available make commands
- [Contributing](../CONTRIBUTORS.md) - Contribution guidelines
