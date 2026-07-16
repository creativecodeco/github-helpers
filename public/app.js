document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const usernameInput = document.getElementById('username-input');
  const repoInput = document.getElementById('repo-input');
  const btnGenerate = document.getElementById('btn-generate');
  const themesContainer = document.getElementById('themes-container');
  const themeOptions = document.querySelectorAll('.theme-option');

  const statsImg = document.getElementById('stats-img');
  const statsPlaceholder = document.getElementById('stats-placeholder');

  const languagesImg = document.getElementById('languages-img');
  const languagesPlaceholder = document.getElementById('languages-placeholder');

  const repoImg = document.getElementById('repo-img');
  const repoPlaceholder = document.getElementById('repo-placeholder');

  const rankImg = document.getElementById('rank-img');
  const rankPlaceholder = document.getElementById('rank-placeholder');

  const codeSection = document.getElementById('code-section');
  const markdownStatsCode = document.getElementById('markdown-stats-code');
  const markdownLanguagesCode = document.getElementById('markdown-languages-code');
  const markdownRepoCode = document.getElementById('markdown-repo-code');
  const markdownRankCode = document.getElementById('markdown-rank-code');

  const btnCopyStats = document.getElementById('btn-copy-stats');
  const btnCopyLanguages = document.getElementById('btn-copy-languages');
  const btnCopyRepo = document.getElementById('btn-copy-repo');
  const btnCopyRank = document.getElementById('btn-copy-rank');

  // Theme Toggle Elements
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const sunIcon = document.querySelector('.sun-icon');
  const moonIcon = document.querySelector('.moon-icon');

  // Application State
  let currentTheme = 'dark';
  let currentUsername = '';
  let currentRepo = '';

  // --- Theme Toggle Logic (Home Page Light/Dark Mode) ---
  const savedTheme = localStorage.getItem('site-theme') || 'dark';
  if (savedTheme === 'light') {
    enableLightMode();
  } else {
    enableDarkMode();
  }

  btnThemeToggle.addEventListener('click', () => {
    const isLight = document.body.classList.contains('light-mode');
    if (isLight) {
      enableDarkMode();
    } else {
      enableLightMode();
    }
  });

  function enableLightMode() {
    document.body.classList.add('light-mode');
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
    localStorage.setItem('site-theme', 'light');
  }

  function enableDarkMode() {
    document.body.classList.remove('light-mode');
    sunIcon.classList.remove('hidden');
    moonIcon.classList.add('hidden');
    localStorage.setItem('site-theme', 'dark');
  }

  // --- SVG Themes Selection logic ---
  themesContainer.addEventListener('click', (e) => {
    const option = e.target.closest('.theme-option');
    if (!option) return;

    themeOptions.forEach((opt) => opt.classList.remove('active'));
    option.classList.add('active');

    currentTheme = option.dataset.theme;

    if (currentUsername) {
      updateCards();
    }
  });

  // Generate button handler
  btnGenerate.addEventListener('click', () => {
    submitUsername();
  });

  // Enter key support in inputs
  usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      submitUsername();
    }
  });

  repoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      submitUsername();
    }
  });

  function submitUsername() {
    const usernameVal = usernameInput.value.trim();
    if (!usernameVal) {
      usernameInput.focus();
      return;
    }

    currentUsername = usernameVal;
    currentRepo = repoInput.value.trim();
    updateCards();
  }

  // Update image previews and Markdown blocks
  function updateCards() {
    if (!currentUsername) return;

    const origin = window.location.origin;
    const statsUrl = `${origin}/api/stats?username=${currentUsername}&theme=${currentTheme}`;
    const languagesUrl = `${origin}/api/languages?username=${currentUsername}&theme=${currentTheme}`;
    const rankUrl = `${origin}/api/rank?username=${currentUsername}&theme=${currentTheme}`;

    let repoUrl = `${origin}/api/repo?username=${currentUsername}&theme=${currentTheme}`;
    if (currentRepo) {
      repoUrl += `&repo=${encodeURIComponent(currentRepo)}`;
    }

    // 1. Show Loading State
    showImageLoading(statsImg, statsPlaceholder);
    showImageLoading(languagesImg, languagesPlaceholder);
    showImageLoading(repoImg, repoPlaceholder);
    showImageLoading(rankImg, rankPlaceholder);

    // 2. Set image sources with cache buster to force rendering updates in preview
    const cacheBuster = `&t=${Date.now()}`;
    statsImg.src = statsUrl + cacheBuster;
    languagesImg.src = languagesUrl + cacheBuster;
    repoImg.src = repoUrl + cacheBuster;
    rankImg.src = rankUrl + cacheBuster;

    // 3. Update Markdown Codes
    const markdownStats = `![GitHub Stats](${statsUrl})`;
    const markdownLanguages = `![Lenguajes más usados](${languagesUrl})`;
    const markdownRepo = `![Repositorio Destacado](${repoUrl})`;
    const markdownRank = `![Rango de Desarrollador](${rankUrl})`;

    markdownStatsCode.textContent = markdownStats;
    markdownLanguagesCode.textContent = markdownLanguages;
    markdownRepoCode.textContent = markdownRepo;
    markdownRankCode.textContent = markdownRank;

    // Reveal code output section
    codeSection.classList.remove('hidden');
  }

  // Manage image load cycles
  function showImageLoading(imgElement, placeholderElement) {
    imgElement.classList.add('hidden');
    placeholderElement.classList.remove('hidden');

    // Set appropriate SVG loader depending on which card it is
    let svgIcon = '';
    if (placeholderElement.id === 'stats-placeholder') {
      svgIcon = `
        <svg class="placeholder-svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      `;
    } else if (placeholderElement.id === 'languages-placeholder') {
      svgIcon = `
        <svg class="placeholder-svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      `;
    } else if (placeholderElement.id === 'repo-placeholder') {
      svgIcon = `
        <svg class="placeholder-svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20v3H6.5a1.5 1.5 0 0 0 0 3H20v2H6.5A2.5 2.5 0 0 1 4 22.5v-3z" />
          <path d="M6 2H20v15H6.5A2.5 2.5 0 0 0 4 19.5V3A1 1 0 0 1 5 2h1z" />
        </svg>
      `;
    } else {
      svgIcon = `
        <svg class="placeholder-svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="9" y1="9" x2="15" y2="15" />
          <line x1="15" y1="9" x2="9" y2="15" />
        </svg>
      `;
    }

    placeholderElement.querySelector('.pulse-icon').innerHTML = svgIcon;
    placeholderElement.querySelector('p').textContent = 'Consultando datos en GitHub...';
  }

  // Setup Image Load Listeners
  statsImg.addEventListener('load', () => {
    statsPlaceholder.classList.add('hidden');
    statsImg.classList.remove('hidden');
  });

  statsImg.addEventListener('error', () => {
    statsPlaceholder.querySelector('.pulse-icon').innerHTML = `
      <svg class="placeholder-svg error" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#f85149" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    `;
    statsPlaceholder.querySelector('p').textContent =
      'Error al cargar tarjeta. Verifica el usuario.';
  });

  languagesImg.addEventListener('load', () => {
    languagesPlaceholder.classList.add('hidden');
    languagesImg.classList.remove('hidden');
  });

  languagesImg.addEventListener('error', () => {
    languagesPlaceholder.querySelector('.pulse-icon').innerHTML = `
      <svg class="placeholder-svg error" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#f85149" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    `;
    languagesPlaceholder.querySelector('p').textContent = 'Error al cargar lenguajes.';
  });

  repoImg.addEventListener('load', () => {
    repoPlaceholder.classList.add('hidden');
    repoImg.classList.remove('hidden');
  });

  repoImg.addEventListener('error', () => {
    repoPlaceholder.querySelector('.pulse-icon').innerHTML = `
      <svg class="placeholder-svg error" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#f85149" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    `;
    repoPlaceholder.querySelector('p').textContent = 'Error al cargar repositorio.';
  });

  rankImg.addEventListener('load', () => {
    rankPlaceholder.classList.add('hidden');
    rankImg.classList.remove('hidden');
  });

  rankImg.addEventListener('error', () => {
    rankPlaceholder.querySelector('.pulse-icon').innerHTML = `
      <svg class="placeholder-svg error" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#f85149" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    `;
    rankPlaceholder.querySelector('p').textContent = 'Error al cargar rango.';
  });

  // Setup Clipboard Copy handlers
  setupCopyButton(btnCopyStats, markdownStatsCode);
  setupCopyButton(btnCopyLanguages, markdownLanguagesCode);
  setupCopyButton(btnCopyRepo, markdownRepoCode);
  setupCopyButton(btnCopyRank, markdownRankCode);

  function setupCopyButton(button, codeElement) {
    button.addEventListener('click', async () => {
      const codeText = codeElement.textContent;
      try {
        await navigator.clipboard.writeText(codeText);

        // Success Feedback
        button.classList.add('copied');
        button.querySelector('.copy-text').textContent = '¡Copiado!';

        // Toggle SVGs
        button.querySelector('.icon-copy').classList.add('hidden');
        button.querySelector('.icon-check').classList.remove('hidden');

        setTimeout(() => {
          button.classList.remove('copied');
          button.querySelector('.copy-text').textContent = 'Copiar';
          button.querySelector('.icon-copy').classList.remove('hidden');
          button.querySelector('.icon-check').classList.add('hidden');
        }, 2000);
      } catch (err) {
        console.error('Error al copiar al portapapeles:', err);
      }
    });
  }
});
