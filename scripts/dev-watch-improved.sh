#!/bin/bash
# Improved development watch script that runs build watcher and copies files
# Part of obsidian-github-projects development tools

# Usage: ./scripts/dev-watch-improved.sh /path/to/your/vault

if [ -z "$1" ]; then
    echo "Usage: ./scripts/dev-watch-improved.sh /path/to/your/vault"
    echo "Example: ./scripts/dev-watch-improved.sh ~/Documents/MyVault"
    exit 1
fi

VAULT_PATH="$1"
PLUGIN_DIR="$VAULT_PATH/.obsidian/plugins/github-projects"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Check if vault exists
if [ ! -d "$VAULT_PATH" ]; then
    echo "❌ Error: Vault directory does not exist: $VAULT_PATH"
    exit 1
fi

# Create plugin directory if needed
mkdir -p "$PLUGIN_DIR"

echo "🔄 Starting improved development mode..."
echo "Building and copying to: $PLUGIN_DIR"
echo ""

# Function to copy files
copy_files() {
    cp "$REPO_DIR/main.js" "$PLUGIN_DIR/" 2>/dev/null && echo "✓ Copied main.js"
    cp "$REPO_DIR/manifest.json" "$PLUGIN_DIR/" 2>/dev/null && echo "✓ Copied manifest.json"
    cp "$REPO_DIR/styles.css" "$PLUGIN_DIR/" 2>/dev/null && echo "✓ Copied styles.css"
    echo "$(date '+%H:%M:%S') - Files copied to vault. Reload Obsidian (Ctrl/Cmd+R) to see changes"
    echo "---"
}

# Initial build and copy
echo "Building plugin..."
cd "$REPO_DIR"
npm run build
copy_files

# Start the dev watcher in background and monitor for file changes
echo "Starting file watcher..."
npm run dev &
NPM_PID=$!

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping file watcher..."
    kill $NPM_PID 2>/dev/null
    exit 0
}

# Set up trap to cleanup on Ctrl+C
trap cleanup SIGINT SIGTERM

echo "Watching for changes... Press Ctrl+C to stop"
echo ""

# Watch for changes in the built files and copy them
while true; do
    # Use inotifywait if available, otherwise fallback to polling
    if command -v inotifywait >/dev/null 2>&1; then
        inotifywait -q -e modify,create "$REPO_DIR/main.js" "$REPO_DIR/styles.css" 2>/dev/null
    elif command -v fswatch >/dev/null 2>&1; then
        fswatch -1 "$REPO_DIR/main.js" "$REPO_DIR/styles.css" 2>/dev/null
    else
        # Fallback to simple polling
        sleep 2
        # Check if files have been modified
        if [ "$REPO_DIR/main.js" -nt "$PLUGIN_DIR/main.js" ] || [ "$REPO_DIR/styles.css" -nt "$PLUGIN_DIR/styles.css" ]; then
            echo "Changes detected..."
        else
            continue
        fi
    fi

    # Copy files when changes detected
    copy_files
done