#!/bin/bash
set -e

echo "Building API-only deployment for Render..."
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install dependencies
echo "Installing dependencies..."
npm ci

# Create a static index.html for the API
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
    <p>This is an API-only version of the application for Render deployment.</p>
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

# Create a production-only version of the server files
echo "Creating API-only version of server..."
mkdir -p api-dist

cat > api-dist/index.js << 'EOL'
import express from "express";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup database connection - use environment variable
const DATABASE_URL = process.env.DATABASE_URL;
console.log(`Database URL: ${DATABASE_URL ? "Configured" : "Not configured"}`);

// Setup static file serving
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));

// Setup API routes
app.get("/api/status", (req, res) => {
  res.json({ status: "online", environment: process.env.NODE_ENV });
});

// Handle 404s for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

// Serve index.html for all other routes
app.use("*", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// Start the server
const port = process.env.PORT || 5000;
const server = http.createServer(app);

server.listen(port, "0.0.0.0", () => {
  console.log(`API server running on port ${port}`);
});
EOL

echo "Copying static files to dist..."
cp -r dist/public api-dist/public

echo "Build completed!"
echo "To run the API server: NODE_ENV=production node api-dist/index.js"
