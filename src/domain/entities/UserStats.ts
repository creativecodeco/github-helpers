export interface UserStats {
  username: string;
  name: string;
  avatarUrl: string;
  followers: number;
  publicRepos: number;
  totalStars: number;
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  forksReceived: number;
  rank: string;
  collaborationIndex: number;
}
