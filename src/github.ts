import dotenv from 'dotenv';

dotenv.config();

// Define interfaces
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

export interface LanguageStat {
  name: string;
  count: number;
  size: number; // size in KB
  percentage: number;
  color: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Memory caching layer
const statsCache = new Map<string, CacheEntry<UserStats>>();
const languagesCache = new Map<string, CacheEntry<LanguageStat[]>>();
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

// Language colors map (standard GitHub colors)
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

// Helper to get headers for GitHub API
function getHeaders(userToken?: string): HeadersInit {
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

// Fetch helper with rate-limit and error handling
async function fetchGitHub(
  url: string,
  userToken?: string,
  extraHeaders: Record<string, string> = {}
): Promise<any> {
  const mergedHeaders = { ...getHeaders(userToken), ...extraHeaders };
  const response = await fetch(url, { headers: mergedHeaders });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub API error (${response.status}) for URL ${url}: ${errorText}`);
  }

  return response.json();
}

/**
 * Fetch stats for a specific GitHub user
 */
export async function getUserStats(username: string, userToken?: string): Promise<UserStats> {
  const cacheKey = `${username.toLowerCase()}:${userToken ? 'private' : 'public'}`;
  const cached = statsCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    // 1. Get profile general info (using userToken if available)
    const userProfile = userToken
      ? await fetchGitHub('https://api.github.com/user', userToken)
      : await fetchGitHub(`https://api.github.com/users/${username}`);

    // 2. Fetch all public/private repos to count stars and forks received (max 3 pages = 300 repos)
    let totalStars = 0;
    let forksReceived = 0;
    let page = 1;
    let hasMoreRepos = true;

    while (hasMoreRepos && page <= 3) {
      const reposUrl = userToken
        ? `https://api.github.com/user/repos?per_page=100&page=${page}&visibility=all&affiliation=owner`
        : `https://api.github.com/users/${username}/repos?per_page=100&page=${page}`;

      const repos = await fetchGitHub(reposUrl, userToken);
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

    // 3. Get total commits, PRs, and Issues from Search API
    // Commits
    let totalCommits = 0;
    try {
      const commitsSearch = await fetchGitHub(
        `https://api.github.com/search/commits?q=author:${username}`,
        userToken,
        { Accept: 'application/vnd.github.cloak-preview+json' }
      );
      totalCommits = commitsSearch.total_count || 0;
    } catch (e) {
      console.warn(`Could not fetch commits for ${username}:`, e);
    }

    // PRs
    let totalPRs = 0;
    try {
      const prsSearch = await fetchGitHub(
        `https://api.github.com/search/issues?q=author:${username}+type:pr`,
        userToken
      );
      totalPRs = prsSearch.total_count || 0;
    } catch (e) {
      console.warn(`Could not fetch PRs for ${username}:`, e);
    }

    // Issues
    let totalIssues = 0;
    try {
      const issuesSearch = await fetchGitHub(
        `https://api.github.com/search/issues?q=author:${username}+type:issue`,
        userToken
      );
      totalIssues = issuesSearch.total_count || 0;
    } catch (e) {
      console.warn(`Could not fetch issues for ${username}:`, e);
    }

    // Compute dynamic Developer Rank
    // Formula: Commits*1 + PRs*3 + Issues*1 + Stars*5 + Followers*8
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

    // Compute Collaboration Index (overhead of collaborative contributions)
    const collaborationIndex = Math.min(
      100,
      Math.round(((totalPRs + totalIssues) / (totalCommits + totalPRs + totalIssues + 1)) * 100)
    );

    const data: UserStats = {
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

    statsCache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.error(`Error fetching stats for user ${username}:`, error);
    throw error;
  }
}

/**
 * Fetch top programming languages for a specific GitHub user
 */
export async function getUserLanguages(
  username: string,
  userToken?: string
): Promise<LanguageStat[]> {
  const cacheKey = `${username.toLowerCase()}:${userToken ? 'private' : 'public'}`;
  const cached = languagesCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const nonForkRepos: any[] = [];
    let page = 1;
    let hasMoreRepos = true;

    while (hasMoreRepos && page <= 3) {
      const reposUrl = userToken
        ? `https://api.github.com/user/repos?per_page=100&page=${page}&visibility=all&affiliation=owner`
        : `https://api.github.com/users/${username}/repos?per_page=100&page=${page}`;

      const repos = await fetchGitHub(reposUrl, userToken);
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

    // Fetch language breakdown for each non-fork repository in parallel
    const languageMap: Record<string, { count: number; size: number }> = {};
    const CONCURRENCY_LIMIT = 15;

    for (let i = 0; i < nonForkRepos.length; i += CONCURRENCY_LIMIT) {
      const batch = nonForkRepos.slice(i, i + CONCURRENCY_LIMIT);
      await Promise.all(
        batch.map(async (repo) => {
          try {
            const ownerLogin = repo.owner?.login || username;
            const repoLangs = await fetchGitHub(
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

    // Convert map to array
    const statsArray: LanguageStat[] = [];
    let totalSize = 0;

    for (const [name, data] of Object.entries(languageMap)) {
      totalSize += data.size;
      statsArray.push({
        name,
        count: data.count,
        size: data.size,
        percentage: 0, // calculated below
        color: LANGUAGE_COLORS[name] || DEFAULT_COLOR
      });
    }

    // Sort by size descending and calculate percentages
    statsArray.sort((a, b) => b.size - a.size);

    const result = statsArray.map((stat) => ({
      ...stat,
      percentage: totalSize > 0 ? parseFloat(((stat.size / totalSize) * 100).toFixed(1)) : 0
    }));

    // Keep top 6 languages, aggregate the rest as "Otros" if needed
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

    languagesCache.set(cacheKey, { data: topLanguages, timestamp: Date.now() });
    return topLanguages;
  } catch (error) {
    console.error(`Error fetching languages for user ${username}:`, error);
    throw error;
  }
}

export interface StreakStats {
  username: string;
  totalContributions: number;
  currentStreak: number;
  longestStreak: number;
  currentStreakStart: string; // ISO date string, e.g. "2026-07-14"
  currentStreakEnd: string;
  longestStreakStart: string;
  longestStreakEnd: string;
  firstContributionDate: string;
}

const streakCache = new Map<string, CacheEntry<StreakStats>>();

/**
 * Fetch contribution streak stats by scraping GitHub's public contributions page.
 * No authentication required — the page is public for any user.
 */
export async function getUserStreak(username: string): Promise<StreakStats> {
  const cacheKey = username.toLowerCase();
  const cached = streakCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
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

  // Extract all contribution days: date and level from <td> elements
  const tdRegex = /data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="(\d)"/g;
  const contributions: { date: string; level: number }[] = [];

  let match: RegExpExecArray | null;
  while ((match = tdRegex.exec(html)) !== null) {
    contributions.push({ date: match[1], level: Number.parseInt(match[2], 10) });
  }

  // Sort by date ascending
  contributions.sort((a, b) => a.date.localeCompare(b.date));

  if (contributions.length === 0) {
    throw new Error(`No contribution data found for user: ${username}`);
  }

  // Calculate total contributions (count days with level > 0)
  const totalContributions = contributions.filter((c) => c.level > 0).length;

  // Determine first contribution date
  const firstContribEntry = contributions.find((c) => c.level > 0);
  const firstContributionDate = firstContribEntry ? firstContribEntry.date : contributions[0].date;

  // Helper: parse ISO date string into a Date object (UTC)
  function parseDate(d: string): Date {
    return new Date(d + 'T00:00:00Z');
  }

  // Helper: add days to a date
  function addDays(d: Date, n: number): Date {
    const copy = new Date(d);
    copy.setUTCDate(copy.getUTCDate() + n);
    return copy;
  }

  // Helper: format Date back to YYYY-MM-DD
  function fmt(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  // Build a lookup set of dates with contributions
  const activeDays = new Set(contributions.filter((c) => c.level > 0).map((c) => c.date));

  // Compute longest streak
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

  // Compute current streak (working backwards from today)
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayStr = fmt(today);
  const yesterdayStr = fmt(addDays(today, -1));

  let currentStreak = 0;
  let currentStreakStart = '';
  let currentStreakEnd = '';

  // Start from today; if today has no contribution, try yesterday (same as streak-stats behaviour)
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

  const data: StreakStats = {
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

  streakCache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

export interface RepoStats {
  name: string;
  owner: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  languageColor: string;
  license: string;
}

const repoCache = new Map<string, CacheEntry<RepoStats>>();

/**
 * Fetch stats for a specific featured repository
 */
export async function getFeaturedRepo(
  username: string,
  repoName?: string,
  userToken?: string
): Promise<RepoStats> {
  const cacheKey = `${username.toLowerCase()}:${(repoName || '').toLowerCase()}:${userToken ? 'private' : 'public'}`;
  const cached = repoCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    let repoData: any;

    if (repoName) {
      // Fetch specific repository (could be private if userToken is set)
      repoData = await fetchGitHub(
        `https://api.github.com/repos/${username}/${repoName}`,
        userToken
      );
    } else {
      // Find the repository with the highest stars that is not a fork
      let bestRepo: any = null;
      let page = 1;
      let hasMoreRepos = true;

      while (hasMoreRepos && page <= 3) {
        const reposUrl = userToken
          ? `https://api.github.com/user/repos?per_page=100&page=${page}&visibility=all&affiliation=owner`
          : `https://api.github.com/users/${username}/repos?per_page=100&page=${page}`;

        const repos = await fetchGitHub(reposUrl, userToken);
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

    const data: RepoStats = {
      name,
      owner,
      description,
      stars,
      forks,
      language,
      languageColor,
      license
    };

    repoCache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.error(
      `Error fetching repository stats for ${username}/${repoName || 'featured'}:`,
      error
    );
    throw error;
  }
}

/**
 * Clear in-memory caches for a specific user to ensure fresh data is fetched after token registration/revocation
 */
export function clearUserCache(username: string): void {
  const keyBase = username.toLowerCase();
  statsCache.delete(`${keyBase}:public`);
  statsCache.delete(`${keyBase}:private`);
  languagesCache.delete(`${keyBase}:public`);
  languagesCache.delete(`${keyBase}:private`);

  for (const key of repoCache.keys()) {
    if (key.startsWith(`${keyBase}:`)) {
      repoCache.delete(key);
    }
  }
}
