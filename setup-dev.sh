#!/bin/bash
# Script to set up local development in Obsidian

# Usage: ./setup-dev.sh /path/to/your/vault

if [ -z "$1" ]; then
    echo "Usage: ./setup-dev.sh /path/to/your/vault"
    echo "Example: ./setup-dev.sh ~/Documents/MyVault"
    exit 1
fi

VAULT_PATH="$1"
PLUGIN_DIR="$VAULT_PATH/.obsidian/plugins/github-projects"

# Create plugins directory if it doesn't exist
mkdir -p "$VAULT_PATH/.obsidian/plugins"

# Remove existing plugin directory if it exists
if [ -d "$PLUGIN_DIR" ]; then
    echo "Removing existing plugin directory..."
    rm -rf "$PLUGIN_DIR"
fi

# Create symlink
echo "Creating symlink to plugin directory..."
ln -s "$(pwd)" "$PLUGIN_DIR"

# Build the plugin
echo "Building plugin..."
npm run build

echo "✅ Setup complete!"
echo ""
echo "Files linked to: $PLUGIN_DIR"
echo ""
echo "Next steps:"
echo "1. Open your vault in Obsidian"
echo "2. Go to Settings → Community Plugins"
echo "3. Disable Safe Mode (if not already)"
echo "4. Enable 'GitHub Projects' in the plugin list"
echo "5. Configure your GitHub token in Settings → GitHub Projects"
