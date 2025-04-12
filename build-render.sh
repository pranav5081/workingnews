#!/bin/bash
set -e

echo "Starting build process for Render deployment"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install dependencies
echo "Installing dependencies..."
npm ci

# Install Vite globally
echo "Installing Vite globally..."
npm install vite@5.4.14 -g

# Copy the simplified vite config
echo "Using simplified Vite config for Render..."
cp vite.config.render.js vite.config.js

# Build the client
echo "Building client with Vite..."
vite build

# Build the server
echo "Building server with esbuild..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --external:connect-pg-simple --outdir=dist

echo "Build completed successfully!"
