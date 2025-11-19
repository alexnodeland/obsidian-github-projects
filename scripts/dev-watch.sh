#!/bin/bash
# Script for continuous development with auto-rebuild and copy
# Part of obsidian-github-projects development tools

# Usage: ./scripts/dev-watch.sh /path/to/your/vault

if [ -z "$1" ]; then
    echo "Usage: ./scripts/dev-watch.sh /path/to/your/vault"
    echo "Example: ./scripts/dev-watch.sh ~/Documents/MyVault"
    echo ""
    echo "Or use the Makefile:"
    echo "  make dev VAULT=/path/to/your/vault"
    exit 1
fi

VAULT_PATH="$1"
PLUGIN_DIR="$VAULT_PATH/.obsidian/plugins/github-projects"
# Get the repo root directory (parent of scripts/)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Check if vault exists
if [ ! -d "$VAULT_PATH" ]; then
    echo "❌ Error: Vault directory does not exist: $VAULT_PATH"
    exit 1
fi

# Create plugin directory if needed
mkdir -p "$PLUGIN_DIR"

echo "🔄 Starting development mode..."
echo "Watching for changes and auto-copying to: $PLUGIN_DIR"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Function to copy files
copy_files() {
    cp "$REPO_DIR/main.js" "$PLUGIN_DIR/" 2>/dev/null
    cp "$REPO_DIR/manifest.json" "$PLUGIN_DIR/" 2>/dev/null
    cp "$REPO_DIR/styles.css" "$PLUGIN_DIR/" 2>/dev/null
    echo "$(date '+%H:%M:%S') - Files copied. Reload plugin in Obsidian (Ctrl/Cmd+R)"
}

# Initial build and copy
npm run build
copy_files

# Watch for changes in main.js and copy
while true; do
    inotifywait -q -e modify "$REPO_DIR/main.js" "$REPO_DIR/manifest.json" "$REPO_DIR/styles.css" 2>/dev/null || \
    fswatch -1 "$REPO_DIR/main.js" "$REPO_DIR/manifest.json" "$REPO_DIR/styles.css" 2>/dev/null || \
    sleep 2

    copy_files
done
