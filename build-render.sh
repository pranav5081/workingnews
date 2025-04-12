#!/bin/bash
set -e

echo "Starting simplified deployment build process..."
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install dependencies without dev dependencies (this won't install vite)
echo "Installing dependencies without dev dependencies..."
npm ci --only=production

# Install only the essential build tools explicitly
echo "Installing essential build tools..."
npm install esbuild typescript --no-save

# Create simplified static HTML file
echo "Creating simplified frontend..."
mkdir -p dist/public

cat > dist/public/index.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>News App</title>
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
    <p>To access the full app with the React frontend, please deploy with the complete build process.</p>
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

# Build the server only
echo "Building server with esbuild..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --external:connect-pg-simple --outdir=dist

echo "Build completed successfully!"
