import { UserStats } from '@/domain/entities/UserStats';
import { getTheme, getBackgroundDef } from './theme';
import { getTranslations } from './i18n';

// Helper to convert avatar to Base64 to bypass GitHub camo block
async function fetchAvatarBase64(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    if (!res.ok) return '';
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = res.headers.get('content-type') || 'image/jpeg';
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  } catch (e) {
    console.warn('Failed to fetch avatar for base64 encoding:', e);
    return '';
  }
}

// Crisp SVGs for metrics icons
const ICONS = {
  commit: `<path d="M10.8 17.6c-3.1 0-5.6-2.5-5.6-5.6s2.5-5.6 5.6-5.6 5.6 2.5 5.6 5.6-2.5 5.6-5.6 5.6zm0-9.6c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm-8.8 4h3.2v1.6H2v-1.6zm13.6 0h3.2v1.6h-3.2v-1.6z"/>`,
  star: `<path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.786 1.4 8.167L12 18.896l-7.334 3.857 1.4-8.167L.132 9.21l8.2-1.192L12 .587z"/>`,
  pr: `<path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v5.256a2.251 2.251 0 101.5 0V5.372zm11.5-2.122a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.802a2.877 2.877 0 00-.83 1.17 2.877 2.877 0 00-.182 1.096c0 .75-.297 1.488-.83 2.02l-.002.002a2.87 2.87 0 00-.829 2.02v.07a2.251 2.251 0 101.5 0v-.07a1.371 1.371 0 01.398-.966l.002-.002a4.372 4.372 0 001.261-3.076c0-.528.093-1.048.273-1.536a4.373 4.373 0 00.569-.877v-.802zM15 13.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/>`,
  issue: `<path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm1-15v6h-2V7h2zm0 8v2h-2v-2h2z"/>`,
  fork: `<path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.803c0 .528.093 1.048.273 1.536a4.387 4.387 0 001.42 2.138l3.11 2.333v3.197a2.251 2.251 0 101.5 0v-3.79c0-.529-.093-1.05-.273-1.538a4.387 4.387 0 00-1.42-2.137l-3.11-2.333V5.372zm6.5-2.122a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.803a4.389 4.389 0 001.693 3.447l3.11 2.333v3.197a2.251 2.251 0 101.5 0v-3.79a4.389 4.389 0 00-1.693-3.447l-3.11-2.333V5.372zM15 13.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/>`,
  followers: `<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>`
};

export async function renderStatsCard(
  stats: UserStats,
  themeName?: string,
  overrides?: Record<string, string>
): Promise<string> {
  const theme = getTheme(themeName, overrides);
  const t = getTranslations(overrides?.locale);
  const avatarBase64 = await fetchAvatarBase64(stats.avatarUrl);

  const cardWidth = 495;
  const cardHeight = 195;
  const widthAttr = overrides?.cardWidth || `${cardWidth}`;

  // Background style: gradient support
  const backgroundDef = getBackgroundDef(theme, 'bg');

  // Fallback avatar icon if fetch failed
  const avatarSvg = avatarBase64
    ? `<image href="${avatarBase64}" x="25" y="25" width="70" height="70" clip-path="url(#circle-clip)" />`
    : `<circle cx="60" cy="60" r="35" fill="${theme.secondary}" opacity="0.3"/>
       <path d="M60 45a10 10 0 100 20 10 10 0 000-20zm0 25c-11.67 0-21 5.33-21 12v3h42v-3c0-6.67-9.33-12-21-12z" fill="${theme.text}" />`;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${widthAttr}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}">
      <defs>
        ${backgroundDef}
        <clipPath id="circle-clip">
          <circle cx="60" cy="60" r="35" />
        </clipPath>
        <style>
          .title { font-family: 'Segoe UI', Ubuntu, Sans-Serif; font-weight: 700; font-size: 16px; fill: ${theme.title}; }
          .username { font-family: 'Segoe UI', Ubuntu, Sans-Serif; font-weight: 400; font-size: 13px; fill: ${theme.secondary}; }
          .label { font-family: 'Segoe UI', Ubuntu, Sans-Serif; font-weight: 500; font-size: 13.5px; fill: ${theme.text}; }
          .value { font-family: 'Segoe UI', Ubuntu, Sans-Serif; font-weight: 700; font-size: 14px; fill: ${theme.accent}; }
          .stat-icon { fill: ${theme.accent}; }
          .glow { filter: drop-shadow(0px 0px 4px ${theme.accent}33); }
        </style>
      </defs>

      <!-- Card Background -->
      <rect width="${cardWidth}" height="${cardHeight}" rx="12" fill="url(#bg)" stroke="${theme.border}" stroke-width="1.5" />

      <!-- Avatar & Name -->
      <g>
        ${avatarSvg}
        <text x="110" y="55" class="title">${stats.name}</text>
        <text x="110" y="73" class="username">@${stats.username}</text>
      </g>

      <!-- Decorative Divider -->
      <line x1="25" y1="110" x2="470" y2="110" stroke="${theme.border}" stroke-dasharray="2, 2" stroke-width="1" />

      <!-- Statistics Grid -->
      <!-- Row 1: Commits, Stars, Followers -->
      <g transform="translate(25, 125)">
        <!-- Commits -->
        <g transform="translate(0, 0)">
          <svg class="stat-icon" viewBox="0 0 24 24" width="18" height="18" x="0" y="0">
            ${ICONS.commit}
          </svg>
          <text x="24" y="14" class="label">${t.stats.commits}</text>
          <text x="100" y="14" class="value">${stats.totalCommits}</text>
        </g>
        
        <!-- Stars -->
        <g transform="translate(150, 0)">
          <svg class="stat-icon glow" viewBox="0 0 24 24" width="18" height="18" x="0" y="0">
            ${ICONS.star}
          </svg>
          <text x="24" y="14" class="label">${t.stats.stars}</text>
          <text x="100" y="14" class="value">${stats.totalStars}</text>
        </g>

        <!-- Followers -->
        <g transform="translate(300, 0)">
          <svg class="stat-icon" viewBox="0 0 24 24" width="18" height="18" x="0" y="0">
            ${ICONS.followers}
          </svg>
          <text x="24" y="14" class="label">${t.stats.followers}</text>
          <text x="110" y="14" class="value">${stats.followers}</text>
        </g>
      </g>

      <!-- Row 2: Pull Requests, Issues, Forks -->
      <g transform="translate(25, 155)">
        <!-- PRs -->
        <g transform="translate(0, 0)">
          <svg class="stat-icon" viewBox="0 0 24 24" width="18" height="18" x="0" y="0">
            ${ICONS.pr}
          </svg>
          <text x="24" y="14" class="label">${t.stats.prs}</text>
          <text x="100" y="14" class="value">${stats.totalPRs}</text>
        </g>

        <!-- Issues -->
        <g transform="translate(150, 0)">
          <svg class="stat-icon" viewBox="0 0 24 24" width="18" height="18" x="0" y="0">
            ${ICONS.issue}
          </svg>
          <text x="24" y="14" class="label">${t.stats.issues}</text>
          <text x="100" y="14" class="value">${stats.totalIssues}</text>
        </g>

        <!-- Forks -->
        <g transform="translate(300, 0)">
          <svg class="stat-icon" viewBox="0 0 24 24" width="18" height="18" x="0" y="0">
            ${ICONS.fork}
          </svg>
          <text x="24" y="14" class="label">${t.stats.forks}</text>
          <text x="110" y="14" class="value">${stats.forksReceived}</text>
        </g>
      </g>
      
      <!-- Brand Logo / Subtitle -->
      <text x="470" y="25" text-anchor="end" font-family="'Segoe UI', Ubuntu, Sans-Serif" font-weight="600" font-size="9px" fill="${theme.secondary}" opacity="0.6">
        github.com/${stats.username}
      </text>
    </svg>
  `.trim();
}
