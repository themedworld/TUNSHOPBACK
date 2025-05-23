#!/bin/bash
set -o errexit

npm install -g @nestjs/cli
npm install
npm run build