
import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from 'url';
import { registerRoutes } from "./routes.js";
import { setupAuth } from "./auth.js";
import { log } from "./vite.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const port = process.env.PORT || 3000;

// Setup session
const sessionConfig = {
  secret: process.env.SESSION_SECRET || "default-secret-for-dev",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
};

app.use(session(sessionConfig));
app.use(express.json());

// Setup authentication
setupAuth(app);

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.resolve(__dirname, "../public")));
}

// Register API routes
const server = await registerRoutes(app);

// Serve index.html for any other GET request in production
if (process.env.NODE_ENV === "production") {
  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(__dirname, "../public/index.html"));
  });
}

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

server.listen(port, "0.0.0.0", () => {
  log(`Server running at http://localhost:${port}`, "express");
});

