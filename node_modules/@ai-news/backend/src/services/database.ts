import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { EnvConfig } from '../config';

let db: Database.Database | null = null;

export function getDb(config: EnvConfig): Database.Database {
  if (db) return db;
  const dbDir = path.dirname(config.databasePath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  db = new Database(config.databasePath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  initializeSchema(db);
  return db;
}

function initializeSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      source_name TEXT NOT NULL,
      source_domain TEXT NOT NULL,
      published_at TEXT NOT NULL,
      fetched_at TEXT NOT NULL,
      content TEXT,
      summary TEXT,
      category TEXT DEFAULT 'General',
      subcategory TEXT,
      trending_score REAL DEFAULT 0,
      duplicate_group_id TEXT,
      is_lead INTEGER DEFAULT 0,
      language TEXT DEFAULT 'en',
      thumbnail_url TEXT,
      related_article_ids TEXT DEFAULT '[]',
      is_saved INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tools (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      url TEXT,
      category TEXT DEFAULT 'General',
      trending_score REAL DEFAULT 0,
      mentions INTEGER DEFAULT 0,
      last_mentioned TEXT,
      source_articles TEXT DEFAULT '[]',
      logo_url TEXT
    );

    CREATE TABLE IF NOT EXISTS trends (
      id TEXT PRIMARY KEY,
      topic TEXT NOT NULL,
      category TEXT DEFAULT 'General',
      mention_count INTEGER DEFAULT 0,
      sentiment TEXT DEFAULT 'neutral',
      related_article_ids TEXT DEFAULT '[]',
      trend_direction TEXT DEFAULT 'stable',
      period TEXT DEFAULT 'daily'
    );

    CREATE TABLE IF NOT EXISTS refresh_log (
      id TEXT PRIMARY KEY,
      success INTEGER NOT NULL,
      articles_fetched INTEGER DEFAULT 0,
      articles_new INTEGER DEFAULT 0,
      articles_duplicated INTEGER DEFAULT 0,
      error TEXT,
      timestamp TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at);
    CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
    CREATE INDEX IF NOT EXISTS idx_articles_trending ON articles(trending_score DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_saved ON articles(is_saved);
    CREATE INDEX IF NOT EXISTS idx_tools_trending ON tools(trending_score DESC);
  `);
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
