import { getTheme } from './theme';
import { escapeXml } from '@/utils/escape';

const COLOR_MAP: Record<string, string> = {
  brightgreen: '#4c1',
  green: '#97ca00',
  yellowgreen: '#a4a61d',
  yellow: '#dfb317',
  orange: '#fe7d37',
  red: '#e05d44',
  blue: '#007ec6',
  lightgrey: '#9f9f9f',
  grey: '#555',
  black: '#000000',
  white: '#ffffff'
};

function resolveColor(colorParam?: string, themeParam?: string): string {
  if (colorParam) {
    const cleanColor = colorParam.trim().toLowerCase();
    if (COLOR_MAP[cleanColor]) {
      return COLOR_MAP[cleanColor];
    }
    // Support custom hex codes like #007ec6 or 007ec6
    if (/^#[0-9a-f]{3,6}$/i.test(cleanColor)) {
      return cleanColor;
    }
    if (/^[0-9a-f]{3,6}$/i.test(cleanColor)) {
      return `#${cleanColor}`;
    }
  }

  // Fallback to theme accent color
  const theme = getTheme(themeParam);
  return theme.accent;
}


export function renderViewsBadge(
  count: number,
  label?: string,
  colorParam?: string,
  themeParam?: string,
  styleParam?: string
): string {
  const rawLabel = typeof label === 'string' && label.trim() !== '' ? label : 'Profile views';
  const rawCount = count.toLocaleString();

  const labelText = escapeXml(rawLabel);
  const countText = escapeXml(rawCount);

  const isFlat = styleParam?.toLowerCase() !== 'flat-square';
  const rightColor = resolveColor(colorParam, themeParam);

  // Dynamic L/R width calculation (approximate characters width of raw text)
  const LWidth = Math.max(77, Math.round(rawLabel.length * 6.2 + 10));
  const RWidth = Math.max(30, Math.round(rawCount.length * 7.5 + 10));
  const totalWidth = LWidth + RWidth;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${labelText}: ${countText}">
      <linearGradient id="s" x2="0" y2="100%">
        <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
        <stop offset="1" stop-opacity=".1"/>
      </linearGradient>
      <clipPath id="r">
        <rect width="${totalWidth}" height="20" rx="${isFlat ? 3 : 0}" fill="#fff"/>
      </clipPath>
      <g clip-path="url(#r)">
        <rect width="${LWidth}" height="20" fill="#555"/>
        <rect x="${LWidth}" width="${RWidth}" height="20" fill="${rightColor}"/>
        <rect width="${totalWidth}" height="20" fill="url(#s)"/>
      </g>
      <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
        ${
          isFlat
            ? `
        <text x="${LWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${labelText}</text>
        <text x="${LWidth + RWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${countText}</text>
        `
            : ''
        }
        <text x="${LWidth / 2}" y="14">${labelText}</text>
        <text x="${LWidth + RWidth / 2}" y="14">${countText}</text>
      </g>
    </svg>
  `.trim();
}
