export interface Theme {
  bg: string;
  text: string;
  title: string;
  accent: string;
  secondary: string;
  border: string;
  bgGradient?: string; // CSS background linear-gradient if desired
}

export const THEMES: Record<string, Theme> = {
  dark: {
    bg: '#0d1117',
    text: '#c9d1d9',
    title: '#58a6ff',
    accent: '#58a6ff',
    secondary: '#8b949e',
    border: '#30363d'
  },
  light: {
    bg: '#ffffff',
    text: '#24292f',
    title: '#0969da',
    accent: '#0969da',
    secondary: '#57606a',
    border: '#d0d7de'
  },
  neon: {
    bg: '#050505',
    text: '#ffffff',
    title: '#00ff66',
    accent: '#00ff66',
    secondary: '#b3b3b3',
    border: '#00ff66',
    bgGradient: 'linear-gradient(135deg, #050505 0%, #12011a 100%)'
  },
  glassmorphism: {
    bg: 'rgba(15, 23, 42, 0.65)',
    text: '#e2e8f0',
    title: '#38bdf8',
    accent: '#38bdf8',
    secondary: '#94a3b8',
    border: 'rgba(255, 255, 255, 0.1)',
    bgGradient: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)'
  },
  solarized: {
    bg: '#002b36',
    text: '#839496',
    title: '#268bd2',
    accent: '#2aa198',
    secondary: '#586e75',
    border: '#073642'
  },
  radical: {
    bg: '#141321',
    text: '#a9fef7',
    title: '#fe428e',
    accent: '#fe428e',
    secondary: '#9e9e9e',
    border: '#1a1830',
    bgGradient: 'linear-gradient(135deg, #141321 0%, #200b2e 100%)'
  },
  tokyonight: {
    bg: '#1a1b26',
    text: '#a9b1d6',
    title: '#7aa2f7',
    accent: '#79dac8',
    secondary: '#565f89',
    border: '#383e5a',
    bgGradient: 'linear-gradient(135deg, #1a1b26 0%, #16161e 100%)'
  },
  catppuccin_mocha: {
    bg: '#1e1e2e',
    text: '#cdd6f4',
    title: '#cba6f7',
    accent: '#89b4fa',
    secondary: '#a6adc8',
    border: '#45475a',
    bgGradient: 'linear-gradient(135deg, #1e1e2e 0%, #11111b 100%)'
  },
  nord: {
    bg: '#2e3440',
    text: '#d8dee9',
    title: '#88c0d0',
    accent: '#81a1c1',
    secondary: '#e5e9f0',
    border: '#4c566a',
    bgGradient: 'linear-gradient(135deg, #2e3440 0%, #242933 100%)'
  },
  cyberpunk: {
    bg: '#090d16',
    text: '#00f0ff',
    title: '#ff0055',
    accent: '#ffe600',
    secondary: '#7685a0',
    border: '#ff0055',
    bgGradient: 'linear-gradient(135deg, #090d16 0%, #1a0022 100%)'
  },
  gruvbox: {
    bg: '#282828',
    text: '#ebdbb2',
    title: '#fabd2f',
    accent: '#fe8019',
    secondary: '#a89984',
    border: '#504945'
  },
  synthwave: {
    bg: '#1a102f',
    text: '#f0e6f6',
    title: '#ff7edb',
    accent: '#36f9f6',
    secondary: '#b39ddb',
    border: '#ff7edb',
    bgGradient: 'linear-gradient(135deg, #1a102f 0%, #2d124d 100%)'
  }
};

export function getTheme(themeName?: string, overrides?: Record<string, string>): Theme {
  let baseTheme = THEMES.dark;
  if (themeName) {
    const name = themeName.toLowerCase();
    baseTheme = THEMES[name] || THEMES.dark;
  }

  if (!overrides) return baseTheme;

  const formatColor = (val?: string) => {
    if (!val) return undefined;
    if (
      val.startsWith('#') ||
      val.startsWith('rgb') ||
      val.startsWith('hsl') ||
      val.startsWith('rgba')
    )
      return val;
    // Assume hex code if it contains valid characters
    if (/^[0-9a-fA-F]{3,8}$/.test(val)) return `#${val}`;
    return val;
  };

  return {
    bg: formatColor(overrides.bg) || baseTheme.bg,
    text: formatColor(overrides.text) || baseTheme.text,
    title: formatColor(overrides.title) || baseTheme.title,
    accent: formatColor(overrides.accent) || baseTheme.accent,
    secondary: formatColor(overrides.secondary) || baseTheme.secondary,
    border: formatColor(overrides.border) || baseTheme.border,
    bgGradient: overrides.bgGradient || baseTheme.bgGradient
  };
}

export function getBackgroundDef(theme: Theme, gradientId: string = 'bg'): string {
  return theme.bgGradient
    ? `<linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
         <stop offset="0%" stop-color="${theme.bgGradient.match(/#[0-9a-fA-F]{3,8}/g)?.[0] || theme.bg}" />
         <stop offset="100%" stop-color="${theme.bgGradient.match(/#[0-9a-fA-F]{3,8}/g)?.[1] || theme.bg}" />
       </linearGradient>`
    : `<linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
         <stop offset="0%" stop-color="${theme.bg}" />
         <stop offset="100%" stop-color="${theme.bg}" />
       </linearGradient>`;
}
