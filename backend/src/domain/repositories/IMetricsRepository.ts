import { Metrics, HitContext } from '../entities/Metrics';

export interface IMetricsRepository {
  recordHit(
    type: 'stats' | 'languages' | 'repo' | 'rank' | 'streak' | 'trophies',
    context?: HitContext
  ): void;
  getMetrics(): Metrics;
  getUserMetrics(username: string): Promise<any>;
  getAllUserMetrics(): Promise<any[]>;
  getUniqueUsersCount(): Promise<number>;
  getOrIncrementProfileViews(username: string, increment: boolean): Promise<number>;
  getRendersHistory(days: number): Promise<any[]>;
}
