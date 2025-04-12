#!/bin/bash
set -e

echo "Building server-only deployment for Render..."
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install only production dependencies to minimize issues
echo "Installing production dependencies..."
npm ci --only=production

# Install only the specific build tools we need
echo "Installing build tools..."
npm install --no-save esbuild typescript

# Create a simplified pre-rendered index.html
echo "Creating static index.html..."
mkdir -p dist/public

cat > dist/public/index.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>News App API</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 { color: #2c3e50; }
    .notice {
      background-color: #f8f9fa;
      border-left: 4px solid #4CAF50;
      padding: 12px 24px;
      margin: 24px 0;
    }
    a { color: #3498db; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>News App API</h1>
  <div class="notice">
    <p>Welcome to the News App API service. The API endpoints are running and available.</p>
    <p>This is a simplified version of the application for Render deployment.</p>
  </div>
  <div>
    <h2>Available API Endpoints:</h2>
    <ul>
      <li><a href="/api/users">/api/users</a> - Get users</li>
      <li><a href="/api/articles">/api/articles</a> - Get articles</li>
      <li><a href="/api/articles?category=technology">/api/articles?category=technology</a> - Get articles by category</li>
    </ul>
  </div>
</body>
</html>
EOL

# Create a simplified production-safe vite.js file
echo "Creating production-safe vite.js module..."
mkdir -p temp

cat > temp/vite.js << 'EOL'
import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function log(message, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app, server) {
  log("Production mode - Vite setup skipped");
  return;
}

export function serveStatic(app) {
  const distPath = path.resolve(__dirname, "..", "public");
  log(`Serving static files from: ${distPath}`);
  
  if (!fs.existsSync(distPath)) {
    log(`WARNING: Static directory not found at ${distPath}`);
  }
  
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
EOL

# Build server without vite dependency
echo "Building server..."
npx esbuild server/index.ts --platform=node --outdir=dist --bundle --format=esm --external:express --external:vite --external:nanoid --external:connect-pg-simple --external:express-session --external:pg --external:postgres --external:drizzle-orm --external:passport --external:passport-local --alias:./vite.js=./temp/vite.js

# Move our simplified vite.js to the dist folder
cp temp/vite.js dist/vite.js

echo "Build completed!"
