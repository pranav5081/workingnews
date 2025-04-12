import type { Express, Server } from "express";

// Simple logger function
export function log(message: string, source = "express") {
  console.log(`[${source}] ${message}`);
}

// Stub for setupVite that does nothing in production
export async function setupVite(_app: Express, _server: Server) {
  log("Production mode - Vite setup skipped", "express");
  return;
}

// Static file serving for production
export function serveStatic(_app: Express) {
  log("Production mode - Using Express static middleware instead of Vite", "express");
  return;
}
