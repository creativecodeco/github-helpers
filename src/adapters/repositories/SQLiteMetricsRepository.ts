import { IMetricsRepository } from '@/domain/repositories/IMetricsRepository';
import { Metrics, HitContext } from '@/domain/entities/Metrics';
import { db } from '@/infrastructure/database/database';

export class SQLiteMetricsRepository implements IMetricsRepository {
  private globalMetricsCache: Metrics = {
    totalRenders: 0,
    statsRenders: 0,
    languagesRenders: 0,
    repoRenders: 0,
    rankRenders: 0,
    streakRenders: 0,
    trophiesRenders: 0
  };

  constructor() {
    this.loadGlobalMetricsCache();
  }

  private loadGlobalMetricsCache() {
    db.all('SELECT metric_key, metric_value FROM global_metrics', (err, rows: any[]) => {
      if (err) {
        console.error('Error loading global metrics cache:', err);
        return;
      }
      if (rows) {
        rows.forEach((row) => {
          if (row.metric_key in this.globalMetricsCache) {
            this.globalMetricsCache[row.metric_key as keyof Metrics] = row.metric_value;
          }
        });
      }
    });
  }

  recordHit(
    type: 'stats' | 'languages' | 'repo' | 'rank' | 'streak' | 'trophies',
    context?: HitContext
  ): void {
    const username = context?.username || 'unknown';
    const userAgent = context?.userAgent || '';
    const referer = context?.referer || '';
    const ip = context?.ip || '';

    let source = 'web';
    let isGitHubReferer = false;
    try {
      const refererHost = new URL(referer).hostname.toLowerCase();
      isGitHubReferer =
        refererHost === 'github.com' || refererHost.endsWith('.github.com');
    } catch {
      isGitHubReferer = false;
    }

    if (
      userAgent.toLowerCase().includes('github-camo') ||
      isGitHubReferer ||
      referer.toLowerCase().includes('camo')
    ) {
      source = 'github';
    }

    db.serialize(() => {
      db.run(
        'UPDATE global_metrics SET metric_value = metric_value + 1 WHERE metric_key = ?',
        'totalRenders'
      );
      db.run(
        'UPDATE global_metrics SET metric_value = metric_value + 1 WHERE metric_key = ?',
        `${type}Renders`
      );

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

      db.run(
        `
        INSERT INTO request_log (username, card_type, source, user_agent, referer, ip_address)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
        [username.toLowerCase(), type, source, userAgent, referer, ip]
      );
    });

    this.globalMetricsCache.totalRenders += 1;
    const key = `${type}Renders` as keyof Metrics;
    this.globalMetricsCache[key] += 1;
  }

  getMetrics(): Metrics {
    return { ...this.globalMetricsCache };
  }

  getUserMetrics(username: string): Promise<any> {
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

  getAllUserMetrics(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM user_metrics ORDER BY last_updated DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  getUniqueUsersCount(): Promise<number> {
    return new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM user_metrics', (err, row: any) => {
        if (err) reject(err);
        else resolve(row ? row.count : 0);
      });
    });
  }
}
