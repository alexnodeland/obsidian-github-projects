.PHONY: help setup install build dev test lint clean coverage watch release

# Default target
.DEFAULT_GOAL := help

# Variables
VAULT ?= $(error VAULT is not set. Usage: make dev VAULT=/path/to/vault)
NODE_BIN := ./node_modules/.bin
PLUGIN_NAME := github-projects

# Colors for output
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

##@ General

help: ## Display this help message
	@echo "$(CYAN)GitHub Projects for Obsidian - Makefile$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "Usage:\n  make $(CYAN)<target>$(NC)\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(CYAN)%-15s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(YELLOW)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Setup & Installation

setup: install build ## Initial setup: install dependencies and build
	@echo "$(GREEN)✓ Setup complete!$(NC)"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Run: make dev VAULT=/path/to/your/vault"
	@echo "  2. Open Obsidian and enable the plugin"
	@echo "  3. Configure your GitHub token in settings"

install: ## Install dependencies
	@echo "$(CYAN)Installing dependencies...$(NC)"
	@npm install
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

##@ Development

dev: build copy-to-vault watch ## Development mode: build, copy to vault, and watch for changes
	@echo "$(GREEN)✓ Development mode started$(NC)"

watch: ## Watch for changes and auto-rebuild
	@echo "$(CYAN)Watching for changes... (Press Ctrl+C to stop)$(NC)"
	@./scripts/dev-watch.sh $(VAULT)

build: ## Build the plugin (production)
	@echo "$(CYAN)Building plugin...$(NC)"
	@npm run build
	@if [ -f main.js ]; then \
		echo "$(GREEN)✓ Build complete$(NC) - main.js ($(shell wc -c < main.js | tr -d ' ') bytes)"; \
	else \
		echo "$(RED)✗ Build failed - main.js not found$(NC)"; \
		exit 1; \
	fi

build-dev: ## Build the plugin (development with source maps)
	@echo "$(CYAN)Building plugin (development mode)...$(NC)"
	@npm run dev
	@echo "$(GREEN)✓ Development build complete$(NC)"

copy-to-vault: build ## Copy plugin files to vault
ifndef VAULT
	@echo "$(RED)Error: VAULT not specified$(NC)"
	@echo "Usage: make copy-to-vault VAULT=/path/to/vault"
	@exit 1
endif
	@echo "$(CYAN)Copying files to vault...$(NC)"
	@mkdir -p "$(VAULT)/.obsidian/plugins/$(PLUGIN_NAME)"
	@cp main.js manifest.json styles.css "$(VAULT)/.obsidian/plugins/$(PLUGIN_NAME)/"
	@echo "$(GREEN)✓ Files copied to$(NC) $(VAULT)/.obsidian/plugins/$(PLUGIN_NAME)"
	@echo "$(YELLOW)Reload Obsidian (Ctrl/Cmd+R) to see changes$(NC)"

link-vault: ## Create symlink to vault (alternative to copying)
ifndef VAULT
	@echo "$(RED)Error: VAULT not specified$(NC)"
	@echo "Usage: make link-vault VAULT=/path/to/vault"
	@exit 1
endif
	@echo "$(CYAN)Creating symlink to vault...$(NC)"
	@mkdir -p "$(VAULT)/.obsidian/plugins"
	@ln -sf "$(PWD)" "$(VAULT)/.obsidian/plugins/$(PLUGIN_NAME)"
	@echo "$(GREEN)✓ Symlink created$(NC)"

##@ Testing & Quality

test: ## Run tests
	@echo "$(CYAN)Running tests...$(NC)"
	@npm test
	@echo "$(GREEN)✓ Tests passed$(NC)"

test-watch: ## Run tests in watch mode
	@echo "$(CYAN)Running tests in watch mode...$(NC)"
	@npm run test:watch

coverage: ## Generate code coverage report
	@echo "$(CYAN)Generating coverage report...$(NC)"
	@npm test -- --coverage
	@echo "$(GREEN)✓ Coverage report generated in coverage/$(NC)"
	@echo "Open coverage/lcov-report/index.html in browser to view report"

lint: ## Run linter
	@echo "$(CYAN)Running linter...$(NC)"
	@npm run lint
	@echo "$(GREEN)✓ Lint passed$(NC)"

typecheck: ## Run TypeScript type checking
	@echo "$(CYAN)Running type check...$(NC)"
	@npx tsc --noEmit --skipLibCheck
	@echo "$(GREEN)✓ Type check passed$(NC)"

check: lint typecheck test ## Run all checks (lint, typecheck, test)
	@echo "$(GREEN)✓ All checks passed!$(NC)"

format: ## Format code with prettier (if configured)
	@echo "$(CYAN)Formatting code...$(NC)"
	@if [ -f "$(NODE_BIN)/prettier" ]; then \
		$(NODE_BIN)/prettier --write "src/**/*.{ts,tsx,js,json}"; \
		echo "$(GREEN)✓ Code formatted$(NC)"; \
	else \
		echo "$(YELLOW)! Prettier not installed, skipping$(NC)"; \
	fi

##@ Release

release-patch: check ## Create a patch release (x.x.X)
	@echo "$(CYAN)Creating patch release...$(NC)"
	@npm version patch
	@echo "$(GREEN)✓ Patch version bumped$(NC)"
	@echo "$(YELLOW)Push tags with: git push origin main --tags$(NC)"

release-minor: check ## Create a minor release (x.X.0)
	@echo "$(CYAN)Creating minor release...$(NC)"
	@npm version minor
	@echo "$(GREEN)✓ Minor version bumped$(NC)"
	@echo "$(YELLOW)Push tags with: git push origin main --tags$(NC)"

release-major: check ## Create a major release (X.0.0)
	@echo "$(CYAN)Creating major release...$(NC)"
	@npm version major
	@echo "$(GREEN)✓ Major version bumped$(NC)"
	@echo "$(YELLOW)Push tags with: git push origin main --tags$(NC)"

changelog: ## Generate changelog
	@echo "$(CYAN)Generating changelog...$(NC)"
	@if [ -f "$(NODE_BIN)/conventional-changelog" ]; then \
		$(NODE_BIN)/conventional-changelog -p angular -i CHANGELOG.md -s; \
		echo "$(GREEN)✓ Changelog updated$(NC)"; \
	else \
		echo "$(YELLOW)! conventional-changelog not installed$(NC)"; \
		echo "Install with: npm install -D conventional-changelog-cli"; \
	fi

##@ Cleanup

clean: ## Clean build artifacts
	@echo "$(CYAN)Cleaning build artifacts...$(NC)"
	@rm -f main.js main.js.map
	@echo "$(GREEN)✓ Build artifacts cleaned$(NC)"

clean-all: clean ## Clean all generated files (including node_modules)
	@echo "$(CYAN)Cleaning all generated files...$(NC)"
	@rm -rf node_modules coverage
	@echo "$(GREEN)✓ All generated files cleaned$(NC)"

##@ Documentation

docs: ## Build documentation
	@echo "$(CYAN)Documentation already built in docs/$(NC)"
	@echo "Available docs:"
	@echo "  - docs/user-guide.md"
	@echo "  - docs/developer-guide.md"
	@echo "  - docs/architecture.md"
	@echo "  - docs/api-reference.md"

docs-serve: ## Serve documentation locally (requires Python)
	@echo "$(CYAN)Starting documentation server...$(NC)"
	@echo "$(YELLOW)Open http://localhost:8000 in your browser$(NC)"
	@cd docs && python3 -m http.server 8000

##@ Git Workflow

pr: check ## Check before creating PR
	@echo "$(GREEN)✓ Ready to create PR!$(NC)"
	@echo ""
	@echo "Checklist:"
	@echo "  [x] All tests passing"
	@echo "  [x] Linter passing"
	@echo "  [x] Type check passing"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Push your branch: git push origin <branch-name>"
	@echo "  2. Create PR on GitHub"

commit: check ## Check before committing
	@echo "$(GREEN)✓ Ready to commit!$(NC)"
	@echo ""
	@echo "Use conventional commits format:"
	@echo "  feat: new feature"
	@echo "  fix: bug fix"
	@echo "  docs: documentation"
	@echo "  refactor: code refactoring"
	@echo "  test: tests"
	@echo "  chore: build/tools"

##@ Info

info: ## Show project information
	@echo "$(CYAN)Project Information$(NC)"
	@echo ""
	@echo "Name:        $(shell jq -r '.name' package.json)"
	@echo "Version:     $(shell jq -r '.version' package.json)"
	@echo "Description: $(shell jq -r '.description' package.json)"
	@echo ""
	@echo "$(CYAN)Build Info$(NC)"
	@if [ -f main.js ]; then \
		echo "Build:       $(GREEN)✓ Built$(NC) ($(shell wc -c < main.js | tr -d ' ') bytes)"; \
	else \
		echo "Build:       $(YELLOW)Not built$(NC)"; \
	fi
	@echo ""
	@echo "$(CYAN)Dependencies$(NC)"
	@echo "Node:        $(shell node --version)"
	@echo "npm:         $(shell npm --version)"
	@echo ""
	@echo "$(CYAN)Paths$(NC)"
	@echo "Root:        $(PWD)"
ifdef VAULT
	@echo "Vault:       $(VAULT)"
endif

status: info ## Alias for info

##@ Utilities

reset: clean-all install build ## Reset project (clean and rebuild)
	@echo "$(GREEN)✓ Project reset complete$(NC)"

validate: ## Validate manifest and package.json
	@echo "$(CYAN)Validating configuration files...$(NC)"
	@echo -n "manifest.json: "
	@jq empty manifest.json && echo "$(GREEN)✓ Valid$(NC)" || echo "$(RED)✗ Invalid JSON$(NC)"
	@echo -n "package.json:  "
	@jq empty package.json && echo "$(GREEN)✓ Valid$(NC)" || echo "$(RED)✗ Invalid JSON$(NC)"
	@echo ""
	@echo -n "Version sync:  "
	@if [ "$$(jq -r '.version' package.json)" = "$$(jq -r '.version' manifest.json)" ]; then \
		echo "$(GREEN)✓ Synced ($(shell jq -r '.version' package.json))$(NC)"; \
	else \
		echo "$(RED)✗ Out of sync$(NC)"; \
		echo "  package.json:  $(shell jq -r '.version' package.json)"; \
		echo "  manifest.json: $(shell jq -r '.version' manifest.json)"; \
	fi
