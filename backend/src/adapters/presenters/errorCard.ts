import { escapeXml } from '@/utils/escape';

/**
 * Renders a standardized SVG error card to display inside GitHub README <img> tags.
 * All user-provided messages are XML-escaped before rendering.
 */
export function renderErrorCard(message: string): string {
  const escapedMessage = escapeXml(message);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="495" height="195" viewBox="0 0 495 195">
  <rect width="495" height="195" rx="12" fill="#0d1117" stroke="#f85149" stroke-width="2" />
  <g transform="translate(25, 45)">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#f85149" transform="scale(1.5)"/>
    <text x="45" y="18" font-family="'Segoe UI', Ubuntu, sans-serif" font-weight="bold" font-size="18" fill="#f85149">Error en GitHub Helpers</text>
    <text x="45" y="42" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="14" fill="#c9d1d9">${escapedMessage}</text>
    <text x="0" y="95" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="11" fill="#8b949e">Verifica el nombre de usuario o intenta más tarde.</text>
  </g>
  <text x="470" y="25" text-anchor="end" font-family="'Segoe UI', Ubuntu, sans-serif" font-weight="600" font-size="9px" fill="#8b949e" opacity="0.6">
    CreativeCode.com.co
  </text>
</svg>`.trim();
}
