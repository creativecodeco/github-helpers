import { UserStats } from '@/domain/entities/UserStats';
import { getTheme, getBackgroundDef } from './theme';
import { getTranslations } from './i18n';

export function renderRankCard(
  stats: UserStats,
  themeName?: string,
  overrides?: Record<string, string>
): string {
  const theme = getTheme(themeName, overrides);
  const t = getTranslations(overrides?.locale);
  const cardWidth = 495;
  const cardHeight = 195;
  const widthAttr = overrides?.cardWidth || `${cardWidth}`;

  // Background style: gradient support
  const backgroundDef = getBackgroundDef(theme, 'bg');

  // Collaboration bar width calculations
  const colBarWidth = 280;
  const filledWidth = Math.round((stats.collaborationIndex / 100) * colBarWidth);

  // Rank description or rank level explanation
  let rankDesc = t.rank.rankGrowing;
  if (stats.rank === 'S+' || stats.rank === 'S') {
    rankDesc = t.rank.rankLegendary;
  } else if (stats.rank === 'A+' || stats.rank === 'A') {
    rankDesc = t.rank.rankOutstanding;
  } else if (stats.rank === 'B+' || stats.rank === 'B') {
    rankDesc = t.rank.rankActive;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${widthAttr}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}">
      <defs>
        ${backgroundDef}
        <style>
          .rank-val { font-family: 'Segoe UI', Ubuntu, sans-serif; font-weight: 900; font-size: 38px; fill: ${theme.accent}; }
          .rank-lbl { font-family: 'Segoe UI', Ubuntu, sans-serif; font-weight: 500; font-size: 11px; fill: ${theme.secondary}; letter-spacing: 1.5px; }
          .title { font-family: 'Segoe UI', Ubuntu, sans-serif; font-weight: 700; font-size: 15px; fill: ${theme.title}; }
          .subtitle { font-family: 'Segoe UI', Ubuntu, sans-serif; font-weight: 400; font-size: 11.5px; fill: ${theme.secondary}; }
          .metric-lbl { font-family: 'Segoe UI', Ubuntu, sans-serif; font-weight: 600; font-size: 12px; fill: ${theme.text}; }
          .metric-val { font-family: 'Segoe UI', Ubuntu, sans-serif; font-weight: 700; font-size: 13px; fill: ${theme.accent}; }
          .bar-bg { fill: ${theme.border}; opacity: 0.5; }
          .bar-fill { fill: ${theme.accent}; }
        </style>
      </defs>

      <!-- Card Background -->
      <rect width="${cardWidth}" height="${cardHeight}" rx="12" fill="url(#bg)" stroke="${theme.border}" stroke-width="1.5" />

      <!-- Left Section: Rank Badge -->
      <g transform="translate(25, 48)">
        <rect width="100" height="100" rx="16" fill="${theme.accent}10" stroke="${theme.accent}" stroke-width="2" />
        <text x="50" y="38" text-anchor="middle" class="rank-lbl">RANK</text>
        <text x="50" y="78" text-anchor="middle" class="rank-val">${stats.rank}</text>
      </g>

      <!-- Right Section: Details -->
      <g transform="translate(150, 52)">
        <text x="0" y="10" class="title">${t.rank.title}</text>
        <text x="0" y="28" class="subtitle">${rankDesc}</text>
        
        <!-- Collaboration Progress Bar -->
        <g transform="translate(0, 48)">
          <text x="0" y="12" class="metric-lbl">${t.rank.collab}</text>
          <text x="280" y="12" text-anchor="end" class="metric-val">${stats.collaborationIndex}%</text>
          
          <!-- Bar container -->
          <rect x="0" y="20" width="${colBarWidth}" height="8" rx="4" class="bar-bg" />
          <rect x="0" y="20" width="${filledWidth}" height="8" rx="4" class="bar-fill" />
        </g>
      </g>

      <!-- Brand Logo / Subtitle -->
      <text x="470" y="25" text-anchor="end" font-family="'Segoe UI', Ubuntu, sans-serif" font-weight="600" font-size="9px" fill="${theme.secondary}" opacity="0.6">
        github.com/${stats.username}
      </text>
    </svg>
  `.trim();
}
