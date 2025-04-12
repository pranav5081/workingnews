import { users, articles, bookmarks, type User, type InsertUser, type Article, type InsertArticle, type Bookmark, type InsertBookmark } from "@shared/schema";
import session, { Store } from "express-session";
import createMemoryStore from "memorystore";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  
  // Article methods
  getArticles(filter?: { category?: string, status?: string }): Promise<Article[]>;
  getArticle(id: number): Promise<Article | undefined>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: number, article: Partial<InsertArticle>): Promise<Article | undefined>;
  deleteArticle(id: number): Promise<boolean>;
  
  // Bookmark methods
  getBookmarks(userId: number): Promise<Bookmark[]>;
  getBookmarksByUser(userId: number): Promise<{ bookmark: Bookmark, article: Article }[]>;
  getBookmark(userId: number, articleId: number): Promise<Bookmark | undefined>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  deleteBookmark(userId: number, articleId: number): Promise<boolean>;
  
  // Session store
  sessionStore: Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private articles: Map<number, Article>;
  private bookmarks: Map<number, Bookmark>;
  sessionStore: Store;
  
  private userIdCounter: number;
  private articleIdCounter: number;
  private bookmarkIdCounter: number;

  constructor() {
    this.users = new Map();
    this.articles = new Map();
    this.bookmarks = new Map();
    this.userIdCounter = 1;
    this.articleIdCounter = 1;
    this.bookmarkIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Prune expired entries every 24h
    });
    
    // Create admin user with password that will be hashed during login
    this.createUser({
      username: "admin@example.com",
      password: "adminpassword",
      firstName: "Admin",
      lastName: "User"
    }).then(user => {
      // Set admin user manually
      this.users.set(user.id, {
        ...user,
        isAdmin: true,
        createdAt: new Date()
      });
      
      // Add some sample articles
      this.createArticle({
        title: "Electric Vehicle Sales Surge as New Incentives Take Effect",
        content: "<p>Global sales of electric vehicles have increased by 43% year-over-year as government incentives and improved technology drive consumer adoption. Industry analysts predict this trend will continue as more manufacturers commit to electric vehicle production.</p><p>The surge comes as several major economies introduced new tax incentives for electric vehicle purchases, making the switch from traditional combustion engines more financially attractive for consumers.</p>",
        summary: "Global sales of electric vehicles have increased by 43% year-over-year as government incentives and improved technology drive consumer adoption.",
        authorId: user.id,
        category: "Technology",
        featuredImageUrl: "https://images.unsplash.com/photo-1557200134-90327ee9fafa?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=500&q=80",
        status: "published"
      });
      
      this.createArticle({
        title: "AI Research Breakthrough Could Revolutionize Healthcare",
        content: "<p>New machine learning models achieve unprecedented accuracy in early disease detection, potentially saving millions of lives through preventative care. Researchers at leading universities have developed algorithms that can detect subtle patterns in medical imaging that human doctors might miss.</p><p>The technology is expected to be rolled out to select hospitals for testing within the next six months.</p>",
        summary: "New machine learning models achieve unprecedented accuracy in early disease detection...",
        authorId: user.id,
        category: "Technology",
        featuredImageUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
        status: "published"
      });
      
      this.createArticle({
        title: "Global Markets React to New Economic Policy",
        content: "<p>Stock markets worldwide show volatility as central banks announce coordinated policy shift to address inflation concerns. The announcement, which came after months of speculation, outlines a gradual reduction in stimulus measures that have supported economies through the pandemic recovery period.</p><p>Analysts remain divided on the long-term impact of these changes, with some predicting a period of adjustment followed by stable growth, while others warn of potential market corrections.</p>",
        summary: "Stock markets worldwide show volatility as central banks announce coordinated policy shift...",
        authorId: user.id,
        category: "Business",
        featuredImageUrl: "https://images.unsplash.com/photo-1607944024060-0450380ddd33?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
        status: "published"
      });
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      isAdmin: false,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }
  
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getArticles(filter?: { category?: string, status?: string }): Promise<Article[]> {
    let articles = Array.from(this.articles.values());
    
    if (filter) {
      if (filter.category && filter.category !== "All") {
        articles = articles.filter(article => article.category === filter.category);
      }
      
      if (filter.status) {
        articles = articles.filter(article => article.status === filter.status);
      } else {
        // By default, only return published articles
        articles = articles.filter(article => article.status === "published");
      }
    }
    
    // Sort by newest first
    return articles.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
  
  async getArticle(id: number): Promise<Article | undefined> {
    return this.articles.get(id);
  }
  
  async createArticle(insertArticle: InsertArticle): Promise<Article> {
    const id = this.articleIdCounter++;
    const now = new Date();
    const article: Article = { 
      ...insertArticle, 
      id, 
      status: insertArticle.status || 'draft',
      summary: insertArticle.summary || null,
      featuredImageUrl: insertArticle.featuredImageUrl || null,
      createdAt: now, 
      updatedAt: now 
    };
    this.articles.set(id, article);
    return article;
  }
  
  async updateArticle(id: number, articleUpdate: Partial<InsertArticle>): Promise<Article | undefined> {
    const article = this.articles.get(id);
    if (!article) return undefined;
    
    const updatedArticle: Article = { 
      ...article, 
      ...articleUpdate,
      updatedAt: new Date()
    };
    
    this.articles.set(id, updatedArticle);
    return updatedArticle;
  }
  
  async deleteArticle(id: number): Promise<boolean> {
    return this.articles.delete(id);
  }
  
  async getBookmarks(userId: number): Promise<Bookmark[]> {
    return Array.from(this.bookmarks.values())
      .filter(bookmark => bookmark.userId === userId);
  }
  
  async getBookmarksByUser(userId: number): Promise<{ bookmark: Bookmark, article: Article }[]> {
    const bookmarks = await this.getBookmarks(userId);
    return bookmarks
      .map(bookmark => {
        const article = this.articles.get(bookmark.articleId);
        return article ? { bookmark, article } : null;
      })
      .filter((item): item is { bookmark: Bookmark, article: Article } => item !== null);
  }
  
  async getBookmark(userId: number, articleId: number): Promise<Bookmark | undefined> {
    return Array.from(this.bookmarks.values())
      .find(bookmark => bookmark.userId === userId && bookmark.articleId === articleId);
  }
  
  async createBookmark(insertBookmark: InsertBookmark): Promise<Bookmark> {
    // Check if bookmark already exists
    const existing = await this.getBookmark(insertBookmark.userId, insertBookmark.articleId);
    if (existing) return existing;
    
    // Create new bookmark
    const id = this.bookmarkIdCounter++;
    const now = new Date();
    const bookmark: Bookmark = { 
      ...insertBookmark, 
      id, 
      createdAt: now 
    };
    
    this.bookmarks.set(id, bookmark);
    return bookmark;
  }
  
  async deleteBookmark(userId: number, articleId: number): Promise<boolean> {
    const bookmark = await this.getBookmark(userId, articleId);
    if (!bookmark) return false;
    
    return this.bookmarks.delete(bookmark.id);
  }
}

// PostgreSQL implementation of the storage interface
export class PostgresStorage implements IStorage {
  private db: any;
  sessionStore: Store;

  constructor(db: any) {
    this.db = db;
    // For production, we'll use connect-pg-simple for session storage
    const pgSession = require('connect-pg-simple')(session);
    this.sessionStore = new pgSession({
      conString: process.env.DATABASE_URL,
      tableName: 'sessions' // Table name for sessions
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const now = new Date();
    const result = await this.db.insert(users).values({
      ...insertUser,
      isAdmin: false,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      createdAt: now
    }).returning();
    
    return result[0];
  }

  async getUsers(): Promise<User[]> {
    return this.db.select().from(users);
  }

  async getArticles(filter?: { category?: string, status?: string }): Promise<Article[]> {
    let query = this.db.select().from(articles);
    
    if (filter) {
      if (filter.category && filter.category !== "All") {
        query = query.where(eq(articles.category, filter.category));
      }
      
      if (filter.status) {
        query = query.where(eq(articles.status, filter.status));
      } else {
        // By default, only return published articles
        query = query.where(eq(articles.status, "published"));
      }
    }
    
    // Sort by newest first
    const result = await query.orderBy(articles.createdAt, 'desc');
    return result;
  }

  async getArticle(id: number): Promise<Article | undefined> {
    const result = await this.db.select().from(articles).where(eq(articles.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async createArticle(insertArticle: InsertArticle): Promise<Article> {
    const now = new Date();
    const result = await this.db.insert(articles).values({
      ...insertArticle,
      status: insertArticle.status || 'draft',
      summary: insertArticle.summary || null,
      featuredImageUrl: insertArticle.featuredImageUrl || null,
      createdAt: now,
      updatedAt: now
    }).returning();
    
    return result[0];
  }

  async updateArticle(id: number, articleUpdate: Partial<InsertArticle>): Promise<Article | undefined> {
    const now = new Date();
    const result = await this.db.update(articles)
      .set({
        ...articleUpdate,
        updatedAt: now
      })
      .where(eq(articles.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteArticle(id: number): Promise<boolean> {
    const result = await this.db.delete(articles).where(eq(articles.id, id));
    return result.rowCount > 0;
  }

  async getBookmarks(userId: number): Promise<Bookmark[]> {
    return this.db.select().from(bookmarks).where(eq(bookmarks.userId, userId));
  }

  async getBookmarksByUser(userId: number): Promise<{ bookmark: Bookmark, article: Article }[]> {
    // Join bookmarks and articles tables
    const result = await this.db.select({
      bookmark: bookmarks,
      article: articles
    })
    .from(bookmarks)
    .innerJoin(articles, eq(bookmarks.articleId, articles.id))
    .where(eq(bookmarks.userId, userId));
    
    return result;
  }

  async getBookmark(userId: number, articleId: number): Promise<Bookmark | undefined> {
    const result = await this.db.select()
      .from(bookmarks)
      .where(and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.articleId, articleId)
      ))
      .limit(1);
    
    return result.length > 0 ? result[0] : undefined;
  }

  async createBookmark(insertBookmark: InsertBookmark): Promise<Bookmark> {
    // Check if bookmark already exists
    const existing = await this.getBookmark(insertBookmark.userId, insertBookmark.articleId);
    if (existing) return existing;
    
    // Create new bookmark
    const now = new Date();
    const result = await this.db.insert(bookmarks).values({
      ...insertBookmark,
      createdAt: now
    }).returning();
    
    return result[0];
  }

  async deleteBookmark(userId: number, articleId: number): Promise<boolean> {
    const result = await this.db.delete(bookmarks)
      .where(and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.articleId, articleId)
      ));
    
    return result.rowCount > 0;
  }
}

// Choose the right storage implementation based on environment
let storage: IStorage;

if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
  // In production, use PostgreSQL
  const connectionString = process.env.DATABASE_URL;
  const client = postgres(connectionString);
  const db = drizzle(client);
  storage = new PostgresStorage(db);
  console.log('Using PostgreSQL storage');
} else {
  // In development, use in-memory storage
  storage = new MemStorage();
  console.log('Using in-memory storage');
}

export { storage };
