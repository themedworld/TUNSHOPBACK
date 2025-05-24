#!/bin/bash
set -o errexit -o pipefail

# Force l'installation des dépendances dev
npm install --include=dev

# Build explicite
npm run build

# Vérification stricte
if [ ! -f "dist/src/main.js" ]; then
  echo "❌ ERREUR: dist/src/main.js manquant!"
  echo "Structure du dossier:"
  ls -R dist/
  exit 1
fi