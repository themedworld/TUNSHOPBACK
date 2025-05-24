#!/bin/bash
set -o errexit -o pipefail

# Installation explicite du CLI NestJS en local
echo "Installing NestJS CLI locally..."
npm install @nestjs/cli

# Installation des dépendances
echo "Installing dependencies..."
npm install --legacy-peer-deps  # Ignore les conflits de peer dependencies

# Build du projet
echo "Building project..."
npx nest build

# Vérification des fichiers générés
echo "Verifying build output..."
ls -l dist/

echo "✅ Build completed successfully"