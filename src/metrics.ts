import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

interface Metrics {
  totalRenders: number;
  statsRenders: number;
  languagesRenders: number;
  repoRenders: number;
  rankRenders: number;
  streakRenders: number;
  trophiesRenders: number;
}

const DB_DIR = path.join(__dirname, '../data');
const DB_FILE = path.join(DB_DIR, 'metrics.sqlite');

// Ensure data folder exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Open Database connection
const db = new sqlite3.Database(DB_FILE);

// Enable WAL mode for high concurrency write/read access
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

  // Migrate existing databases: add streak columns if they don't exist yet
  db.run('ALTER TABLE user_metrics ADD COLUMN streak_web INTEGER DEFAULT 0', () => {
    /* ignore if already exists */
  });
  db.run('ALTER TABLE user_metrics ADD COLUMN streak_github INTEGER DEFAULT 0', () => {
    /* ignore if already exists */
  });
  // Migrate existing databases: add trophies columns if they don't exist yet
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
});

// Cache global metrics in memory to resolve API calls instantly
const globalMetricsCache: Metrics = {
  totalRenders: 0,
  statsRenders: 0,
  languagesRenders: 0,
  repoRenders: 0,
  rankRenders: 0,
  streakRenders: 0,
  trophiesRenders: 0
};

// Load global metrics into cache on boot
function loadGlobalMetricsCache() {
  db.all('SELECT metric_key, metric_value FROM global_metrics', (err, rows: any[]) => {
    if (err) {
      console.error('Error loading global metrics cache:', err);
      return;
    }
    if (rows) {
      rows.forEach((row) => {
        if (row.metric_key in globalMetricsCache) {
          globalMetricsCache[row.metric_key as keyof Metrics] = row.metric_value;
        }
      });
    }
  });
}
loadGlobalMetricsCache();

export interface HitContext {
  username: string;
  userAgent?: string;
  referer?: string;
  ip?: string;
}

// Record a render hit and save stats to database
export function recordHit(
  type: 'stats' | 'languages' | 'repo' | 'rank' | 'streak' | 'trophies',
  context?: HitContext
) {
  const username = context?.username || 'unknown';
  const userAgent = context?.userAgent || '';
  const referer = context?.referer || '';
  const ip = context?.ip || '';

  // Detect Source: If User-Agent has 'github-camo' or Referer has 'github.com', it's from a README view
  let source = 'web';
  if (
    userAgent.toLowerCase().includes('github-camo') ||
    referer.toLowerCase().includes('github.com') ||
    referer.toLowerCase().includes('camo')
  ) {
    source = 'github';
  }

  db.serialize(() => {
    // 1. Update Global Counters in SQLite
    db.run(
      'UPDATE global_metrics SET metric_value = metric_value + 1 WHERE metric_key = ?',
      'totalRenders'
    );
    db.run(
      'UPDATE global_metrics SET metric_value = metric_value + 1 WHERE metric_key = ?',
      `${type}Renders`
    );

    // 2. Update User Metrics (Web vs GitHub count)
    const column = `${type}_${source}`;
    db.run(
      `
      INSERT INTO user_metrics (username, ${column}, last_updated)
      VALUES (?, 1, ?)
      ON CONFLICT(username) DO UPDATE SET
        ${column} = ${column} + 1,
        last_updated = ?
    `,
      [username.toLowerCase(), new Date().toISOString(), new Date().toISOString()]
    );

    // 3. Write to detailed request log
    db.run(
      `
      INSERT INTO request_log (username, card_type, source, user_agent, referer, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      [username.toLowerCase(), type, source, userAgent, referer, ip]
    );
  });

  // Increment cache values synchronously
  globalMetricsCache.totalRenders += 1;
  const key = `${type}Renders` as keyof Metrics;
  globalMetricsCache[key] += 1;
}

// Retrieve current in-memory metrics cache
export function getMetrics(): Metrics {
  return { ...globalMetricsCache };
}

// Fetch stats for a single user
export function getUserMetrics(username: string): Promise<any> {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM user_metrics WHERE username = ?',
      [username.toLowerCase()],
      (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      }
    );
  });
}

// Fetch all user metrics
export function getAllUserMetrics(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM user_metrics ORDER BY last_updated DESC', (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

// Count unique users using the cards
export function getUniqueUsersCount(): Promise<number> {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM user_metrics', (err, row: any) => {
      if (err) reject(err);
      else resolve(row ? row.count : 0);
    });
  });
}

// Fetch total event logs
export function getEventLogs(limit: number = 100): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM request_log ORDER BY created_at DESC LIMIT ?', [limit], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}
