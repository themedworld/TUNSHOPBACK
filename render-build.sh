#!/bin/bash
set -o errexit -o pipefail

# Installer Nest CLI et TypeORM en local (pas en global)
echo "Installing dependencies..."
npm install -g @nestjs/cli
npm install typeorm@0.3.x pg --save-exact  # Version compatible avec NestJS

# Builder le projet
echo "Building project..."
npm run build

# Exécuter les migrations via le npx local
if [ -f "dist/src/db/data-source.js" ]; then
  echo "Running migrations..."
  npx typeorm-ts-node-commonjs migration:run -d dist/src/db/data-source.js
else
  echo "No migrations found at dist/src/db/data-source.js"
fi

echo "Build completed successfully"