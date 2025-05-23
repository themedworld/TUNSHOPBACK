#!/bin/bash
set -o errexit -o pipefail

# Installer Nest CLI globalement
echo "Installing Nest CLI..."
npm install -g @nestjs/cli

# Installer les dépendances
echo "Installing dependencies..."
npm install

# Builder le projet
echo "Building project..."
nest build

# Exécuter les migrations si nécessaire
if [ -f "dist/src/db/data-source.js" ]; then
  echo "Running migrations..."
  npx typeorm migration:run -d dist/src/db/data-source.js
else
  echo "No migrations to run"
fi

echo "Build completed successfully"