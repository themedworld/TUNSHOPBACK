#!/bin/bash
set -o errexit -o pipefail

# Installation des dépendances
npm install @nestjs/cli
npm install

# Builder le projet (optionnel pour le mode watch)
nest build --watch

echo "✅ Configuration prête pour le mode watch"