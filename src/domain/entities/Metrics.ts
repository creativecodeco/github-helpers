export interface Metrics {
  totalRenders: number;
  statsRenders: number;
  languagesRenders: number;
  repoRenders: number;
  rankRenders: number;
  streakRenders: number;
  trophiesRenders: number;
}

export interface HitContext {
  username: string;
  userAgent?: string;
  referer?: string;
  ip?: string;
}
