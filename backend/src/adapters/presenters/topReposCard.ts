import { RepoStats } from '@/domain/entities/RepoStats';
import { getTheme } from './theme';

export function renderTopReposCard(
  repos: RepoStats[],
  themeName?: string,
  overrides?: Record<string, string>
): string {
  const theme = getTheme(themeName, overrides);
  const cardWidth = 495;
  const cardHeight = 300;
  const widthAttr = overrides?.cardWidth || `${cardWidth}`;

  const backgroundDef = theme.bgGradient
    ? `<linearGradient id="bg-top" x1="0%" y1="0%" x2="100%" y2="100%">
         <stop offset="0%" stop-color="${theme.bgGradient.match(/#[0-9a-fA-F]{3,8}/g)?.[0] || theme.bg}" />
         <stop offset="100%" stop-color="${theme.bgGradient.match(/#[0-9a-fA-F]{3,8}/g)?.[1] || theme.bg}" />
       </linearGradient>`
    : `<linearGradient id="bg-top" x1="0%" y1="0%" x2="100%" y2="100%">
         <stop offset="0%" stop-color="${theme.bg}" />
         <stop offset="100%" stop-color="${theme.bg}" />
       </linearGradient>`;

  const top4 = repos.slice(0, 4);

  const ROW_HEIGHT = 58;
  const HEADER_HEIGHT = 42;

  const repoRows = top4
    .map((repo, i) => {
      const y = HEADER_HEIGHT + i * ROW_HEIGHT;
      const desc = repo.description.length > 52 ? repo.description.slice(0, 49) + '…' : repo.description;
      const repoName = repo.name.length > 28 ? repo.name.slice(0, 25) + '…' : repo.name;

      return `
      <g transform="translate(0, ${y})">
        <rect x="20" y="4" width="455" height="52" rx="8"
          fill="${theme.secondary}" fill-opacity="0.07"
          stroke="${theme.border}" stroke-width="0.8" stroke-opacity="0.5" />

        <!-- Repo name -->
        <circle cx="40" cy="20" r="5" fill="${repo.languageColor}" />
        <text x="52" y="24" font-family="'Segoe UI', Ubuntu, sans-serif" font-weight="700"
          font-size="13" fill="${theme.title}">${escXml(repoName)}</text>

        <!-- Description -->
        <text x="22" y="42" font-family="'Segoe UI', Ubuntu, sans-serif" font-weight="400"
          font-size="11" fill="${theme.text}">${escXml(desc)}</text>

        <!-- Stars -->
        <g transform="translate(330, 13)">
          <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z"
            fill="${theme.accent}" transform="scale(0.8)" />
          <text x="13" y="10" font-family="'Segoe UI', Ubuntu, sans-serif" font-weight="600"
            font-size="11" fill="${theme.accent}">${formatCount(repo.stars)}</text>
        </g>

        <!-- Forks -->
        <g transform="translate(385, 13)">
          <path d="M5 3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zm0 2.122a2.25 2.25 0 1 0-1.5 0v.803a2.25 2.25 0 0 0 1.673 2.166L5 9.153v1.597a2.25 2.25 0 1 0 1.5 0V9.153l.827-.812a2.25 2.25 0 0 0 1.673-2.166v-.803a2.25 2.25 0 1 0-1.5 0v.803a.75.75 0 0 1-.524.716L7 6.5H5l-.476.09a.75.75 0 0 1-.524-.716v-.803z"
            fill="${theme.secondary}" transform="scale(0.8)" />
          <text x="13" y="10" font-family="'Segoe UI', Ubuntu, sans-serif" font-weight="600"
            font-size="11" fill="${theme.secondary}">${formatCount(repo.forks)}</text>
        </g>

        <!-- Language -->
        <text x="440" y="24" text-anchor="end" font-family="'Segoe UI', Ubuntu, sans-serif"
          font-size="10" fill="${repo.languageColor}" font-weight="600">${escXml(repo.language)}</text>
      </g>`;
    })
    .join('');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${widthAttr}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}">
      <defs>
        ${backgroundDef}
        <style>
          .tr-title { font-family: 'Segoe UI', Ubuntu, sans-serif; font-weight: 700; font-size: 15px; fill: ${theme.title}; }
          .tr-brand { font-family: 'Segoe UI', Ubuntu, sans-serif; font-weight: 600; font-size: 9px; fill: ${theme.secondary}; opacity: 0.6; }
        </style>
      </defs>

      <!-- Background -->
      <rect width="${cardWidth}" height="${cardHeight}" rx="12" fill="url(#bg-top)" />
      <rect width="${cardWidth}" height="${cardHeight}" rx="12" fill="none" stroke="${theme.border}" stroke-width="1" />

      <!-- Header icon -->
      <g transform="translate(22, 14)">
        <path d="M3 2.75A2.75 2.75 0 0 1 5.75 0h14.5a.75.75 0 0 1 .75.75v20.5a.75.75 0 0 1-.75.75h-6a.75.75 0 0 1 0-1.5h5.25v-4H5.75A2.75 2.75 0 0 1 3 14.25v-11.5zm1.5 0v11.5c0 .69.56 1.25 1.25 1.25H20v-9.5H5.75a2.75 2.75 0 0 1-2.75-2.75c0-.69.56-1.25 1.25-1.25h12.75a.75.75 0 0 1 0 1.5H4.5z"
          fill="${theme.accent}" transform="scale(0.82)" />
      </g>
      <text x="44" y="26" class="tr-title">Top Repositorios</text>
      <text x="473" y="22" text-anchor="end" class="tr-brand">CreativeCode.com.co</text>

      <!-- Divider -->
      <line x1="20" y1="38" x2="475" y2="38" stroke="${theme.border}" stroke-width="0.8" stroke-opacity="0.5"/>

      ${repoRows}
    </svg>
  `.trim();
}

function escXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
