import { StreakStats } from '../github';
import { getTheme } from './theme';

// Friendly month abbreviations
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(iso: string): string {
  if (!iso) return '';
  const [, m, d] = iso.split('-');
  const month = MONTHS[Number.parseInt(m, 10) - 1];
  return `${month} ${Number.parseInt(d, 10)}`;
}

function formatDateFull(iso: string): string {
  if (!iso) return '';
  const [, m, d] = iso.split('-');
  const month = MONTHS[Number.parseInt(m, 10) - 1];
  const [y] = iso.split('-');
  return `${month} ${Number.parseInt(d, 10)}, ${y}`;
}

export function renderStreakCard(
  stats: StreakStats,
  themeName?: string,
  overrides?: Record<string, string>
): string {
  const theme = getTheme(themeName, overrides);

  const cardWidth = 495;
  const cardHeight = 195;

  // Background gradient definition
  const backgroundDef = theme.bgGradient
    ? `<linearGradient id="bg-streak" x1="0%" y1="0%" x2="100%" y2="100%">
         <stop offset="0%" stop-color="${theme.bgGradient.match(/#[0-9a-fA-F]{3,8}/g)?.[0] || theme.bg}" />
         <stop offset="100%" stop-color="${theme.bgGradient.match(/#[0-9a-fA-F]{3,8}/g)?.[1] || theme.bg}" />
       </linearGradient>`
    : `<linearGradient id="bg-streak" x1="0%" y1="0%" x2="100%" y2="100%">
         <stop offset="0%" stop-color="${theme.bg}" />
         <stop offset="100%" stop-color="${theme.bg}" />
       </linearGradient>`;

  // Date range labels
  const totalRange = stats.firstContributionDate
    ? `${formatDateFull(stats.firstContributionDate)} - Present`
    : 'N/A';

  const currentStreakRange =
    stats.currentStreak > 0
      ? stats.currentStreakStart === stats.currentStreakEnd
        ? formatDate(stats.currentStreakEnd)
        : `${formatDate(stats.currentStreakStart)} - ${formatDate(stats.currentStreakEnd)}`
      : 'No active streak';

  const longestStreakRange =
    stats.longestStreak > 0
      ? stats.longestStreakStart === stats.longestStreakEnd
        ? `${formatDateFull(stats.longestStreakStart)}`
        : `${formatDateFull(stats.longestStreakStart)} - ${formatDateFull(stats.longestStreakEnd)}`
      : 'N/A';

  // Column x centers
  const col1 = 82;
  const col2 = 247;
  const col3 = 413;

  // Accent color for current streak ring (use title color which is typically vibrant)
  const ringColor = theme.title;
  const fireColor = theme.title;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${cardWidth}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}">
  <defs>
    ${backgroundDef}
    <style>
      .streak-big   { font-family: 'Segoe UI', Ubuntu, Sans-Serif; font-weight: 700; font-size: 28px; }
      .streak-label { font-family: 'Segoe UI', Ubuntu, Sans-Serif; font-weight: 600; font-size: 13px; }
      .streak-sub   { font-family: 'Segoe UI', Ubuntu, Sans-Serif; font-weight: 400; font-size: 11px; }
      .streak-brand { font-family: 'Segoe UI', Ubuntu, Sans-Serif; font-weight: 600; font-size: 9px; }
    </style>
  </defs>

  <!-- Card Background -->
  <rect width="${cardWidth}" height="${cardHeight}" rx="12" fill="url(#bg-streak)" stroke="${theme.border}" stroke-width="1.5"/>

  <!-- Divider 1 -->
  <line x1="164" y1="28" x2="164" y2="168" stroke="${theme.border}" stroke-width="1.5" opacity="0.8"/>
  <!-- Divider 2 -->
  <line x1="330" y1="28" x2="330" y2="168" stroke="${theme.border}" stroke-width="1.5" opacity="0.8"/>

  <!-- ── Column 1: Total Contributions ── -->
  <!-- Big number -->
  <text x="${col1}" y="100" text-anchor="middle" class="streak-big" fill="${theme.accent}">${stats.totalContributions}</text>
  <!-- Label -->
  <text x="${col1}" y="124" text-anchor="middle" class="streak-label" fill="${theme.text}">Total Contributions</text>
  <!-- Date sub-label -->
  <text x="${col1}" y="143" text-anchor="middle" class="streak-sub" fill="${theme.secondary}">${totalRange}</text>

  <!-- ── Column 2: Current Streak ── -->
  <!-- Ring (circle outline) -->
  <circle cx="${col2}" cy="84" r="40" fill="none" stroke="${ringColor}" stroke-width="4" opacity="0.25"/>
  <circle cx="${col2}" cy="84" r="40" fill="none" stroke="${ringColor}" stroke-width="4"
    stroke-dasharray="188" stroke-dashoffset="${stats.currentStreak > 0 ? 0 : 188}"
    stroke-linecap="round" transform="rotate(-90 ${col2} 84)"/>

  <!-- Fire emoji / icon inside ring -->
  <text x="${col2}" y="78" text-anchor="middle" font-size="22">${stats.currentStreak > 0 ? '🔥' : '💤'}</text>
  <!-- Streak number -->
  <text x="${col2}" y="99" text-anchor="middle" class="streak-big" fill="${ringColor}">${stats.currentStreak}</text>

  <!-- Label below ring -->
  <text x="${col2}" y="143" text-anchor="middle" class="streak-label" fill="${theme.title}">Current Streak</text>
  <!-- Date sub-label -->
  <text x="${col2}" y="159" text-anchor="middle" class="streak-sub" fill="${theme.secondary}">${currentStreakRange}</text>

  <!-- ── Column 3: Longest Streak ── -->
  <!-- Big number -->
  <text x="${col3}" y="100" text-anchor="middle" class="streak-big" fill="${theme.accent}">${stats.longestStreak}</text>
  <!-- Label -->
  <text x="${col3}" y="124" text-anchor="middle" class="streak-label" fill="${theme.text}">Longest Streak</text>
  <!-- Date sub-label -->
  <text x="${col3}" y="143" text-anchor="middle" class="streak-sub" fill="${theme.secondary}">${longestStreakRange}</text>

  <!-- Branding -->
  <text x="${cardWidth - 12}" y="${cardHeight - 10}" text-anchor="end" class="streak-brand" fill="${theme.secondary}" opacity="0.5">github.com/${stats.username}</text>
</svg>`.trim();
}
