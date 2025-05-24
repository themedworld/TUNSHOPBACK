#!/bin/bash
set -o errexit -o pipefail

echo "➡️ Installation des dépendances..."
npm install

echo "➡️ Construction du projet..."
npm run build

echo "➡️ Vérification des fichiers générés..."
ls -l dist/ || echo "⚠️ Aucun fichier dans dist/"
ls -l dist/src/ || echo "⚠️ Aucun fichier dans dist/src/"

echo "✅ Build terminé avec succès"