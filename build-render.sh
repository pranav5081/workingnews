#!/bin/bash
set -e

echo "Starting production build process..."
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install all dependencies for the build
echo "Installing dependencies..."
npm ci

# Use the production versions of the server files
echo "Setting up production server files..."
cp server/index.prod.ts server/index.prod-temp.ts
cp server/vite.prod.ts server/vite.prod-temp.ts

# Build the client
echo "Building client with Vite..."
npx vite build

# Modify the imports in the production server file
echo "Preparing server files for production..."
# Replace import to use the production vite file
sed 's/import { log } from ".\/vite.js";/import { log } from ".\/vite.prod.js";/' server/index.prod-temp.ts > server/index.for-prod.ts

# Build the server with the modified files
echo "Building server with esbuild..."
npx esbuild server/index.for-prod.ts --platform=node --packages=external --bundle --format=esm --external:connect-pg-simple --outfile=dist/index.js
npx esbuild server/vite.prod-temp.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/vite.prod.js

# Clean up temp files
echo "Cleaning up temporary files..."
rm server/index.prod-temp.ts server/vite.prod-temp.ts server/index.for-prod.ts

echo "Build completed successfully!"
