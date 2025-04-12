import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertArticleSchema, insertBookmarkSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Check if user is authenticated
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Check if user is admin
function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user && req.user.isAdmin) {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Get all articles (with optional category filter)
  app.get("/api/articles", async (req, res) => {
    const category = req.query.category as string | undefined;
    const articles = await storage.getArticles({ 
      category,
      status: "published" // Only return published articles
    });
    res.json(articles);
  });

  // Get single article by ID
  app.get("/api/articles/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid article ID" });
    }
    
    const article = await storage.getArticle(id);
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }
    
    // Only return published articles unless user is admin
    if (article.status !== "published" && (!req.isAuthenticated() || !req.user || !req.user.isAdmin)) {
      return res.status(404).json({ message: "Article not found" });
    }
    
    res.json(article);
  });

  // Admin routes for managing articles
  app.get("/api/admin/articles", isAdmin, async (req, res) => {
    const status = req.query.status as string | undefined;
    const category = req.query.category as string | undefined;
    
    const articles = await storage.getArticles({
      status,
      category
    });
    
    res.json(articles);
  });

  app.post("/api/admin/articles", isAdmin, async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const articleData = insertArticleSchema.parse(req.body);
      
      // Set the author to the current user
      articleData.authorId = req.user.id;
      
      const article = await storage.createArticle(articleData);
      res.status(201).json(article);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });

  app.put("/api/admin/articles/:id", isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid article ID" });
      }
      
      const article = await storage.getArticle(id);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      const articleData = insertArticleSchema.partial().parse(req.body);
      const updatedArticle = await storage.updateArticle(id, articleData);
      
      res.json(updatedArticle);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });

  app.delete("/api/admin/articles/:id", isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid article ID" });
    }
    
    const article = await storage.getArticle(id);
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }
    
    const success = await storage.deleteArticle(id);
    if (success) {
      res.sendStatus(204);
    } else {
      res.status(500).json({ message: "Failed to delete article" });
    }
  });
  
  // Admin route for getting all users
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      // Get all users from storage
      const users = await storage.getUsers();
      
      // Remove password from each user object before sending
      const safeUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  // Bookmark routes
  app.get("/api/bookmarks", isAuthenticated, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const bookmarks = await storage.getBookmarksByUser(req.user.id);
    res.json(bookmarks);
  });

  app.post("/api/bookmarks", isAuthenticated, async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const bookmarkData = insertBookmarkSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      // Check if article exists
      const article = await storage.getArticle(bookmarkData.articleId);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      const bookmark = await storage.createBookmark(bookmarkData);
      res.status(201).json(bookmark);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });

  app.delete("/api/bookmarks/:articleId", isAuthenticated, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const articleId = parseInt(req.params.articleId);
    if (isNaN(articleId)) {
      return res.status(400).json({ message: "Invalid article ID" });
    }
    
    const success = await storage.deleteBookmark(req.user.id, articleId);
    if (success) {
      res.sendStatus(204);
    } else {
      res.status(404).json({ message: "Bookmark not found" });
    }
  });

  // Check if article is bookmarked by user
  app.get("/api/bookmarks/:articleId", isAuthenticated, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const articleId = parseInt(req.params.articleId);
    if (isNaN(articleId)) {
      return res.status(400).json({ message: "Invalid article ID" });
    }
    
    const bookmark = await storage.getBookmark(req.user.id, articleId);
    res.json({ bookmarked: !!bookmark });
  });

  const httpServer = createServer(app);
  return httpServer;
}
