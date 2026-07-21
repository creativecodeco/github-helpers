import { UserStats } from '@/domain/entities/UserStats';
import { LanguageStat } from '@/domain/entities/LanguageStat';
import { getTheme } from './theme';
import { getTranslations } from './i18n';

interface TrophyData {
  category: string;
  title: string;
  rank: 'S' | 'A' | 'B' | 'C';
  valueText: string;
  color: string;
}

const RANK_COLORS = {
  S: '#ff2a5f', // Pink-red
  A: '#ffb300', // Gold
  B: '#90a4ae', // Silver
  C: '#8d6e63' // Bronze
};

// Trophy Cup SVG path
const TROPHY_PATH =
  'M19 5h-2V3H7v2H5C3.9 5 3 5.9 3 7v3c0 2.8 2.2 5 5 5h1.2c.6 1.8 2.2 3.1 4.1 3.4V20H10v2h4v-2h-3.3v-1.6c1.9-.3 3.5-1.6 4.1-3.4H16c2.8 0 5-2.2 5-5V7c0-1.1-.9-2-2-2zM5 10V7h2v3c0 1.1-.9 2-2 2s-2-.9-2-2zm14 0c0 1.1-.9 2-2 2s-2-.9-2-2V7h2v3z';

export function renderTrophiesCard(
  stats: UserStats,
  languages: LanguageStat[],
  themeName?: string,
  overrides?: Record<string, string>
): string {
  const theme = getTheme(themeName, overrides);
  const t = getTranslations(overrides?.locale);
  const isEn = overrides?.locale === 'en';

  // 1. Commits Trophy
  let commitsRank: 'S' | 'A' | 'B' | 'C' = 'C';
  let commitsTitle = isEn ? 'Novice' : 'Novato';
  if (stats.totalCommits >= 2000) {
    commitsRank = 'S';
    commitsTitle = 'Commit Master';
  } else if (stats.totalCommits >= 500) {
    commitsRank = 'A';
    commitsTitle = 'Hard Committer';
  } else if (stats.totalCommits >= 100) {
    commitsRank = 'B';
    commitsTitle = 'Commits Pro';
  }

  // 2. Stars Trophy
  let starsRank: 'S' | 'A' | 'B' | 'C' = 'C';
  let starsTitle = 'Spark';
  if (stats.totalStars >= 100) {
    starsRank = 'S';
    starsTitle = 'Starlight Master';
  } else if (stats.totalStars >= 50) {
    starsRank = 'A';
    starsTitle = 'Supernova';
  } else if (stats.totalStars >= 10) {
    starsRank = 'B';
    starsTitle = 'Constellation';
  }

  // 3. PRs Trophy
  let prsRank: 'S' | 'A' | 'B' | 'C' = 'C';
  let prsTitle = 'First Pull';
  if (stats.totalPRs >= 100) {
    prsRank = 'S';
    prsTitle = 'PR Master';
  } else if (stats.totalPRs >= 30) {
    prsRank = 'A';
    prsTitle = 'PR Champion';
  } else if (stats.totalPRs >= 10) {
    prsRank = 'B';
    prsTitle = 'Hyper Puller';
  }

  // 4. Followers Trophy
  let followersRank: 'S' | 'A' | 'B' | 'C' = 'C';
  let followersTitle = 'First Friend';
  if (stats.followers >= 100) {
    followersRank = 'S';
    followersTitle = 'Crowd Leader';
  } else if (stats.followers >= 50) {
    followersRank = 'A';
    followersTitle = 'Influencer';
  } else if (stats.followers >= 10) {
    followersRank = 'B';
    followersTitle = 'Social Dev';
  }

  // 5. Repositories Trophy
  let reposRank: 'S' | 'A' | 'B' | 'C' = 'C';
  let reposTitle = 'First Repo';
  if (stats.publicRepos >= 50) {
    reposRank = 'S';
    reposTitle = 'Monorepo Builder';
  } else if (stats.publicRepos >= 20) {
    reposRank = 'A';
    reposTitle = 'Project Manager';
  } else if (stats.publicRepos >= 5) {
    reposRank = 'B';
    reposTitle = 'Creator';
  }

  // 6. MultiLanguage Trophy
  const validLanguages = languages.filter((lang) => lang.name !== 'Otros');
  let langRank: 'S' | 'A' | 'B' | 'C' = 'C';
  let langTitle = 'Bilingual';
  if (validLanguages.length >= 5) {
    langRank = 'S';
    langTitle = 'Language Wizard';
  } else if (validLanguages.length >= 4) {
    langRank = 'A';
    langTitle = 'Rainbow Coder';
  } else if (validLanguages.length >= 3) {
    langRank = 'B';
    langTitle = 'Polyglot';
  }

  const trophies: TrophyData[] = [
    {
      category: 'COMMITS',
      title: commitsTitle,
      rank: commitsRank,
      valueText: `${stats.totalCommits} commits`,
      color: RANK_COLORS[commitsRank]
    },
    {
      category: 'STARS',
      title: starsTitle,
      rank: starsRank,
      valueText: `${stats.totalStars} ${isEn ? 'stars' : 'estrellas'}`,
      color: RANK_COLORS[starsRank]
    },
    {
      category: 'PULL REQUESTS',
      title: prsTitle,
      rank: prsRank,
      valueText: `${stats.totalPRs} PRs`,
      color: RANK_COLORS[prsRank]
    },
    {
      category: 'FOLLOWERS',
      title: followersTitle,
      rank: followersRank,
      valueText: `${stats.followers} ${isEn ? 'followers' : 'seguidores'}`,
      color: RANK_COLORS[followersRank]
    },
    {
      category: 'REPOSITORIES',
      title: reposTitle,
      rank: reposRank,
      valueText: `${stats.publicRepos} ${isEn ? 'repos' : 'repositorios'}`,
      color: RANK_COLORS[reposRank]
    },
    {
      category: 'LANGUAGES',
      title: langTitle,
      rank: langRank,
      valueText: `${validLanguages.length} ${isEn ? 'languages' : 'lenguajes'}`,
      color: RANK_COLORS[langRank]
    }
  ];

  const cardWidth = 495;
  const cardHeight = 195;
  const widthAttr = overrides?.cardWidth || `${cardWidth}`;

  const backgroundDef = theme.bgGradient
    ? `<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
         <stop offset="0%" stop-color="${theme.bgGradient.match(/#[0-9a-fA-F]{3,8}/g)?.[0] || theme.bg}" />
         <stop offset="100%" stop-color="${theme.bgGradient.match(/#[0-9a-fA-F]{3,8}/g)?.[1] || theme.bg}" />
       </linearGradient>`
    : `<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
         <stop offset="0%" stop-color="${theme.bg}" />
         <stop offset="100%" stop-color="${theme.bg}" />
       </linearGradient>`;

  // Render the 6 trophy boxes
  let boxesSvg = '';
  const boxWidth = 145;
  const boxHeight = 70;
  const colGap = 10;
  const rowGap = 10;
  const paddingX = 20;
  const paddingY = 25;

  trophies.forEach((trophy, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);

    const x = paddingX + col * (boxWidth + colGap);
    const y = paddingY + row * (boxHeight + rowGap);

    boxesSvg += `
      <g transform="translate(${x}, ${y})">
        <!-- Box Background -->
        <rect width="${boxWidth}" height="${boxHeight}" rx="8" fill="${theme.bg}" stroke="${theme.border}" stroke-width="1" opacity="0.4" />
        
        <!-- Trophy Icon -->
        <g transform="translate(10, 18)" class="glow-${trophy.rank}">
          <path d="${TROPHY_PATH}" fill="${trophy.color}" transform="scale(1.5)" />
          <!-- Rank Letter -->
          <text x="18" y="17" font-family="'Segoe UI', Ubuntu, Sans-Serif" font-weight="900" font-size="10" text-anchor="middle" fill="#000" stroke="#fff" stroke-width="0.3">${trophy.rank}</text>
        </g>

        <!-- Trophy Info -->
        <g transform="translate(54, 18)">
          <text x="0" y="8" font-family="'Segoe UI', Ubuntu, Sans-Serif" font-weight="700" font-size="9" fill="${theme.secondary}" opacity="0.8" letter-spacing="0.5">${trophy.category}</text>
          <text x="0" y="22" font-family="'Segoe UI', Ubuntu, Sans-Serif" font-weight="700" font-size="11.5" fill="${theme.title}">${trophy.title}</text>
          <text x="0" y="36" font-family="'Segoe UI', Ubuntu, Sans-Serif" font-weight="600" font-size="10.5" fill="${theme.accent}">${trophy.valueText}</text>
        </g>
      </g>
    `;
  });

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${widthAttr}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}">
      <defs>
        ${backgroundDef}
        <style>
          .header-title { font-family: 'Segoe UI', Ubuntu, Sans-Serif; font-weight: 700; font-size: 14px; fill: ${theme.title}; }
          .glow-S { filter: drop-shadow(0px 0px 4px ${RANK_COLORS.S}66); }
          .glow-A { filter: drop-shadow(0px 0px 4px ${RANK_COLORS.A}66); }
          .glow-B { filter: drop-shadow(0px 0px 4px ${RANK_COLORS.B}66); }
          .glow-C { filter: drop-shadow(0px 0px 4px ${RANK_COLORS.C}66); }
        </style>
      </defs>

      <!-- Card Background -->
      <rect width="${cardWidth}" height="${cardHeight}" rx="12" fill="url(#bg)" stroke="${theme.border}" stroke-width="1.5" />

      <!-- Trophies Grid -->
      ${boxesSvg}
    </svg>
  `;
}
