export interface TranslationSet {
  stats: {
    commits: string;
    stars: string;
    followers: string;
    prs: string;
    issues: string;
    forks: string;
  };
  languages: {
    title: string;
  };
  rank: {
    title: string;
    collab: string;
    rankLegendary: string;
    rankOutstanding: string;
    rankActive: string;
    rankGrowing: string;
  };
  streak: {
    title: string;
    current: string;
    max: string;
    total: string;
    days: string;
    noStreak: string;
    present: string;
  };
  trophies: {
    title: string;
  };
  topRepos: {
    title: string;
    stars: string;
    noLicense: string;
  };
}

export const TRANSLATIONS: Record<'es' | 'en', TranslationSet> = {
  es: {
    stats: {
      commits: 'Commits:',
      stars: 'Estrellas:',
      followers: 'Seguidores:',
      prs: 'PRs:',
      issues: 'Issues:',
      forks: 'Forks:'
    },
    languages: {
      title: 'Lenguajes Más Usados'
    },
    rank: {
      title: 'Rango de Desarrollador',
      collab: 'Índice de Colaboración',
      rankLegendary: 'Desarrollador Legendario / Contribuidor Elite',
      rankOutstanding: 'Desarrollador Sobresaliente / Muy Activo',
      rankActive: 'Desarrollador Activo y Colaborativo',
      rankGrowing: 'Desarrollador en crecimiento'
    },
    streak: {
      title: 'Racha de Contribuciones',
      current: 'Racha Actual',
      max: 'Racha Máxima',
      total: 'Total Contribuciones',
      days: 'días',
      noStreak: 'Sin racha activa',
      present: 'Presente'
    },
    trophies: {
      title: 'Trofeos de GitHub'
    },
    topRepos: {
      title: 'Top Repositorios',
      stars: 'por estrellas',
      noLicense: 'Sin Licencia'
    }
  },
  en: {
    stats: {
      commits: 'Commits:',
      stars: 'Stars:',
      followers: 'Followers:',
      prs: 'PRs:',
      issues: 'Issues:',
      forks: 'Forks:'
    },
    languages: {
      title: 'Most Used Languages'
    },
    rank: {
      title: 'Developer Rank',
      collab: 'Collaboration Index',
      rankLegendary: 'Legendary Developer / Elite Contributor',
      rankOutstanding: 'Outstanding Developer / Very Active',
      rankActive: 'Active & Collaborative Developer',
      rankGrowing: 'Growing Developer'
    },
    streak: {
      title: 'Contribution Streak',
      current: 'Current Streak',
      max: 'Longest Streak',
      total: 'Total Contributions',
      days: 'days',
      noStreak: 'No active streak',
      present: 'Present'
    },
    trophies: {
      title: 'GitHub Trophies'
    },
    topRepos: {
      title: 'Top Repositories',
      stars: 'by stars',
      noLicense: 'No License'
    }
  }
};

export function getTranslations(locale?: string): TranslationSet {
  const normalized = (locale || 'es').toLowerCase();
  if (normalized === 'en') {
    return TRANSLATIONS.en;
  }
  return TRANSLATIONS.es;
}
