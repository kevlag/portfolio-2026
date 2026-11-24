#!/bin/sh
# Prépare le dossier deploy/ : exactement ce qu'il faut envoyer sur l'hébergement OVH.
# Usage : ./build-deploy.sh   (puis envoyer le CONTENU de deploy/ par FTP/SFTP)
set -e
cd "$(dirname "$0")"
rm -rf deploy
mkdir deploy
rsync -a \
  --exclude 'deploy/' --exclude '.git' --exclude '.claude/' --exclude '.DS_Store' \
  --exclude 'images/_sources/' --exclude 'fonts/*.ttf' --exclude 'fonts/HafferSQXH-*' \
  --exclude 'ai-creation.html' --exclude 'vercel.json' --exclude '.vercelignore' \
  --exclude 'README.md' --exclude 'build-deploy.sh' --exclude '.gitignore' \
  ./ deploy/
du -sh deploy
echo "Fichiers : $(find deploy -type f | wc -l)"
