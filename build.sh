#!/bin/bash
set -e

# Print Node.js version for debugging
echo "Using Node.js version:"
node -v

# Install dependencies with explicit vite installation
npm ci
npm install vite@5.4.14 -g

# Create a simpler vite.config.js that will work better with Render
cat > vite.config.js << 'EOL'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
});
EOL

# Run the vite build first
echo "Running Vite build..."
vite build

# Then run the esbuild for the server
echo "Running ESBuild for server..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --external:connect-pg-simple --outdir=dist

echo "Build complete!"
