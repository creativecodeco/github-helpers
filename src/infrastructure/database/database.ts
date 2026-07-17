import sqlite3 from 'sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const DB_DIR = path.join(__dirname, '../../../data');
const DB_FILE = path.join(DB_DIR, 'metrics.sqlite');

// Ensure data folder exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Open Database connection
export const db = new sqlite3.Database(DB_FILE);

/**
 * Initialize Database schemas and migrations in serialized sequence.
 */
export function initDatabase(): Promise<void> {
  return new Promise<void>((resolve) => {
    db.serialize(() => {
      db.run('PRAGMA journal_mode = WAL;');

      // Table 1: Global Counters
      db.run(`
        CREATE TABLE IF NOT EXISTS global_metrics (
          metric_key TEXT PRIMARY KEY,
          metric_value INTEGER DEFAULT 0
        );
      `);

      // Initialize global counters
      const keys = [
        'totalRenders',
        'statsRenders',
        'languagesRenders',
        'repoRenders',
        'rankRenders',
        'streakRenders',
        'trophiesRenders'
      ];
      const insertStmt = db.prepare(
        'INSERT OR IGNORE INTO global_metrics (metric_key, metric_value) VALUES (?, 0)'
      );
      keys.forEach((k) => insertStmt.run(k));
      insertStmt.finalize();

      // Table 2: User Metrics (web vs github views)
      db.run(`
        CREATE TABLE IF NOT EXISTS user_metrics (
          username TEXT PRIMARY KEY,
          stats_web INTEGER DEFAULT 0,
          stats_github INTEGER DEFAULT 0,
          languages_web INTEGER DEFAULT 0,
          languages_github INTEGER DEFAULT 0,
          repo_web INTEGER DEFAULT 0,
          repo_github INTEGER DEFAULT 0,
          rank_web INTEGER DEFAULT 0,
          rank_github INTEGER DEFAULT 0,
          streak_web INTEGER DEFAULT 0,
          streak_github INTEGER DEFAULT 0,
          trophies_web INTEGER DEFAULT 0,
          trophies_github INTEGER DEFAULT 0,
          last_updated TEXT
        );
      `);

      // Migrate existing databases: add streak and trophies columns if they don't exist yet
      db.run('ALTER TABLE user_metrics ADD COLUMN streak_web INTEGER DEFAULT 0', () => {
        /* ignore if already exists */
      });
      db.run('ALTER TABLE user_metrics ADD COLUMN streak_github INTEGER DEFAULT 0', () => {
        /* ignore if already exists */
      });
      db.run('ALTER TABLE user_metrics ADD COLUMN trophies_web INTEGER DEFAULT 0', () => {
        /* ignore if already exists */
      });
      db.run('ALTER TABLE user_metrics ADD COLUMN trophies_github INTEGER DEFAULT 0', () => {
        /* ignore if already exists */
      });

      // Table 3: Request Event Logs for detailed temporal analytics
      db.run(`
        CREATE TABLE IF NOT EXISTS request_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT,
          card_type TEXT,
          source TEXT,
          user_agent TEXT,
          referer TEXT,
          ip_address TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Table 4: User Tokens for Private Repositories Stats
      db.run(
        `
        CREATE TABLE IF NOT EXISTS user_tokens (
          username TEXT PRIMARY KEY,
          encrypted_token TEXT NOT NULL,
          iv TEXT NOT NULL,
          consent_accepted INTEGER NOT NULL DEFAULT 0,
          consent_date TEXT NOT NULL,
          consent_fingerprint TEXT NOT NULL,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `,
        () => {
          resolve(); // Resolve promise when final setup executes
        }
      );
    });
  });
}
