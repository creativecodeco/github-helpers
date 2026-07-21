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
    const mergedHeaders = { ...this.getHeaders(userToken), ...extraHeaders };
    const response = await fetch(url, { headers: mergedHeaders });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitHub API error (${response.status}) for URL ${url}: ${errorText}`);
    }

    return response.json();
  }

  async getUserStats(username: string, userToken?: string): Promise<UserStats> {
    const userProfile = userToken
      ? await this.fetchGitHub('https://api.github.com/user', userToken)
      : await this.fetchGitHub(`https://api.github.com/users/${username}`);

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

    let totalCommits = 0;
    try {
      const commitsSearch = await this.fetchGitHub(
        `https://api.github.com/search/commits?q=author:${username}`,
        userToken,
        { Accept: 'application/vnd.github.cloak-preview+json' }
      );
      totalCommits = commitsSearch.total_count || 0;
    } catch (e) {
      console.warn(`Could not fetch commits for ${username}:`, e);
    }

    let totalPRs = 0;
    try {
      const prsSearch = await this.fetchGitHub(
        `https://api.github.com/search/issues?q=author:${username}+type:pr`,
        userToken
      );
      totalPRs = prsSearch.total_count || 0;
    } catch (e) {
      console.warn(`Could not fetch PRs for ${username}:`, e);
    }

    let totalIssues = 0;
    try {
      const issuesSearch = await this.fetchGitHub(
        `https://api.github.com/search/issues?q=author:${username}+type:issue`,
        userToken
      );
      totalIssues = issuesSearch.total_count || 0;
    } catch (e) {
      console.warn(`Could not fetch issues for ${username}:`, e);
    }

    const score =
      totalCommits * 1 +
      totalPRs * 3 +
      totalIssues * 1 +
      totalStars * 5 +
      (userProfile.followers || 0) * 8;

    let rank = 'C';
    if (score > 10000) rank = 'S+';
    else if (score > 5000) rank = 'S';
    else if (score > 2000) rank = 'A+';
    else if (score > 1000) rank = 'A';
    else if (score > 500) rank = 'B+';
    else if (score > 200) rank = 'B';

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

  async getUserLanguages(username: string, userToken?: string): Promise<LanguageStat[]> {
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

    const languageMap: Record<string, { count: number; size: number }> = {};
    const CONCURRENCY_LIMIT = 15;

    for (let i = 0; i < nonForkRepos.length; i += CONCURRENCY_LIMIT) {
      const batch = nonForkRepos.slice(i, i + CONCURRENCY_LIMIT);
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
      percentage: totalSize > 0 ? parseFloat(((stat.size / totalSize) * 100).toFixed(1)) : 0
    }));

    const topLanguages = result.slice(0, 6);
    if (result.length > 6) {
      const otherLanguages = result.slice(6);
      const otherSize = otherLanguages.reduce((sum, item) => sum + item.size, 0);
      const otherCount = otherLanguages.reduce((sum, item) => sum + item.count, 0);
      const otherPercentage = parseFloat(
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

  async getFeaturedRepo(
    username: string,
    repoName?: string,
    userToken?: string
  ): Promise<RepoStats> {
    let repoData: any;

    if (repoName) {
      repoData = await this.fetchGitHub(
        `https://api.github.com/repos/${username}/${repoName}`,
        userToken
      );
    } else {
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
          for (const repo of repos) {
            if (!repo.fork) {
              if (!bestRepo || (repo.stargazers_count || 0) > (bestRepo.stargazers_count || 0)) {
                bestRepo = repo;
              }
            }
          }
          page++;
        }
      }

      if (!bestRepo) {
        throw new Error('No se encontraron repositorios (no forks) para este usuario.');
      }
      repoData = bestRepo;
    }

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

  async getUserStreak(username: string): Promise<StreakStats> {
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

    const tdRegex = /data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="(\d)"/g;
    const contributions: { date: string; level: number }[] = [];

    let match: RegExpExecArray | null;
    while ((match = tdRegex.exec(html)) !== null) {
      contributions.push({ date: match[1], level: Number.parseInt(match[2], 10) });
    }

    contributions.sort((a, b) => a.date.localeCompare(b.date));

    if (contributions.length === 0) {
      throw new Error(`No contribution data found for user: ${username}`);
    }

    const totalContributions = contributions.filter((c) => c.level > 0).length;

    const firstContribEntry = contributions.find((c) => c.level > 0);
    const firstContributionDate = firstContribEntry
      ? firstContribEntry.date
      : contributions[0].date;

    function addDays(d: Date, n: number): Date {
      const copy = new Date(d);
      copy.setUTCDate(copy.getUTCDate() + n);
      return copy;
    }

    function fmt(d: Date): string {
      return d.toISOString().slice(0, 10);
    }

    const activeDays = new Set(contributions.filter((c) => c.level > 0).map((c) => c.date));

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

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayStr = fmt(today);
    const yesterdayStr = fmt(addDays(today, -1));

    let currentStreak = 0;
    let currentStreakStart = '';
    let currentStreakEnd = '';

    let cursor = activeDays.has(todayStr)
      ? today
      : activeDays.has(yesterdayStr)
        ? addDays(today, -1)
        : null;

    if (cursor) {
      currentStreakEnd = fmt(cursor);
      while (activeDays.has(fmt(cursor))) {
        currentStreak++;
        currentStreakStart = fmt(cursor);
        cursor = addDays(cursor, -1);
      }
    }

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
