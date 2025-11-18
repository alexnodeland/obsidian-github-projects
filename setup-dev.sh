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
REPO_DIR="$(pwd)"

# Check if vault exists
if [ ! -d "$VAULT_PATH" ]; then
    echo "❌ Error: Vault directory does not exist: $VAULT_PATH"
    exit 1
fi

# Create plugins directory if it doesn't exist
mkdir -p "$VAULT_PATH/.obsidian/plugins"

# Create plugin directory
mkdir -p "$PLUGIN_DIR"

# Build the plugin first
echo "Building plugin..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Copy the necessary files
echo "Copying plugin files to vault..."
cp "$REPO_DIR/main.js" "$PLUGIN_DIR/"
cp "$REPO_DIR/manifest.json" "$PLUGIN_DIR/"
cp "$REPO_DIR/styles.css" "$PLUGIN_DIR/"

echo ""
echo "✅ Setup complete!"
echo ""
echo "Plugin installed at: $PLUGIN_DIR"
echo ""
echo "Files copied:"
echo "  - main.js"
echo "  - manifest.json"
echo "  - styles.css"
echo ""
echo "Next steps:"
echo "1. Open your vault in Obsidian"
echo "2. Go to Settings → Community Plugins"
echo "3. Disable Safe Mode (if not already)"
echo "4. Enable 'GitHub Projects' in the plugin list"
echo "5. Configure your GitHub token in Settings → GitHub Projects"
echo ""
echo "📝 Development workflow:"
echo "  - Make changes to the code"
echo "  - Run: npm run build"
echo "  - Run: ./setup-dev.sh $VAULT_PATH (to copy updated files)"
echo "  - In Obsidian: Ctrl/Cmd+R to reload the plugin"
