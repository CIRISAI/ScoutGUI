#!/bin/bash

# Setup script to install git hooks

echo "Setting up git hooks..."

# Make hooks executable
chmod +x .githooks/pre-commit

# Configure git to use .githooks directory
git config core.hooksPath .githooks

echo "✅ Git hooks installed successfully!"
echo ""
echo "Pre-commit hook will now run type checking, tests, and build validation before each commit."
