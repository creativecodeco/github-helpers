import { IGitHubRepository } from '@/domain/repositories/IGitHubRepository';
import { UserStats } from '@/domain/entities/UserStats';
import { LanguageStat } from '@/domain/entities/LanguageStat';
import { RepoStats } from '@/domain/entities/RepoStats';
import { StreakStats } from '@/domain/entities/StreakStats';

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572a5',
  Java: '#b07219',
  Go: '#00add8',
  Rust: '#dea584',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Ruby: '#701516',
  PHP: '#4f5d95',
  Swift: '#f05138',
  Kotlin: '#a97bff',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Vue: '#41b883',
  React: '#61dafb',
  Svelte: '#ff3e00',
  Dart: '#00b4ab',
  Objective_C: '#438eff',
  Scala: '#c22d40',
  Elixir: '#6e4a7e',
  Haskell: '#5e5086',
  PowerShell: '#012456',
  R: '#198ce7'
};

const DEFAULT_COLOR = '#858585';

export class ApiGitHubRepository implements IGitHubRepository {
  private getHeaders(userToken?: string): HeadersInit {
    const headers: HeadersInit = {
      'User-Agent': 'github-helpers-stats',
      Accept: 'application/vnd.github.v3+json'
    };

    const token = userToken || process.env.GITHUB_TOKEN;
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    return headers;
  }

  private async fetchGitHub(
    url: string,
    userToken?: string,
    extraHeaders: Record<string, string> = {}
  ): Promise<any> {
    if (!url.startsWith('https://api.github.com/')) {
      throw new Error('Forbidden URL target: Only GitHub API requests are allowed.');
    }
    const mergedHeaders = { ...this.getHeaders(userToken), ...extraHeaders };
    const response = await fetch(url, { headers: mergedHeaders });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitHub API error (${response.status}) for URL ${url}: ${errorText}`);
    }

    return response.json();
  }

  private async fetchRepoStats(
    username: string,
    userToken?: string
  ): Promise<{ totalStars: number; forksReceived: number }> {
    let totalStars = 0;
    let forksReceived = 0;
    let page = 1;
    let hasMoreRepos = true;

    while (hasMoreRepos && page <= 3) {
      const reposUrl = userToken
        ? `https://api.github.com/user/repos?per_page=100&page=${page}&visibility=all&affiliation=owner,collaborator,organization_member`
        : `https://api.github.com/users/${username}/repos?per_page=100&page=${page}`;

      const repos = await this.fetchGitHub(reposUrl, userToken);
      if (repos.length === 0) {
        hasMoreRepos = false;
      } else {
        for (const repo of repos) {
          if (!repo.fork) {
            totalStars += repo.stargazers_count || 0;
            forksReceived += repo.forks_count || 0;
          }
        }
        page++;
      }
    }

    return { totalStars, forksReceived };
  }

  private async fetchTotalCount(
    url: string,
    userToken?: string,
    headers: Record<string, string> = {}
  ): Promise<number> {
    try {
      const searchResult = await this.fetchGitHub(url, userToken, headers);
      return searchResult.total_count || 0;
    } catch (e) {
      console.warn(`Could not fetch search count for ${url}:`, e);
      return 0;
    }
  }

  private calculateDeveloperRank(score: number): string {
    if (score > 10000) return 'S+';
    if (score > 5000) return 'S';
    if (score > 2000) return 'A+';
    if (score > 1000) return 'A';
    if (score > 500) return 'B+';
    if (score > 200) return 'B';
    return 'C';
  }

  async getUserStats(username: string, userToken?: string): Promise<UserStats> {
    const userProfile = userToken
      ? await this.fetchGitHub('https://api.github.com/user', userToken)
      : await this.fetchGitHub(`https://api.github.com/users/${username}`);

    const { totalStars, forksReceived } = await this.fetchRepoStats(username, userToken);

    const totalCommits = await this.fetchTotalCount(
      `https://api.github.com/search/commits?q=author:${username}`,
      userToken,
      { Accept: 'application/vnd.github.cloak-preview+json' }
    );

    const totalPRs = await this.fetchTotalCount(
      `https://api.github.com/search/issues?q=author:${username}+type:pr`,
      userToken
    );

    const totalIssues = await this.fetchTotalCount(
      `https://api.github.com/search/issues?q=author:${username}+type:issue`,
      userToken
    );

    const score =
      totalCommits * 1 +
      totalPRs * 3 +
      totalIssues * 1 +
      totalStars * 5 +
      (userProfile.followers || 0) * 8;

    const rank = this.calculateDeveloperRank(score);

    const collaborationIndex = Math.min(
      100,
      Math.round(((totalPRs + totalIssues) / (totalCommits + totalPRs + totalIssues + 1)) * 100)
    );

    return {
      username: userProfile.login,
      name: userProfile.name || userProfile.login,
      avatarUrl: userProfile.avatar_url,
      followers: userProfile.followers || 0,
      publicRepos: userProfile.public_repos || 0,
      totalStars,
      totalCommits,
      totalPRs,
      totalIssues,
      forksReceived,
      rank,
      collaborationIndex
    };
  }

  private async fetchNonForkRepos(username: string, userToken?: string): Promise<any[]> {
    const nonForkRepos: any[] = [];
    let page = 1;
    let hasMoreRepos = true;

    while (hasMoreRepos && page <= 3) {
      const reposUrl = userToken
        ? `https://api.github.com/user/repos?per_page=100&page=${page}&visibility=all&affiliation=owner,collaborator,organization_member`
        : `https://api.github.com/users/${username}/repos?per_page=100&page=${page}`;

      const repos = await this.fetchGitHub(reposUrl, userToken);
      if (repos.length === 0) {
        hasMoreRepos = false;
      } else {
        for (const repo of repos) {
          if (!repo.fork) {
            nonForkRepos.push(repo);
          }
        }
        page++;
      }
    }

    return nonForkRepos;
  }

  private async aggregateRepoLanguages(
    repos: any[],
    username: string,
    userToken?: string
  ): Promise<Record<string, { count: number; size: number }>> {
    const languageMap: Record<string, { count: number; size: number }> = {};
    const CONCURRENCY_LIMIT = 15;

    for (let i = 0; i < repos.length; i += CONCURRENCY_LIMIT) {
      const batch = repos.slice(i, i + CONCURRENCY_LIMIT);
      await Promise.all(
        batch.map(async (repo) => {
          try {
            const ownerLogin = repo.owner?.login || username;
            const repoLangs = await this.fetchGitHub(
              `https://api.github.com/repos/${ownerLogin}/${repo.name}/languages`,
              userToken
            );
            for (const [lang, bytes] of Object.entries(repoLangs)) {
              const sizeInKB = (bytes as number) / 1024;
              if (!languageMap[lang]) {
                languageMap[lang] = { count: 0, size: 0 };
              }
              languageMap[lang].count += 1;
              languageMap[lang].size += sizeInKB;
            }
          } catch (err) {
            console.warn(`Could not fetch languages for repo ${username}/${repo.name}:`, err);
          }
        })
      );
    }

    return languageMap;
  }

  async getUserLanguages(username: string, userToken?: string): Promise<LanguageStat[]> {
    const nonForkRepos = await this.fetchNonForkRepos(username, userToken);
    const languageMap = await this.aggregateRepoLanguages(nonForkRepos, username, userToken);

    const statsArray: LanguageStat[] = [];
    let totalSize = 0;

    for (const [name, data] of Object.entries(languageMap)) {
      totalSize += data.size;
      statsArray.push({
        name,
        count: data.count,
        size: data.size,
        percentage: 0,
        color: LANGUAGE_COLORS[name] || DEFAULT_COLOR
      });
    }

    statsArray.sort((a, b) => b.size - a.size);

    const result = statsArray.map((stat) => ({
      ...stat,
      percentage: totalSize > 0 ? Number.parseFloat(((stat.size / totalSize) * 100).toFixed(1)) : 0
    }));

    const topLanguages = result.slice(0, 6);
    if (result.length > 6) {
      const otherLanguages = result.slice(6);
      const otherSize = otherLanguages.reduce((sum, item) => sum + item.size, 0);
      const otherCount = otherLanguages.reduce((sum, item) => sum + item.count, 0);
      const otherPercentage = Number.parseFloat(
        otherLanguages.reduce((sum, item) => sum + item.percentage, 0).toFixed(1)
      );

      if (otherSize > 0) {
        topLanguages.push({
          name: 'Otros',
          count: otherCount,
          size: otherSize,
          percentage: otherPercentage,
          color: DEFAULT_COLOR
        });
      }
    }

    return topLanguages;
  }

  private updateBestRepo(repos: any[], currentBest: any): any {
    let best = currentBest;
    for (const repo of repos) {
      if (!repo.fork) {
        if (!best || (repo.stargazers_count || 0) > (best.stargazers_count || 0)) {
          best = repo;
        }
      }
    }
    return best;
  }

  private async findBestRepo(username: string, userToken?: string): Promise<any> {
    let bestRepo: any = null;
    let page = 1;
    let hasMoreRepos = true;

    while (hasMoreRepos && page <= 3) {
      const reposUrl = userToken
        ? `https://api.github.com/user/repos?per_page=100&page=${page}&visibility=all&affiliation=owner,collaborator,organization_member`
        : `https://api.github.com/users/${username}/repos?per_page=100&page=${page}`;

      const repos = await this.fetchGitHub(reposUrl, userToken);
      if (repos.length === 0) {
        hasMoreRepos = false;
      } else {
        bestRepo = this.updateBestRepo(repos, bestRepo);
        page++;
      }
    }

    if (!bestRepo) {
      throw new Error('No se encontraron repositorios (no forks) para este usuario.');
    }
    return bestRepo;
  }

  async getFeaturedRepo(
    username: string,
    repoName?: string,
    userToken?: string
  ): Promise<RepoStats> {
    const repoData = repoName
      ? await this.fetchGitHub(`https://api.github.com/repos/${username}/${repoName}`, userToken)
      : await this.findBestRepo(username, userToken);

    const name = repoData.name;
    const owner = repoData.owner.login;
    const description = repoData.description || 'Sin descripción disponible.';
    const stars = repoData.stargazers_count || 0;
    const forks = repoData.forks_count || 0;
    const language = repoData.language || 'Markdown';
    const languageColor = LANGUAGE_COLORS[language] || DEFAULT_COLOR;
    const license = repoData.license
      ? repoData.license.spdx_id || repoData.license.name
      : 'No License';

    return {
      name,
      owner,
      description,
      stars,
      forks,
      language,
      languageColor,
      license
    };
  }

  private parseContributions(html: string): { date: string; level: number }[] {
    const tdRegex = /data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="(\d)"/g;
    const contributions: { date: string; level: number }[] = [];

    let match: RegExpExecArray | null;
    while ((match = tdRegex.exec(html)) !== null) {
      contributions.push({ date: match[1], level: Number.parseInt(match[2], 10) });
    }

    contributions.sort((a, b) => a.date.localeCompare(b.date));
    return contributions;
  }

  private calculateStreakStats(
    contributions: { date: string; level: number }[]
  ): { longestStreak: number; longestStreakStart: string; longestStreakEnd: string } {
    let longestStreak = 0;
    let longestStreakStart = '';
    let longestStreakEnd = '';
    let streak = 0;
    let streakStart = '';

    for (const { date, level } of contributions) {
      if (level > 0) {
        if (streak === 0) streakStart = date;
        streak++;
        if (streak > longestStreak) {
          longestStreak = streak;
          longestStreakStart = streakStart;
          longestStreakEnd = date;
        }
      } else {
        streak = 0;
      }
    }

    return { longestStreak, longestStreakStart, longestStreakEnd };
  }

  private calculateCurrentStreak(
    activeDays: Set<string>,
    today: Date
  ): { currentStreak: number; currentStreakStart: string; currentStreakEnd: string } {
    function addDays(d: Date, n: number): Date {
      const copy = new Date(d);
      copy.setUTCDate(copy.getUTCDate() + n);
      return copy;
    }

    function fmt(d: Date): string {
      return d.toISOString().slice(0, 10);
    }

    const todayStr = fmt(today);
    const yesterdayStr = fmt(addDays(today, -1));

    let currentStreak = 0;
    let currentStreakStart = '';
    let currentStreakEnd = '';

    let cursor: Date | null = null;
    if (activeDays.has(todayStr)) {
      cursor = today;
    } else if (activeDays.has(yesterdayStr)) {
      cursor = addDays(today, -1);
    }

    if (cursor) {
      currentStreakEnd = fmt(cursor);
      while (activeDays.has(fmt(cursor))) {
        currentStreak++;
        currentStreakStart = fmt(cursor);
        cursor = addDays(cursor, -1);
      }
    }

    return { currentStreak, currentStreakStart, currentStreakEnd };
  }

  async getUserStreak(username: string): Promise<StreakStats> {
    if (!/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(username)) {
      throw new Error('Invalid username format');
    }
    const url = `https://github.com/users/${username}/contributions`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'github-helpers-stats',
        Accept: 'text/html'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub contributions page error (${response.status}) for user: ${username}`);
    }

    const html = await response.text();
    const contributions = this.parseContributions(html);

    if (contributions.length === 0) {
      throw new Error(`No contribution data found for user: ${username}`);
    }

    const totalContributions = contributions.filter((c) => c.level > 0).length;

    const firstContribEntry = contributions.find((c) => c.level > 0);
    const firstContributionDate = firstContribEntry
      ? firstContribEntry.date
      : contributions[0].date;

    const activeDays = new Set(contributions.filter((c) => c.level > 0).map((c) => c.date));
    const { longestStreak, longestStreakStart, longestStreakEnd } = this.calculateStreakStats(contributions);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const { currentStreak, currentStreakStart, currentStreakEnd } = this.calculateCurrentStreak(activeDays, today);

    return {
      username,
      totalContributions,
      currentStreak,
      longestStreak,
      currentStreakStart,
      currentStreakEnd,
      longestStreakStart,
      longestStreakEnd,
      firstContributionDate
    };
  }

  clearCache(_username: string): void {
    // No-op for the raw API client
  }

  async getUserTopRepos(username: string, limit: number = 4): Promise<RepoStats[]> {
    const reposUrl = `https://api.github.com/users/${username}/repos?per_page=100&sort=stars&direction=desc`;
    const repos = await this.fetchGitHub(reposUrl);

    const sorted = (repos as any[])
      .filter((r: any) => !r.fork)
      .sort((a: any, b: any) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
      .slice(0, limit);

    return sorted.map((repo: any) => {
      const language = repo.language || 'Markdown';
      return {
        name: repo.name,
        owner: repo.owner.login,
        description: repo.description || 'Sin descripción disponible.',
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0,
        language,
        languageColor: LANGUAGE_COLORS[language] || DEFAULT_COLOR,
        license: repo.license ? repo.license.spdx_id || repo.license.name : 'No License'
      };
    });
  }
}
