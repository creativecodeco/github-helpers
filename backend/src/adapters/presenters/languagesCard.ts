import { LanguageStat } from '@/domain/entities/LanguageStat';
import { getTheme, getBackgroundDef } from './theme';
import { getTranslations } from './i18n';

export function renderLanguagesCard(
  languages: LanguageStat[],
  themeName?: string,
  overrides?: Record<string, string>,
  username?: string
): string {
  const theme = getTheme(themeName, overrides);
  const t = getTranslations(overrides?.locale);
  const cardWidth = 495;
  const cardHeight = 195;
  const widthAttr = overrides?.cardWidth || `${cardWidth}`;

  // Background style: gradient support
  const backgroundDef = getBackgroundDef(theme, 'bg');

  // Filter languages with percentage > 0 to render in the bar
  const validLanguages = languages.filter((l) => l.percentage > 0);

  // Generate stacked bar segments
  let currentX = 25;
  const barWidth = 445;
  const barSegments: string[] = [];

  validLanguages.forEach((lang) => {
    const segmentWidth = (lang.percentage / 100) * barWidth;
    barSegments.push(
      `<rect x="${currentX}" y="65" width="${segmentWidth}" height="12" fill="${lang.color}" />`
    );
    currentX += segmentWidth;
  });

  // Generate Legend (2 columns layout)
  // Col 1: indices 0, 2, 4, 6
  // Col 2: indices 1, 3, 5
  const legendItems: string[] = [];
  languages.forEach((lang, index) => {
    const isCol2 = index % 2 !== 0;
    const colX = isCol2 ? 260 : 25;
    const rowY = 105 + Math.floor(index / 2) * 23;

    legendItems.push(`
      <g transform="translate(${colX}, ${rowY})">
        <circle cx="6" cy="6" r="6" fill="${lang.color}" />
        <text x="20" y="10" class="legend-name">${lang.name}</text>
        <text x="140" y="10" class="legend-percent">${lang.percentage}%</text>
      </g>
    `);
  });

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${widthAttr}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}">
      <defs>
        ${backgroundDef}
        <clipPath id="bar-clip">
          <rect x="25" y="65" width="${barWidth}" height="12" rx="6" />
        </clipPath>
        <style>
          .title { font-family: 'Segoe UI', Ubuntu, Sans-Serif; font-weight: 700; font-size: 16px; fill: ${theme.title}; }
          .legend-name { font-family: 'Segoe UI', Ubuntu, Sans-Serif; font-weight: 600; font-size: 12.5px; fill: ${theme.text}; }
          .legend-percent { font-family: 'Segoe UI', Ubuntu, Sans-Serif; font-weight: 500; font-size: 12.5px; fill: ${theme.secondary}; }
        </style>
      </defs>

      <!-- Card Background -->
      <rect width="${cardWidth}" height="${cardHeight}" rx="12" fill="url(#bg)" stroke="${theme.border}" stroke-width="1.5" />

      <!-- Title -->
      <text x="25" y="42" class="title">${t.languages.title}</text>

      <!-- Stacked Progress Bar -->
      <g clip-path="url(#bar-clip)">
        ${barSegments.join('\n')}
      </g>

      <!-- Legend Grid -->
      <g>
        ${legendItems.join('\n')}
      </g>

      <!-- Brand Logo / Subtitle -->
      <text x="470" y="25" text-anchor="end" font-family="'Segoe UI', Ubuntu, Sans-Serif" font-weight="600" font-size="9px" fill="${theme.secondary}" opacity="0.6">
        ${username ? `github.com/${username}` : ''}
      </text>
    </svg>
  `.trim();
}
