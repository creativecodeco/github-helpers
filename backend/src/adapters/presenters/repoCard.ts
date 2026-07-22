import { RepoStats } from '@/domain/entities/RepoStats';
import { getTheme, getBackgroundDef } from './theme';

const ICONS = {
  repo: `<path d="M3 2.75A2.75 2.75 0 0 1 5.75 0h14.5a.75.75 0 0 1 .75.75v20.5a.75.75 0 0 1-.75.75h-6a.75.75 0 0 1 0-1.5h5.25v-4H5.75A2.75 2.75 0 0 1 3 14.25v-11.5zm1.5 0v11.5c0 .69.56 1.25 1.25 1.25H20v-9.5H5.75a2.75 2.75 0 0 1-2.75-2.75c0-.69.56-1.25 1.25-1.25h12.75a.75.75 0 0 1 0 1.5H4.5z"/>`,
  star: `<path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.786 1.4 8.167L12 18.896l-7.334 3.857 1.4-8.167L.132 9.21l8.2-1.192L12 .587z"/>`,
  fork: `<path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.803c0 .528.093 1.048.273 1.536a4.387 4.387 0 001.42 2.138l3.11 2.333v3.197a2.251 2.251 0 101.5 0v-3.79c0-.529-.093-1.05-.273-1.538a4.387 4.387 0 00-1.42-2.137l-3.11-2.333V5.372zm6.5-2.122a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.803a4.389 4.389 0 001.693 3.447l3.11 2.333v3.197a2.251 2.251 0 101.5 0v-3.79a4.389 4.389 0 00-1.693-3.447l-3.11-2.333V5.372zM15 13.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/>`,
  license: `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>`
};

function wrapText(text: string, maxChars: number = 62): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).length > maxChars) {
      lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine += (currentLine ? ' ' : '') + word;
    }
  }
  if (currentLine) {
    lines.push(currentLine.trim());
  }
  return lines;
}

export function renderRepoCard(
  repo: RepoStats,
  themeName?: string,
  overrides?: Record<string, string>
): string {
  const theme = getTheme(themeName, overrides);
  const cardWidth = 495;
  const cardHeight = 195;
  const widthAttr = overrides?.cardWidth || `${cardWidth}`;

  // Background style: gradient support
  const backgroundDef = getBackgroundDef(theme, 'bg');

  // Wrap description text
  const descLines = wrapText(repo.description, 64).slice(0, 2); // max 2 lines
  const descTextElements = descLines.map((line, idx) => {
    return `<text x="25" y="${80 + idx * 20}" class="desc">${line}</text>`;
  });

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${widthAttr}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}">
      <defs>
        ${backgroundDef}
        <style>
          .title { font-family: 'Segoe UI', Ubuntu, sans-serif; font-weight: 700; font-size: 16px; fill: ${theme.title}; }
          .owner { font-family: 'Segoe UI', Ubuntu, sans-serif; font-weight: 500; font-size: 12px; fill: ${theme.secondary}; }
          .desc { font-family: 'Segoe UI', Ubuntu, sans-serif; font-weight: 400; font-size: 12.5px; fill: ${theme.text}; }
          .label { font-family: 'Segoe UI', Ubuntu, sans-serif; font-weight: 600; font-size: 12px; fill: ${theme.text}; }
          .value { font-family: 'Segoe UI', Ubuntu, sans-serif; font-weight: 700; font-size: 12.5px; fill: ${theme.accent}; }
          .icon { fill: ${theme.accent}; }
        </style>
      </defs>

      <!-- Card Background -->
      <rect width="${cardWidth}" height="${cardHeight}" rx="12" fill="url(#bg)" stroke="${theme.border}" stroke-width="1.5" />

      <!-- Repository Header -->
      <g transform="translate(25, 28)">
        <svg class="icon" viewBox="0 0 24 24" width="20" height="20" x="0" y="0">
          ${ICONS.repo}
        </svg>
        <text x="28" y="15" class="title">${repo.name}</text>
        <text x="28" y="-2" class="owner">${repo.owner} /</text>
      </g>

      <!-- Description Section -->
      <g>
        ${descTextElements.join('\n')}
      </g>

      <!-- Decorative Divider -->
      <line x1="25" y1="145" x2="470" y2="145" stroke="${theme.border}" stroke-dasharray="2, 2" stroke-width="1" />

      <!-- Footer Metrics -->
      <g transform="translate(25, 158)">
        <!-- Language -->
        <g transform="translate(0, 0)">
          <circle cx="6" cy="6" r="5" fill="${repo.languageColor}" />
          <text x="16" y="10" class="label">${repo.language}</text>
        </g>

        <!-- Stars -->
        <g transform="translate(140, 0)">
          <svg class="icon" viewBox="0 0 24 24" width="14" height="14" x="0" y="-2">
            ${ICONS.star}
          </svg>
          <text x="18" y="10" class="label">Estrellas:</text>
          <text x="80" y="10" class="value">${repo.stars}</text>
        </g>

        <!-- Forks -->
        <g transform="translate(260, 0)">
          <svg class="icon" viewBox="0 0 24 24" width="14" height="14" x="0" y="-2">
            ${ICONS.fork}
          </svg>
          <text x="18" y="10" class="label">Forks:</text>
          <text x="60" y="10" class="value">${repo.forks}</text>
        </g>

        <!-- License -->
        <g transform="translate(365, 0)">
          <svg class="icon" viewBox="0 0 24 24" width="14" height="14" x="0" y="-2">
            ${ICONS.license}
          </svg>
          <text x="18" y="10" class="value" font-size="11.5">${repo.license}</text>
        </g>
      </g>

      <!-- Brand Logo / Subtitle -->
      <text x="470" y="25" text-anchor="end" font-family="'Segoe UI', Ubuntu, sans-serif" font-weight="600" font-size="9px" fill="${theme.secondary}" opacity="0.6">
        github.com/${repo.owner}/${repo.name}
      </text>
    </svg>
  `.trim();
}
