#!/bin/bash
set -o errexit -o pipefail

# Installation explicite des dépendances
echo "➡️ Installing dependencies..."
npm install @nestjs/cli typeorm pg --save-exact
npm install

# Build du projet
echo "➡️ Building project..."
npm run build

# Vérification des fichiers
echo "➡️ Verifying build output..."
if [ -f "dist/src/main.js" ]; then
  echo "✅ Build successful - main.js found"
else
  echo "❌ Error: main.js not found!"
  ls -R dist/
  exit 1
fi